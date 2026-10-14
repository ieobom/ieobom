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

export function IcoPhone({ color = C.primary, size = 16 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.59.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.01L6.62 10.79z"
        fill={color}
      />
    </Svg>
  );
}

export function IcoPen({ color = C.primary }: P) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20h9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IcoHeart({ color = C.news, size = 22 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.2c-.9-.6-8.3-5.2-8.3-10.6A4.35 4.35 0 0112 7.3a4.35 4.35 0 018.3 2.3c0 5.4-7.4 10-8.3 10.6z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IcoLock({ color = C.textTertiary }: P) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={color} strokeWidth={1.7} />
      <Path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function IcoBook({ color = C.primary, size = 22 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5.5A1.5 1.5 0 015.5 4H11v16H5.5A1.5 1.5 0 014 18.5v-13zM20 5.5A1.5 1.5 0 0018.5 4H13v16h5.5a1.5 1.5 0 001.5-1.5v-13z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M7 8h1.5M7 11h1.5M15.5 8H17M15.5 11H17"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IcoMic({ color = C.primary }: P) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={8} y={2.5} width={8} height={12.5} rx={4} stroke={color} strokeWidth={1.8} />
      <Path d="M5 11a7 7 0 0014 0M12 18v3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IcoPlus({ color = C.textSub, size = 15 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

export function IcoChevronDown({ color = C.textSub, size = 18 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M4 6l4 4 4-4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 카드 넘기기 화살표(부모님 화면) */
export function IcoArrow({ dir, color = C.text }: { dir: -1 | 1; color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d={dir < 0 ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"}
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IcoCalendar({ color = C.primary, size = 17 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={4.5} width={17} height={16} rx={3} stroke={color} strokeWidth={1.7} />
      <Path d="M8 2.5v4M16 2.5v4M3.5 10h17" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function IcoEdit({ color = C.primary }: P) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 달력 근황 날짜 뒤 하트(39차 HEART_D) */
export const HEART_D =
  "M12 20.6c-.55-.34-8.6-5.35-8.6-11.2A4.45 4.45 0 0112 6.55a4.45 4.45 0 018.6 2.85c0 5.85-8.05 10.86-8.6 11.2z";

export function HeartBack({ fill, stroke, size = 38 }: { fill: string; stroke?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={HEART_D}
        fill={fill}
        stroke={stroke ?? "none"}
        strokeWidth={stroke ? 1.1 : 0}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** '여쭤봤어요' 동그라미 안 체크 */
export function IcoTickBig({ color = C.white }: P) {
  return (
    <Svg width={13} height={13} viewBox="0 0 12 12" fill="none">
      <Path
        d="M2 6.2l2.8 2.8L10 3.6"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
