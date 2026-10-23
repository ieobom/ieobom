// 카카오 로그인, 개발 확인용 웹(localhost). 카카오 로그인 화면으로 갔다가 /auth/kakao 로 돌아오면
// 인가 코드를 토큰으로 바꾼다. 페이지가 새로 열리므로 일회용 값(nonce)은 탭에만 잠깐 둔다.
// 카카오 JavaScript SDK는 쓸 때 불러온다(버전과 해시를 고정).

import { initializeKakaoSDK } from "@react-native-kakao/core";
import { issueAccessTokenWithCodeWeb, login, logout } from "@react-native-kakao/user";
import { env } from "@/lib/env";
import { KakaoLoginError, type KakaoTokens } from "./kakao-common";
import { makeNonce } from "./nonce";

export { isKakaoCancel, KakaoLoginError, type KakaoTokens } from "./kakao-common";

const SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js";
const SDK_HASH = "sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy";
const NONCE_KEY = "ieobom.kakao.nonce";
const redirectUri = () => `${window.location.origin}/auth/kakao`;

let ready: Promise<void> | null = null;

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.integrity = SDK_HASH;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("kakao_sdk_load_failed"));
    document.head.appendChild(s);
  });
}

function sdk(): Promise<void> {
  if (!env.kakaoJsKey || !env.kakaoRestKey) return Promise.reject(new KakaoLoginError("not_configured"));
  ready ??= loadScript().then(() =>
    initializeKakaoSDK(env.kakaoNativeKey, {
      web: { javascriptKey: env.kakaoJsKey, restApiKey: env.kakaoRestKey },
    }),
  );
  return ready;
}

/** 카카오 로그인 화면으로 간다. 이 페이지를 떠나므로 끝나지 않는다 */
export async function kakaoLogin(): Promise<KakaoTokens> {
  await sdk();
  const nonce = await makeNonce();
  sessionStorage.setItem(NONCE_KEY, nonce.raw);
  await login({ nonce: nonce.hashed, web: { redirectUri: redirectUri() } });
  return new Promise<KakaoTokens>(() => undefined);
}

/** /auth/kakao 에서. 카카오가 준 인가 코드를 토큰으로 바꾼다 */
export async function finishKakaoWebLogin(code: string | undefined): Promise<KakaoTokens> {
  const nonce = sessionStorage.getItem(NONCE_KEY);
  sessionStorage.removeItem(NONCE_KEY);
  if (!code || !nonce) throw new KakaoLoginError("no_code");
  await sdk();
  const t = await issueAccessTokenWithCodeWeb({ code, redirectUri: redirectUri() });
  if (!t.idToken) throw new KakaoLoginError("no_id_token");
  return { idToken: t.idToken, accessToken: t.accessToken, nonce };
}

export async function kakaoLogout(): Promise<void> {
  try {
    await sdk();
    await logout();
  } catch {
    // 이미 끊겼으면 그대로
  }
}
