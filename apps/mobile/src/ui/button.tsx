// 버튼. 시안의 BtnPrimary · BtnSecondary · BtnGhost.
// 높이는 고정하지 않고 최소 높이로 둬서, 글자가 커져도 잘리지 않고 줄이 늘어난다.

import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { T } from "./text";
import { C, R } from "./theme";

type Props = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  /** 글자 왼쪽 아이콘 */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({
  children,
  onPress,
  disabled = false,
  variant = "primary",
  icon,
  style,
  testID,
}: Props) {
  const box =
    variant === "primary"
      ? [styles.box, { backgroundColor: disabled ? C.disabledBg : C.primary }]
      : variant === "secondary"
        ? [styles.box, { backgroundColor: C.surface2, opacity: disabled ? 0.5 : 1 }]
        : styles.ghost;
  const label =
    variant === "primary" ? (
      <T size={16} weight={700} ls={-0.02} color={disabled ? C.disabledText : C.white} align="center">
        {children}
      </T>
    ) : variant === "secondary" ? (
      <T size={16} weight={600} ls={-0.02} color={C.primary} align="center">
        {children}
      </T>
    ) : (
      <T size={15} weight={500} color={C.textTertiary} align="center">
        {children}
      </T>
    );
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [box, pressed && styles.pressed, style]}
    >
      {icon ? (
        <View style={styles.row}>
          {icon}
          {label}
        </View>
      ) : (
        label
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "100%",
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: R.btn,
    alignItems: "center",
    justifyContent: "center",
  },
  ghost: { minHeight: 44, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  pressed: { opacity: 0.85 },
});
