// 카카오 로그인 (계획 3-1, 휴대폰). 카카오톡이 있으면 카카오톡으로, 없으면 카카오 계정 화면으로 갔다가 돌아와
// ID 토큰을 받는다. 카카오 모듈은 이어봄 개발용 앱에만 들어 있어서, Expo Go에서는 불러오지 않고 안내만 한다.

import Constants, { ExecutionEnvironment } from "expo-constants";
import { env } from "@/lib/env";
import { KakaoLoginError, type KakaoTokens } from "./kakao-common";
import { makeNonce } from "./nonce";

export { isKakaoCancel, KakaoLoginError, type KakaoTokens } from "./kakao-common";

let ready: Promise<void> | null = null;

async function sdk() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new KakaoLoginError("needs_dev_build");
  }
  if (!env.kakaoNativeKey) throw new KakaoLoginError("not_configured");
  // 쓸 때 불러온다. Expo Go에는 이 모듈이 없어서 앱을 열 때 불러오면 앱이 멈춘다
  const [core, user] = await Promise.all([
    import("@react-native-kakao/core"),
    import("@react-native-kakao/user"),
  ]);
  ready ??= core.initializeKakaoSDK(env.kakaoNativeKey);
  await ready;
  return user;
}

export async function kakaoLogin(): Promise<KakaoTokens> {
  const user = await sdk();
  const nonce = await makeNonce();
  const t = await user.login({ nonce: nonce.hashed });
  if (!t.idToken) throw new KakaoLoginError("no_id_token");
  return { idToken: t.idToken, accessToken: t.accessToken, nonce: nonce.raw };
}

/** 웹에서만 쓴다. 휴대폰은 kakaoLogin이 바로 토큰을 준다 */
export const finishKakaoWebLogin: (code: string | undefined) => Promise<KakaoTokens> = async () => {
  throw new KakaoLoginError("no_code");
};

/** 이 휴대폰의 카카오 로그인도 끊는다(로그아웃 3-5). 실패해도 앱 로그아웃은 이어 간다 */
export async function kakaoLogout(): Promise<void> {
  try {
    await (await sdk()).logout();
  } catch {
    // 이미 끊겼거나 카카오 모듈이 없는 곳
  }
}
