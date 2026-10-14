// 개발 확인용: 기록 함수(records() · record_calendar())와 같은 모양의 가짜 데이터. 39차 시안 시연(아영 · 엄마)과 맞췄다.
import type { CalendarData, RecordItem } from "@/features/archive/types";

const kst = (date: string, h = 21) =>
  new Date(`${date}T${String(h).padStart(2, "0")}:00:00+09:00`).toISOString();
const t = new Date(Date.now() + 9 * 3600000);
const ym = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
const d = (n: number) => `${ym}-${String(n).padStart(2, "0")}`;
const lastMonth = (() => {
  const x = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1));
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}`;
})();

export const ARCHIVE_ITEMS: RecordItem[] = [
  {
    kind: "memo",
    id: "m1",
    at: kst(d(12)),
    mood: "good",
    text: "엄마 무릎 검사 결과는 괜찮으시대요. 다음 달에 한 번 더 검사받으신대요.",
    call_id: "c1",
    suggest_status: "done",
    talk: { id: "s1", text: "다음 검사는 언제 받으세요?", asked_on: null, made_by: "ai" },
  },
  {
    kind: "news",
    id: "n1",
    at: kst(d(10), 15),
    mine: false,
    text: "수영 다시 시작했어. 아침마다 가.",
    topic: "취미·운동",
    curious: true,
    photos: [
      { path: "a/1.jpg", thumb: "a/1_s.jpg" },
      { path: "a/2.jpg", thumb: "a/2_s.jpg" },
    ],
    talk: { id: "s2", text: "요즘 수영은 어떠세요?", asked_on: d(11), made_by: "ai" },
  },
  {
    kind: "question",
    id: "q11",
    at: kst(d(8), 5),
    seq_no: 11,
    text: "요즘 가장 자주 듣는 노래는 뭐예요?",
    status: "both",
    made_by: "partner",
    my_answer: "출근길에 옛날 가요를 들어요",
    partner_answer: "라디오에서 나오는 트로트",
  },
  {
    kind: "memo",
    id: "m2",
    at: kst(d(6)),
    mood: "okay",
    text: "",
    call_id: "c2",
    suggest_status: "mood_only",
    talk: null,
  },
  {
    kind: "news",
    id: "n2",
    at: kst(d(5), 9),
    mine: true,
    text: "이번 달에 이사해요",
    topic: "이사",
    curious: false,
    photos: [],
    talk: null,
  },
  {
    kind: "question",
    id: "q10",
    at: kst(d(1), 5),
    seq_no: 10,
    text: "어릴 때 꿈은 뭐였어요?",
    status: "sent_first",
    made_by: "ai",
    my_answer: "선생님이었어요",
    partner_answer: null,
  },
  {
    kind: "question",
    id: "q9",
    at: kst(`${lastMonth}-27`, 5),
    seq_no: 9,
    text: "요즘 하루 중 가장 좋아하는 시간은 언제예요?",
    status: "their_first",
    made_by: "ai",
    my_answer: null,
    partner_answer: "아침에 커피 마실 때",
  },
  {
    kind: "memo",
    id: "m3",
    at: kst(`${lastMonth}-20`),
    mood: "hard",
    text: "엄마 목소리가 좀 피곤해 보였다.",
    call_id: "c3",
    suggest_status: "failed",
    talk: null,
  },
];

export const ARCHIVE_CALENDAR: CalendarData = {
  days: {
    [d(1)]: ["question"],
    [d(5)]: ["news"],
    [d(6)]: ["memo"],
    [d(8)]: ["question"],
    [d(10)]: ["news"],
    [d(12)]: ["memo"],
  },
  counts: { memo_days: 2, questions: 1, news: 2 },
  since: `${lastMonth}-01`,
};
