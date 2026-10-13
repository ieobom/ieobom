// 아이콘. 39차 시안의 SVG 경로를 그대로 옮겼다.

import Svg, { Circle, Path, Rect } from "react-native-svg";
import { C } from "./theme";

type P = { color?: string; size?: number };

export function IcoBack({ color = C.text }: P) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IcoChevronRight({ color = C.disabledText }: P) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IcoCheck({ color = C.primary }: P) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IcoX({ color = C.textSub }: P) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IcoHome({ color = C.textTertiary }: P) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 10.5L12 3.8l8.5 6.7V19a1.5 1.5 0 01-1.5 1.5h-4.2v-6h-5.6v6H5A1.5 1.5 0 013.5 19v-8.5z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IcoNote({ color = C.primary }: P) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth={1.7} />
      <Path d="M14 2v6h6M8 13h8M8 17h5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function IcoUser({ color = C.textTertiary }: P) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.7} />
      <Path
        d="M4.5 20.5c0-4 3.4-6.8 7.5-6.8s7.5 2.8 7.5 6.8"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IcoList({ color = C.textSub, size = 15 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 선택지 오른쪽 동그라미 안의 작은 체크 */
export function IcoTick({ color = C.white }: P) {
  return (
    <Svg width={11} height={11} viewBox="0 0 12 12" fill="none">
      <Path d="M2 6l3 3 5-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MarkMemo({ size = 12 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      <Rect x={1.5} y={0.8} width={9} height={10.4} rx={2} fill={C.primary} />
      <Path d="M3.8 4h4.4M3.8 6.3h4.4M3.8 8.6h2.6" stroke="#fff" strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}

export function MarkQ({ size = 12 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      <Path
        d="M2.6 1.2h6.8A1.8 1.8 0 0111.2 3v4.2A1.8 1.8 0 019.4 9H5.6L3 11V9h-.4A1.8 1.8 0 01.8 7.2V3a1.8 1.8 0 011.8-1.8z"
        fill={C.accent2}
      />
      <Circle cx={3.9} cy={5.1} r={0.75} fill="#fff" />
      <Circle cx={6} cy={5.1} r={0.75} fill="#fff" />
      <Circle cx={8.1} cy={5.1} r={0.75} fill="#fff" />
    </Svg>
  );
}

export function MarkNews({ size = 12, color = C.news }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      <Path
        d="M6 10.8C5.5 10.45 1 7.55 1 4.35A2.6 2.6 0 016 3.1a2.6 2.6 0 015 1.25c0 3.2-4.5 6.1-5 6.45z"
        fill={color}
      />
    </Svg>
  );
}

/** 사람 모양 (프로필 동그라미 안) */
export function Figure({ size = 44, color = C.primary }: P) {
  return (
    <Svg width={size * 0.52} height={size * 0.6} viewBox="0 0 22 26" fill="none">
      <Circle cx={11} cy={7} r={5.5} fill={color} opacity={0.85} />
      <Path
        d="M1 25c0-5.523 4.477-10 10-10s10 4.477 10 10"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.85}
      />
    </Svg>
  );
}
