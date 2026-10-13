import { QueryClientProvider } from "@tanstack/react-query";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { queryClient } from "@/lib/query";
import { C, TextScaleProvider, ToastProvider, useAppFonts } from "@/ui";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsReady = useAppFonts();
  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync();
  }, [fontsReady]);
  if (!fontsReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      {/* 글자 크게 보기 설정은 마이(10-8)에서 읽어 온다 */}
      <TextScaleProvider scale={1}>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
        </ToastProvider>
      </TextScaleProvider>
    </QueryClientProvider>
  );
}
