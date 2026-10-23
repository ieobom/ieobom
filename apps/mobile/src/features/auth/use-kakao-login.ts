// 카카오 → 서버 로그인 (계획 3-2). 카카오가 준 ID 토큰을 Supabase Auth에 넘기면, 처음이면 계정이 생기고
// 다시 오면 같은 계정으로 들어온다(카카오 회원번호는 Auth 쪽에만 남는다).
import type { Session } from "@supabase/supabase-js";
import { useRef, useState } from "react";
import { reportError } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import { isKakaoCancel, kakaoLogin, KakaoLoginError, type KakaoTokens } from "./kakao";

export async function signInWithKakao(t: KakaoTokens): Promise<void> {
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "kakao",
    token: t.idToken,
    access_token: t.accessToken,
    nonce: t.nonce,
  });
  if (error) throw error;
}

/** 카카오에서 받아 온 이름(닉네임). 가입의 이름 칸을 미리 채운다 */
export function kakaoName(session: Session | null | undefined): string {
  const meta = session?.user.user_metadata ?? {};
  const name = meta.nickname ?? meta.name ?? meta.full_name ?? "";
  return typeof name === "string" ? name.slice(0, 20) : "";
}

export type KakaoLoginState = {
  busy: boolean;
  /** 로그인이 안 됐다(취소는 빼고) */
  failed: boolean;
  start: () => void;
  /** 기다리는 화면의 '취소'. 늦게 온 결과는 버린다 */
  cancel: () => void;
};

/** onBlocked: Expo Go · 앱 키 없음처럼 로그인을 시작할 수 없을 때(화면이 안내한다) */
export function useKakaoLogin(
  onBlocked: (code: "needs_dev_build" | "not_configured") => void,
): KakaoLoginState {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const attempt = useRef(0);

  const start = () => {
    const mine = ++attempt.current;
    setBusy(true);
    setFailed(false);
    kakaoLogin()
      .then((t) => (mine === attempt.current ? signInWithKakao(t) : undefined))
      .catch((e: unknown) => {
        if (mine !== attempt.current || isKakaoCancel(e)) return;
        if (e instanceof KakaoLoginError && (e.code === "needs_dev_build" || e.code === "not_configured")) {
          onBlocked(e.code);
          return;
        }
        reportError("save", e);
        setFailed(true);
      })
      .finally(() => {
        if (mine === attempt.current) setBusy(false);
      });
  };

  const cancel = () => {
    attempt.current++;
    setBusy(false);
  };

  return { busy, failed, start, cancel };
}
