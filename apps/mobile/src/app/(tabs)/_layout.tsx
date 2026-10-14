// 아래 탭: 홈 · 기록 · 마이(39차). 탭 모양은 공통 부품 TabBar가 그린다.
import { Tabs } from "expo-router";
import { TabBar, type TabKey } from "@/ui";

const ROUTE: Record<TabKey, string> = { home: "index", archive: "archive", settings: "settings" };
const KEY: Record<string, TabKey> = { index: "home", archive: "archive", settings: "settings" };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <TabBar
          active={KEY[state.routes[state.index]?.name ?? "index"] ?? "home"}
          onTab={(key) => navigation.navigate(ROUTE[key])}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="archive" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
