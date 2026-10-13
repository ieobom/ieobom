// 서버 함수가 살아 있는지와 로그인 토큰이 통하는지 확인한다(계획 1-4, 1-6).

import { optionalUser, type Verifier } from "../_shared/auth.ts";
import { handle, HttpError, ok } from "../_shared/http.ts";

export function makeHandler(verify?: Verifier) {
  return handle(async (req) => {
    if (req.method !== "GET" && req.method !== "POST") throw new HttpError(405, "method_not_allowed");
    const user = await optionalUser(req, verify);
    return ok({ pong: true, user });
  });
}
