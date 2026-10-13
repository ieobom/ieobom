// 글자. 크기 · 굵기 · 줄 간격(배수) · 자간(em)을 시안과 같은 단위로 받는다.
// '글자 크게 보기'를 켜면 크기에 배율을 곱하고, 휴대폰 글자 크기 설정도 따른다(1.6배까지).

import { createContext, useContext, type ReactNode } from "react";
import { Platform, Text, type TextProps, type TextStyle } from "react-native";
import { FAMILY, type Weight } from "./fonts";
import { C } from "./theme";

const TextScale = createContext(1);

export function TextScaleProvider({ scale, children }: { scale: number; children: ReactNode }) {
  return <TextScale.Provider value={scale}>{children}</TextScale.Provider>;
}

export const useTextScale = () => useContext(TextScale);

export type TProps = TextProps & {
  size?: number;
  weight?: Weight;
  color?: string;
  /** 줄 간격 배수 (시안의 lineHeight: 1.55) */
  lh?: number;
  /** 자간 em (시안의 letterSpacing: "-0.02em" → -0.02) */
  ls?: number;
  align?: TextStyle["textAlign"];
};

// 한글은 낱말 중간에서 끊지 않는다(시안의 word-break: keep-all)
const keepAll: TextStyle = Platform.OS === "web" ? ({ wordBreak: "keep-all" } as TextStyle) : {};

export function T({ size = 16, weight = 400, color = C.text, lh, ls, align, style, ...rest }: TProps) {
  const fontSize = size * useTextScale();
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      lineBreakStrategyIOS="hangul-word"
      {...rest}
      style={[
        keepAll,
        {
          fontFamily: FAMILY[weight],
          fontSize,
          color,
          lineHeight: lh ? Math.round(fontSize * lh) : undefined,
          letterSpacing: ls ? fontSize * ls : undefined,
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
