import { QueryClientProvider } from "@tanstack/react-query";
import { SplashScreen, Stack, useSegments, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Component, useEffect, type ReactNode } from "react";
import { UserTextScale } from "@/features/my/text-scale";
import { reportError, setScreen, watchUncaughtErrors } from "@/lib/errors";
import { startEvents } from "@/lib/events";
import { queryClient } from "@/lib/query";
import { C, CrashView, ToastProvider, useAppFonts } from "@/ui";

SplashScreen.preventAutoHideAsync();
watchUncaughtErrors();
startEvents();

// 지금 화면을 오류 기록에 적을 수 있게 둔다. 묶음 이름 '(tabs)'는 뺀다
function ScreenWatch() {
  const segments = useSegments();
  const path = "/" + segments.filter((s) => !s.startsWith("(")).join("/");
  useEffect(() => setScreen(path), [path]);
  return null;
}

// 화면 하나를 그리다 오류가 나면 그 화면만 오류 화면으로 바꾼다(앞 화면 · 탭은 그대로).
// 기록은 한 번만 남기고, 다시 해 보기를 누르면 그 화면을 새로 그린다
class ScreenBoundary extends Component<{ children: ReactNode; onBack?: () => void }, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidCatch(error: unknown) {
    reportError("render", error);
  }
  render() {
    if (this.state.error === null) return this.props.children;
    return <CrashView onRetry={() => this.setState({ error: null })} onBack={this.props.onBack} />;
  }
}

/** 레이아웃 자체(글꼴 · 데이터 연결)가 그리다 실패했을 때. 다시 해 보기는 앱을 처음 화면부터 다시 그린다 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => reportError("render", error), [error]);
  return <CrashView onRetry={retry} />;
}

export default function RootLayout() {
  const fontsReady = useAppFonts();
  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync();
  }, [fontsReady]);
  if (!fontsReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <UserTextScale>
        <ToastProvider>
          <StatusBar style="dark" />
          <ScreenWatch />
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}
            screenLayout={({ children, navigation }) => (
              <ScreenBoundary onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}>
                {children}
              </ScreenBoundary>
            )}
          />
        </ToastProvider>
      </UserTextScale>
    </QueryClientProvider>
  );
}
