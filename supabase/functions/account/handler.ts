// 계정 (계획 3-6). 탈퇴: 카카오 연결 끊기 → 내 근황 사진 파일 지우기 → 계정 지우기.
// 계정을 지우면 DB가 내 줄(답 · 메모 · 근황 · 만든 질문 · 설정)을 지우고, 가족 연결 줄은 내 칸만 비워 '상대 탈퇴'로 바꾼다
// (data-model.md 4장). 상대가 쓴 답 · 메모는 남는다. 중간에 실패하면 다시 불러서 이어 하면 된다(이미 끝난 단계는 그냥 지나감).

import { requireUser, type Verifier } from "../_shared/auth.ts";
import { handle, HttpError, ok } from "../_shared/http.ts";

/** DB · 저장소에 하는 일. 시험에서는 가짜로 바꿔 끼운다 */
export type AccountStore = {
  /** 카카오 회원번호(Auth의 카카오 연결). 카카오로 가입하지 않았으면 null */
  kakaoId(uid: string): Promise<string | null>;
  /** 내가 올린 근황 사진(작은 그림 포함) 경로 */
  photoPaths(uid: string): Promise<string[]>;
  removePhotos(paths: string[]): Promise<void>;
  /** 계정 지우기. 이미 없으면 그냥 지나간다 */
  deleteUser(uid: string): Promise<void>;
  /** 계정을 지울 때 지울 목록에 오른 사진 경로를 뺀다(파일은 이미 지움) */
  clearTrash(paths: string[]): Promise<void>;
};

/** 카카오 연결 끊기. 이미 끊긴 사용자는 not_linked */
export type KakaoUnlink = (kakaoId: string) => Promise<"unlinked" | "not_linked">;

const CHUNK = 100;

export function makeHandler(deps: {
  verify?: Verifier;
  store: () => AccountStore;
  /** 카카오 어드민 키가 없으면 null(연결 끊기를 건너뛰고 알려 준다) */
  unlink: () => KakaoUnlink | null;
}) {
  return handle(async (req) => {
    if (req.method !== "POST") throw new HttpError(405, "method_not_allowed");
    const uid = await requireUser(req, deps.verify);
    const body = (await req.json().catch(() => ({}))) as { action?: string };
    if (body.action !== "withdraw") throw new HttpError(400, "unknown_action");

    const store = deps.store();
    const unlink = deps.unlink();
    const kakaoId = await store.kakaoId(uid);
    let kakao: "unlinked" | "not_linked" | "skipped" | "none" = "none";
    if (kakaoId) {
      if (!unlink) kakao = "skipped";
      else {
        try {
          kakao = await unlink(kakaoId);
        } catch (e) {
          console.error(e);
          throw new HttpError(502, "kakao_unlink_failed", "카카오 연결 끊기 실패");
        }
      }
    }

    const paths = await store.photoPaths(uid);
    for (let i = 0; i < paths.length; i += CHUNK) await store.removePhotos(paths.slice(i, i + CHUNK));
    await store.deleteUser(uid);
    if (paths.length) await store.clearTrash(paths);

    return ok({ withdrawn: true, kakao, photos: paths.length });
  });
}
