// 카드와 기록 줄. 시안의 CARD · CardHead · Divider · Avatar · KindBadge · RecordRow · SheetHead.

import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Figure, MarkMemo, MarkNews, MarkQ } from "./icons";
import { T } from "./text";
import { C, CARD, KIND, type Kind } from "./theme";

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[CARD, style]}>{children}</View>;
}

/** 카드 맨 위 작은 제목 줄 */
export function CardHead({
  label,
  right,
  tone = "sub",
}: {
  label: string;
  right?: ReactNode;
  tone?: "sub" | "primary";
}) {
  return (
    <View style={styles.cardHead}>
      <T
        size={13}
        weight={700}
        ls={-0.01}
        color={tone === "primary" ? C.primary : C.textTertiary}
        style={styles.flex}
      >
        {label}
      </T>
      {right}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Avatar({
  size = 44,
  bg = C.primaryLight,
  color = C.primary,
}: {
  size?: number;
  bg?: string;
  color?: string;
}) {
  return (
    <View style={[styles.round, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Figure size={size} color={color} />
    </View>
  );
}

/** 메모 · 질문 · 근황 표시 동그라미 */
export function KindBadge({ kind, size = 36 }: { kind: Kind; size?: number }) {
  const m = Math.round(size * 0.47);
  return (
    <View
      aria-hidden
      style={[
        styles.round,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: KIND[kind].bg },
      ]}
    >
      {kind === "memo" ? (
        <MarkMemo size={m} />
      ) : kind === "question" ? (
        <MarkQ size={m} />
      ) : (
        <MarkNews size={m} />
      )}
    </View>
  );
}

/** 기록 목록의 한 줄. 글은 세 줄까지 보이고, below에 사진 줄 같은 것을 넣는다 */
export function RecordRow({
  kind,
  meta,
  text,
  muted = false,
  right,
  below,
  highlight = false,
  onPress,
  label,
}: {
  kind: Kind;
  meta: string;
  text: string;
  muted?: boolean;
  right?: ReactNode;
  below?: ReactNode;
  highlight?: boolean;
  onPress?: () => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        CARD,
        styles.record,
        highlight && { borderWidth: 1.5, borderColor: C.newsSoft },
        pressed && { opacity: 0.9 },
      ]}
    >
      <KindBadge kind={kind} />
      <View style={styles.flex}>
        <View style={styles.recordTop}>
          <T size={14} weight={700} color={KIND[kind].color} numberOfLines={1}>
            {KIND[kind].label}
          </T>
          <T size={13} color={C.textTertiary} numberOfLines={1} style={styles.flex}>
            {meta}
          </T>
          {right}
        </View>
        <T size={16} lh={1.55} ls={-0.01} color={muted ? C.textTertiary : C.text} numberOfLines={3}>
          {text}
        </T>
        {below ? <View style={styles.below}>{below}</View> : null}
      </View>
    </Pressable>
  );
}

/** 아래 창 맨 위: 종류 표시 + 종류 이름 + 날짜 */
export function SheetHead({
  kind,
  label,
  date,
  right,
}: {
  kind: Kind;
  label: string;
  date: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.sheetHead}>
      <KindBadge kind={kind} size={42} />
      <View style={styles.flex}>
        <T size={14} weight={700} color={KIND[kind].color} style={styles.sheetLabel}>
          {label}
        </T>
        <T size={19} weight={800} ls={-0.04}>
          {date}
        </T>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, minHeight: 22 },
  divider: { height: 1, backgroundColor: C.border },
  round: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  record: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 14,
    marginBottom: 10,
  },
  recordTop: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 20, marginBottom: 3 },
  below: { marginTop: 10 },
  sheetHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  sheetLabel: { marginBottom: 1 },
});
