// 부른 사람 확인. 앱이 보낸 로그인 토큰(Authorization: Bearer …)을 검증해서 사용자 ID를 얻는다.
// 새 방식 열쇠는 게이트웨이의 verify_jwt와 맞지 않아서, 함수마다 verify_jwt = false로 두고 여기서 확인한다.

import { createClient } from "@supabase/supabase-js";
import { env, supabaseKey } from "./env.ts";
import { HttpError } from "./http.ts";

/** 토큰이 맞으면 사용자 ID, 아니면 null. 시험에서는 가짜로 바꿔 끼운다. */
export type Verifier = (token: string) => Promise<string | null>;

export const verifyWithSupabase: Verifier = async (token) => {
  const supabase = createClient(env("SUPABASE_URL"), supabaseKey("publishable"), {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data) return null;
  // 공개 키 자체로 부르면 role이 anon이고 sub가 없다
  return data.claims.role === "authenticated" && data.claims.sub ? data.claims.sub : null;
};

function bearer(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m?.[1] ?? null;
}

/** 로그인한 사람만. 아니면 401. */
export async function requireUser(req: Request, verify: Verifier = verifyWithSupabase): Promise<string> {
  const token = bearer(req);
  const id = token ? await verify(token) : null;
  if (!id) throw new HttpError(401, "unauthorized", "로그인이 필요합니다");
  return id;
}

/** 로그인하지 않아도 되는 곳. 토큰이 있는데 틀리면 401. */
export async function optionalUser(
  req: Request,
  verify: Verifier = verifyWithSupabase,
): Promise<string | null> {
  const token = bearer(req);
  if (!token) return null;
  const id = await verify(token);
  if (!id) throw new HttpError(401, "unauthorized", "로그인 정보가 맞지 않습니다");
  return id;
}
