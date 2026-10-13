// 글꼴. 앱 본문은 Pretendard, 홈 왼쪽 위 '이어봄'만 Jua(39차 시안).
// 안드로이드는 굵기마다 글꼴 파일이 따로 있어야 해서 굵기별 이름을 둔다.
// 시안의 온보딩 글씨체(Figtree · Gowun Dodum · Caprasimo)는 가입 화면(3-4)에서 더한다.

import { Jua_400Regular } from "@expo-google-fonts/jua";
import { useFonts } from "expo-font";

export type Weight = 400 | 500 | 600 | 700 | 800;

export const FAMILY: Record<Weight, string> = {
  400: "Pretendard-Regular",
  500: "Pretendard-Medium",
  600: "Pretendard-SemiBold",
  700: "Pretendard-Bold",
  800: "Pretendard-ExtraBold",
};

export const WORDMARK = "Jua";

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    "Pretendard-Regular": require("pretendard/dist/public/static/Pretendard-Regular.otf"),
    "Pretendard-Medium": require("pretendard/dist/public/static/Pretendard-Medium.otf"),
    "Pretendard-SemiBold": require("pretendard/dist/public/static/Pretendard-SemiBold.otf"),
    "Pretendard-Bold": require("pretendard/dist/public/static/Pretendard-Bold.otf"),
    "Pretendard-ExtraBold": require("pretendard/dist/public/static/Pretendard-ExtraBold.otf"),
    [WORDMARK]: Jua_400Regular,
  });
  // 글꼴을 못 불러와도 앱은 기본 글꼴로 연다
  return loaded || !!error;
}
