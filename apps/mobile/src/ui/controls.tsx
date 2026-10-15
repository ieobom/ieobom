// 고르는 부품 · 글 넣는 칸. 시안의 Chip · Toggle · Option · Tag · input.

import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View, type TextStyle } from "react-native";
import { FAMILY } from "./fonts";
import { IcoTick } from "./icons";
import { T, useTextScale } from "./text";
import { C, R } from "./theme";

/** 둥근 칩 (근황 주제 · 종류 거르기) */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? C.primary : C.border,
          backgroundColor: selected ? C.primaryLight : C.white,
        },
      ]}
    >
      <T size={14} weight={500} ls={-0.01} color={selected ? C.primary : C.textSub} numberOfLines={1}>
        {label}
      </T>
    </Pressable>
  );
}

/** 켜고 끄기. display면 눌러지지 않는 표시만 */
export function Toggle({
  on,
  onChange,
  display = false,
  label,
}: {
  on: boolean;
  onChange?: () => void;
  display?: boolean;
  /** 읽어 주기용 이름 */
  label?: string;
}) {
  const body = (
    <View style={[styles.track, { backgroundColor: on ? C.primary : C.border }]}>
      <View style={[styles.knob, { left: on ? 23 : 3 }]} />
    </View>
  );
  if (display) return body;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onChange}
      hitSlop={8}
    >
      {body}
    </Pressable>
  );
}

/** 한 줄 선택지 (질문 횟수 · 관계 고르기). mark면 오른쪽에 동그라미 체크 */
export function Option({
  label,
  sub,
  selected = false,
  onPress,
  mark = false,
}: {
  label: string;
  sub?: string;
  selected?: boolean;
  onPress?: () => void;
  mark?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        {
          minHeight: sub ? 68 : 52,
          paddingVertical: sub ? 12 : 10,
          borderColor: selected ? C.primary : C.border,
          backgroundColor: selected ? C.primaryLight : C.bg,
        },
      ]}
    >
      <View style={styles.optionText}>
        <T size={16} weight={selected ? 600 : 400} ls={-0.01} color={selected ? C.primary : C.text}>
          {label}
        </T>
        {sub ? (
          <T size={13} color={selected ? C.primary : C.textTertiary} style={selected && { opacity: 0.8 }}>
            {sub}
          </T>
        ) : null}
      </View>
      {mark ? (
        <View
          style={[
            styles.mark,
            { backgroundColor: selected ? C.primary : C.bg, borderColor: selected ? C.primary : C.border },
          ]}
        >
          {selected ? <IcoTick /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

// 웹에서 누를 때 생기는 파란 테두리를 없앤다(시안의 outline: none)
const noOutline: TextStyle = Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as TextStyle) : {};

/** 한 줄 글 넣는 칸 (이름 바꾸기). 글자 크게 보기를 따른다 */
export function TextField({
  value,
  onChangeText,
  label,
  placeholder,
  maxLength,
}: {
  value: string;
  onChangeText: (v: string) => void;
  /** 읽어 주기용 이름 */
  label: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const scale = useTextScale();
  return (
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.disabledText}
      maxLength={maxLength}
      style={[noOutline, styles.field, { fontFamily: FAMILY[400], fontSize: 18 * scale }]}
    />
  );
}

const TAG_TONE = {
  primary: { bg: "#FDF0E8", fg: C.primaryDeep },
  family: { bg: "#EFF4E8", fg: C.accent2Deep },
  plain: { bg: "#F2EFEB", fg: C.textSub },
} as const;

/** 작은 꼬리표 (가족 이름 · 상태) */
export function Tag({ children, tone = "primary" }: { children: ReactNode; tone?: keyof typeof TAG_TONE }) {
  const t = TAG_TONE[tone];
  return (
    <View style={[styles.tag, { backgroundColor: t.bg }]}>
      <T size={12} weight={600} ls={-0.01} color={t.fg} numberOfLines={1}>
        {children}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: R.chip,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  track: { width: 50, height: 28, borderRadius: 14 },
  knob: {
    position: "absolute",
    top: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.white,
    boxShadow: "0 1px 4px rgba(0,0,0,0.14)",
  },
  option: {
    width: "100%",
    borderRadius: R.btn,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  optionText: { flex: 1, gap: 3 },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    width: "100%",
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: R.btn,
    paddingHorizontal: 16,
    color: C.text,
    backgroundColor: C.bg,
  },
  tag: {
    alignSelf: "flex-start",
    minHeight: 22,
    paddingHorizontal: 7,
    borderRadius: 6,
    justifyContent: "center",
  },
});
