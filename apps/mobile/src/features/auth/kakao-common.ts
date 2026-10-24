// 카카오 로그인의 휴대폰 · 웹이 같이 쓰는 것. 휴대폰은 kakao.ts, 웹(개발 확인용)은 kakao.web.ts.

export type KakaoTokens = { idToken: string; accessToken: string; nonce: string };

/** needs_dev_build: Expo Go라 카카오 모듈이 없음 · not_configured: 앱 키 없음 ·
 *  no_id_token: 카카오 앱의 OpenID Connect가 꺼짐 · no_code: 웹에서 돌아온 주소에 인가 코드가 없음 */
export class KakaoLoginError extends Error {
  constructor(readonly code: "needs_dev_build" | "not_configured" | "no_id_token" | "no_code") {
    super(code);
  }
}

/** 사람이 카카오 화면에서 취소했는지 (카카오 SDK의 Cancelled · 웹의 access_denied) */
export function isKakaoCancel(e: unknown): boolean {
  const code = (e as { code?: unknown } | null)?.code;
  return typeof code === "string" && /cancel|access_denied/i.test(code);
}
