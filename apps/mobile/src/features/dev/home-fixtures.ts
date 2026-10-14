// 개발 확인용: 홈 함수(home())와 같은 모양의 가짜 데이터. 39차 시안 시연(아영 · 엄마 · 아빠)과 맞췄다.
import type { HomeCard, HomeData, HomeFamily } from "@/features/home/types";

const now = Date.now();
const ago = (m: number) => new Date(now - m * 60000).toISOString();
const hourToday = (h: number) => {
  const d = new Date(now + 9 * 3600000);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h - 9)).toISOString();
};
const day = (offset: number) => new Date(now + 9 * 3600000 + offset * 86400000).toISOString().slice(0, 10);

const base = (over: Partial<HomeFamily>): HomeFamily => ({
  relationship_id: "mom",
  status: "connected",
  my_side: "child",
  parent_kind: "mom",
  partner_name: null,
  days_together: 42,
  next_question_on: day(2),
  my_custom_question: null,
  partner_custom_question_on: null,
  answered_together: 11,
  memo_count: 6,
  cards: [],
  ...over,
});

const Q = "어릴 때 살던 동네에서\n제일 기억나는 곳은?";
const question = (state: Extract<HomeCard, { kind: "question" }>["state"], extra: object = {}): HomeCard => ({
  kind: "question",
  state,
  question_id: "q12",
  seq_no: 12,
  text: state === "new" ? Q : "요즘 가장 자주 듣는 노래는 뭐예요?",
  source: "bank",
  ...extra,
});

const missed: HomeCard = { kind: "missed_call", call_id: "c1", at: ago(12) };
const free: HomeCard = { kind: "free_now", from: hourToday(19), until: hourToday(21) };
const news: HomeCard = {
  kind: "news",
  news_ids: ["n1", "n2"],
  items: [
    {
      id: "n1",
      text: "뒷산에 단풍이 들기 시작했어",
      topic: "다녀온 곳",
      at: ago(90),
      thumbs: ["a", "b"],
      talk: "거기는 어땠어요?",
    },
    { id: "n2", text: "오늘 김장 준비했어", topic: "먹은 것", at: ago(300), thumbs: [], talk: null },
  ],
};
const draft: HomeCard = {
  kind: "memo_draft",
  draft_id: "d1",
  call_id: "c0",
  count: 1,
  text: "엄마가 이번 주에 병원에 다녀오셨대요.\n검사 결과는 다음 주에 나온대요.\n주말에 김장하신대요.",
  at: ago(60 * 26),
};

export type Scenario = { key: string; label: string; data: HomeData };

const dad = base({
  relationship_id: "dad",
  parent_kind: "dad",
  cards: [question("waiting", { my_answer: "출근길에 옛날 가요를 들어요" })],
});

export const SCENARIOS: Scenario[] = [
  {
    key: "child-dad-invited",
    label: "자녀 · 아빠 초대 중",
    data: {
      families: [base({ cards: [missed, free, question("new"), news, draft] })],
      notice: null,
      pending_invites: [
        {
          id: "i1",
          invite_as: "dad",
          parent_kind: "dad",
          code: "593827",
          expires_at: new Date(now + 86400000).toISOString(),
        },
      ],
    },
  },
  {
    key: "child-all",
    label: "자녀 · 카드 다섯 장",
    data: {
      families: [base({ cards: [missed, free, question("new"), news, draft] }), dad],
      notice: {
        id: "nt",
        kind: "maintenance",
        title: "11월 20일 새벽 2시 – 4시 점검 안내",
        body: "이 시간에는 이어봄 통화와 알림이 잠시 멈춰요. 쓰던 메모와 기록은 그대로예요.",
        note: "급한 일은 휴대폰 전화로 걸어 주세요.",
      },
    },
  },
  {
    key: "parent",
    label: "부모님 · 새 질문 (화살표)",
    data: {
      families: [base({ my_side: "parent", partner_name: "아영", cards: [free, question("new"), news] })],
      notice: null,
    },
  },
  {
    key: "waiting",
    label: "질문 · 답 기다림",
    data: {
      families: [base({ cards: [question("waiting", { my_answer: "출근길에 옛날 가요를 들어요" })] }), dad],
      notice: null,
    },
  },
  {
    key: "ask",
    label: "질문 · 먼저 보낼까요",
    data: {
      families: [
        base({
          cards: [
            question("ask_early", {
              my_answer: "출근길에 옛날 가요를 들어요. 요즘은 김광석 노래를 자주 들어요.",
            }),
          ],
        }),
      ],
      notice: null,
    },
  },
  {
    key: "received",
    label: "질문 · 먼저 온 답",
    data: {
      families: [
        base({
          cards: [question("received", { partner_answer: "라디오에서 나오는 트로트" })],
        }),
      ],
      notice: null,
    },
  },
  {
    key: "opened",
    label: "질문 · 둘 다 답함",
    data: {
      families: [
        base({
          cards: [question("opened", { my_answer: "옛날 가요", partner_answer: "라디오에서 나오는 트로트" })],
        }),
      ],
      notice: null,
    },
  },
  {
    key: "next-mine",
    label: "질문 · 다음은 내가 만든 질문",
    data: {
      families: [
        base({
          my_custom_question: { id: "cq", text: "엄마 첫 직장은 어디였어요?", send_on: day(2) },
          cards: [question("next", { next_on: day(2) })],
        }),
      ],
      notice: null,
    },
  },
  {
    key: "left",
    label: "엄마가 탈퇴함",
    data: { families: [base({ status: "left", cards: [{ kind: "partner_left" }] })], notice: null },
  },
  { key: "none", label: "이어진 가족 없음", data: { families: [], notice: null } },
];
