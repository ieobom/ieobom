// 디자인 값. 39차 시안(UI시안/이어봄_39차시안.html)의 C · R · SHADOW · CARD · KIND를 그대로 옮겼다.
// 시안의 값이 바뀌면 여기만 고친다.

import { ko } from "@/copy/ko";

export const C = {
  text: "#201E1D",
  textSub: "#645C50",
  textTertiary: "#746B5D",
  /** 흰 글자 · 작은 글자도 읽히게 한 단계 진한 주 색 (흰 바탕 대비 5.05 : 1) */
  primary: "#A85A28",
  /** 리본 그림 · 첫 화면처럼 글자가 없는 장식에만 */
  brand: "#C67139",
  primaryLight: "#FFF2EB",
  primarySoft: "#FFE1D0",
  primaryDeep: "#8C491A",
  border: "#EEE7DB",
  bg: "#FFFFFF",
  surface2: "#FFF2EB",
  card: "#FFFFFF",
  white: "#FFFFFF",
  accent2: "#7A8A5E",
  accent2Soft: "#E1EECC",
  accent2Light: "#F0FAE1",
  accent2Deep: "#56633F",
  ink2: "#474238",
  /** 근황 = 분홍 하트 (기록 · 근황 어디서나 같은 표시) */
  news: "#E25A7E",
  newsDeep: "#B83A5E",
  newsLight: "#FFEEF2",
  newsSoft: "#F7C6D4",
  newsFaint: "#FDE3EA",
  /** 시안에서 이름 없이 쓰던 값 */
  disabledBg: "#F1ECE6",
  disabledText: "#9A9186",
  plainBg: "#F3F0EC",
  /** 초대 코드 칸 */
  digitBg: "#F4F1ED",
  danger: "#C0392B",
  /** 카카오 노란색 (로그인 표시 · 카카오로 계속하기) */
  kakao: "#FEE500",
  well: "#F7F5F2",
  toastBg: "rgba(38, 35, 32, 0.92)",
  toastAction: "#F3B98F",
} as const;

export const R = { card: 18, chip: 999, btn: 14, sm: 12, sheet: 20 } as const;

export const SHADOW = "0 1px 3px rgba(64, 44, 24, 0.05), 0 6px 22px rgba(64, 44, 24, 0.08)";

export const CARD = { backgroundColor: C.card, borderRadius: R.card, boxShadow: SHADOW } as const;

export type Kind = "memo" | "question" | "news";

export const KIND: Record<Kind, { label: string; color: string; bg: string }> = {
  memo: { label: ko.kind.memo, color: C.primary, bg: C.primaryLight },
  question: { label: ko.kind.question, color: C.accent2Deep, bg: C.accent2Light },
  news: { label: ko.kind.news, color: C.newsDeep, bg: C.newsLight },
};

/** '글자 크게 보기'(명세서 PUSH-03, 부모님은 처음부터 크게)의 배율. 시안은 화면 전체를 1.12배로 키운다. */
export const BIG_TEXT_SCALE = 1.12;
