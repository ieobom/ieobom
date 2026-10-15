// 마이 화면들이 같이 쓰는 부품. 시안의 SettingsRow · 접었다 펴는 카드 · 보여요/안 보여요 목록.
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, CARD, IcoChevronDown, IcoChevronRight, IcoCross, IcoTick, T, Toggle } from "@/ui";

/** 설정 한 줄. toggle이면 오른쪽에 켜고 끄기, 아니면 화살표(chevron=false면 없음) */
export function SettingsRow({
  label,
  desc,
  onPress,
  toggled,
  chevron = true,
  danger = false,
}: {
  label: string;
  desc?: string;
  onPress: () => void;
  /** 켜고 끄기 줄이면 지금 값 */
  toggled?: boolean;
  chevron?: boolean;
  danger?: boolean;
}) {
  const toggle = toggled !== undefined;
  return (
    <Pressable
      accessibilityRole={toggle ? "switch" : "button"}
      accessibilityState={toggle ? { checked: toggled } : undefined}
      accessibilityLabel={desc ? `${label}, ${desc}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.flex}>
        <T size={16} weight={500} ls={-0.02} color={danger ? C.danger : C.text}>
          {label}
        </T>
        {desc ? (
          <T size={13} color={C.textTertiary} style={styles.desc}>
            {desc}
          </T>
        ) : null}
      </View>
      {toggle ? <Toggle display on={toggled} /> : chevron ? <IcoChevronRight /> : null}
    </Pressable>
  );
}

/** 흰 카드에 줄을 묶는다 */
export function Group({ children, last = false }: { children: ReactNode; last?: boolean }) {
  return <View style={[CARD, styles.group, last && styles.groupLast]}>{children}</View>;
}

/** 눌러서 펴는 카드 (질문 받는 횟수 · 주제) */
export function Expand({
  title,
  sub,
  open,
  onToggle,
  children,
}: {
  title: string;
  sub: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <View style={[CARD, styles.group]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${sub}`}
        onPress={onToggle}
        style={styles.row}
      >
        <View style={styles.flex}>
          <T size={16} weight={500} ls={-0.02}>
            {title}
          </T>
          <T size={13} color={C.textTertiary} style={styles.desc}>
            {sub}
          </T>
        </View>
        <View style={open && styles.flip}>
          <IcoChevronDown size={16} />
        </View>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

/** 보여요(✓) · 안 보여요(✕) 목록 */
export function MarkList({
  items,
  shown,
  size = 15,
}: {
  items: readonly string[];
  shown: boolean;
  size?: number;
}) {
  return (
    <View>
      {items.map((item) => (
        <View key={item} style={styles.markRow}>
          <View style={[styles.mark, { backgroundColor: shown ? C.primary : C.plainBg }]}>
            {shown ? <IcoTick size={10} /> : <IcoCross />}
          </View>
          <T size={size} lh={1.55} color={shown ? C.text : C.textSub} style={styles.flex}>
            {item}
          </T>
        </View>
      ))}
    </View>
  );
}

/** 화면 맨 아래 단추 자리 (저장) */
export function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bottom, { paddingBottom: Math.max(44, insets.bottom + 20) }]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  pressed: { opacity: 0.85 },
  desc: { marginTop: 2 },
  group: { overflow: "hidden", marginBottom: 16 },
  groupLast: { marginBottom: 32 },
  flip: { transform: [{ rotate: "180deg" }] },
  body: { paddingHorizontal: 18, paddingBottom: 18 },
  markRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  mark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  bottom: { paddingTop: 8, paddingHorizontal: 24 },
});
