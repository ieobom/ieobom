// 앱 설정. 개발용 빌드(APP_VARIANT=development)는 이름과 번들 ID를 따로 둬서
// 시범 운영 앱과 한 휴대폰에 같이 깔 수 있게 한다.
import type { ExpoConfig } from "expo/config";

const dev = process.env.APP_VARIANT === "development";
const id = dev ? "com.ieobom.app.dev" : "com.ieobom.app";

const config: ExpoConfig = {
  name: dev ? "이어봄 개발" : "이어봄",
  slug: "ieobom",
  scheme: dev ? "ieobom-dev" : "ieobom",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: { bundleIdentifier: id, supportsTablet: false },
  android: { package: id },
  plugins: ["expo-router", "expo-status-bar", "expo-splash-screen", "expo-font"],
};

export default config;
