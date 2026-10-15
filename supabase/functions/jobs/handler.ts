// 정해진 시간 작업(pg_cron)이 부르는 일. 금고의 cron_key와 같은 CRON_SECRET을 가진 부름만 받는다.
//   storage_cleanup (계획 7-11 · 9-6): 1시간 넘게 남은 통화 녹음, 지운 근황 사진, 하루 넘게 남은 올리다 만 사진을
//   Storage API로 지운다. 지울 목록은 DB 함수 storage_cleanup_targets가 정한다.

import { handle, HttpError, ok } from "../_shared/http.ts";

export type Targets = { call_audio: string[]; news_photos: string[] };

/** 저장소 · DB에 하는 일. 시험에서는 가짜로 바꿔 끼운다 */
export type Store = {
  targets(): Promise<Targets>;
  /** 실패하면 던진다. 없는 파일은 실패가 아니다 */
  remove(bucket: string, names: string[]): Promise<void>;
  /** 지운 파일을 지울 목록에서 뺀다 */
  done(bucket: string, names: string[]): Promise<void>;
};

const BUCKETS = { call_audio: "call-audio", news_photos: "news-photos" } as const;
// Storage API는 한 번에 여러 개를 지운다. 너무 길지 않게 나눈다
const CHUNK = 100;

/** 같은 길이 · 같은 글자인지. 글자마다 걸리는 시간이 같게 끝까지 본다 */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function storageCleanup(store: Store): Promise<Record<keyof Targets, number>> {
  const targets = await store.targets();
  const removed = { call_audio: 0, news_photos: 0 };
  for (const key of Object.keys(BUCKETS) as (keyof Targets)[]) {
    const names = targets[key];
    for (let i = 0; i < names.length; i += CHUNK) {
      const chunk = names.slice(i, i + CHUNK);
      await store.remove(BUCKETS[key], chunk);
      await store.done(BUCKETS[key], chunk);
      removed[key] += chunk.length;
    }
  }
  return removed;
}

export function makeHandler(deps: { secret: () => string; store: () => Store }) {
  return handle(async (req) => {
    if (req.method !== "POST") throw new HttpError(405, "method_not_allowed");
    // 열쇠를 아직 안 넣었으면 아무 부름도 받지 않는다
    const secret = deps.secret();
    if (!secret) throw new HttpError(503, "not_configured", "CRON_SECRET이 없습니다");
    const token = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "")?.[1] ?? "";
    if (!token || !same(token, secret)) throw new HttpError(401, "unauthorized");
    const body = (await req.json().catch(() => ({}))) as { job?: string };
    if (body.job === "storage_cleanup") return ok({ removed: await storageCleanup(deps.store()) });
    throw new HttpError(400, "unknown_job");
  });
}
