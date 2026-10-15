// 앱 설정. 개발용 빌드(APP_VARIANT=development)는 이름과 번들 ID를 따로 둬서
// 시범 운영 앱과 한 휴대폰에 같이 깔 수 있게 한다.
import type { ExpoConfig } from "expo/config";

const dev = process.env.APP_VARIANT === "development";
const id = dev ? "com.ieobom.app.dev" : "com.ieobom.app";

// 권한 창 설명 (계획 12-3). 마이크는 39차 시안의 권한 창 문구 그대로.
// 녹음 · 사진 모듈(12-4)을 넣을 때 그 플러그인의 권한 문구에도 이 값을 넘긴다.
// 알림 권한 창은 iOS · 안드로이드 모두 설명 문구를 받지 않는다(가입의 '가족 전화 받기' 화면이 먼저 알려 줌)
export const PERMISSION_TEXT = {
  microphone:
    "말로 답하기 · 근황과 가족 통화에 써요. 짧게 말한 내용은 글로 바꾼 뒤 지워요. 두 분 모두 통화 메모 초안을 켜면 통화도 녹음해 글로 바꾸고, 녹음은 바로 지워요.",
  photos: "근황에 붙일 사진을 고를 때 써요. 고른 사진만 줄여서 가족에게 보내요.",
};

const config: ExpoConfig = {
  name: dev ? "이어봄 개발" : "이어봄",
  slug: "ieobom",
  scheme: dev ? "ieobom-dev" : "ieobom",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: id,
    supportsTablet: false,
    infoPlist: {
      NSMicrophoneUsageDescription: PERMISSION_TEXT.microphone,
      NSPhotoLibraryUsageDescription: PERMISSION_TEXT.photos,
    },
  },
  android: { package: id },
  plugins: ["expo-router", "expo-status-bar", "expo-splash-screen", "expo-font"],
};

export default config;
