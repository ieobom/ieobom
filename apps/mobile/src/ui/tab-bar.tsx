// 아래 탭 (홈 · 기록 · 마이). 화면 연결은 10-5에서 한다.

import { Pressable, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IcoHome, IcoNote, IcoUser } from "./icons";
import { T } from "./text";
import { C } from "./theme";

export type TabKey = "home" | "archive" | "settings";

const TABS: { key: TabKey; label: string; Icon: typeof IcoHome }[] = [
  { key: "home", label: ko.tabs.home, Icon: IcoHome },
  { key: "archive", label: ko.tabs.archive, Icon: IcoNote },
  { key: "settings", label: ko.tabs.settings, Icon: IcoUser },
];

export function TabBar({ active, onTab }: { active: TabKey; onTab: (key: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {TABS.map(({ key, label, Icon }) => {
        const on = active === key;
        const color = on ? C.primary : C.textTertiary;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onTab(key)}
            style={styles.tab}
          >
            {on ? <View style={styles.indicator} /> : null}
            <Icon color={color} />
            <T size={12.5} weight={on ? 700 : 600} ls={-0.01} color={color} numberOfLines={1}>
              {label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.white },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    minHeight: 56,
  },
  indicator: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.primary,
  },
});
