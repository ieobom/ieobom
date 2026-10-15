// 마이 개발 확인용 가짜 데이터(39차 시연과 같은 값). 로그인 없이 /dev/my에서 화면을 본다.
import type { MyAction } from "@/features/my/use-my";
import type { Freq, MyPage } from "@/features/my/types";

const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

const CHILD: MyPage = {
  me: {
    name: "아영",
    side: "child",
    large_text: false,
    notify_on: true,
    notify_time: "19:00",
    memo_draft_on: true,
    provider: "kakao",
    agreed_at: "2026-10-01T10:00:00+09:00",
    doc_version: "1.0",
  },
  families: [
    {
      relationship_id: "mom",
      my_side: "child",
      parent_kind: "mom",
      partner_name: null,
      connected_at: "2026-09-03T10:00:00+09:00",
      freq: 1,
      freq_from: null,
      applied: 1,
      avoid_topics: ["결혼·연애"],
      curious_topics: ["건강", "취미·운동"],
    },
  ],
  invites: [{ id: "inv-dad", invite_as: "dad", parent_kind: "dad", code: "593827", expires_at: inDays(2) }],
  call_times: [
    { id: "t1", days: "weekdays", start_hour: 19, end_hour: 21 },
    { id: "t2", days: "sat", start_hour: 10, end_hour: 12 },
  ],
};

const PARENT: MyPage = {
  me: { ...CHILD.me, name: "엄마", side: "parent", large_text: true },
  families: [
    {
      ...CHILD.families[0]!,
      relationship_id: "child",
      my_side: "parent",
      partner_name: "아영",
      avoid_topics: [],
      curious_topics: ["일·학교"],
    },
  ],
  invites: [],
  call_times: [{ id: "t1", days: "weekdays", start_hour: 19, end_hour: 21 }],
};

export const MY_CASES: { key: string; label: string; data: MyPage }[] = [
  { key: "child", label: "자녀 · 아빠 초대 중", data: CHILD },
  { key: "parent", label: "부모님", data: PARENT },
  {
    key: "expired",
    label: "아빠 코드 기한 지남",
    data: { ...CHILD, invites: [{ ...CHILD.invites[0]!, expires_at: inDays(-1) }] },
  },
  {
    key: "none",
    label: "이어진 가족 없음",
    data: { ...CHILD, families: [], invites: [], call_times: [] },
  },
];

/** 상대가 고른 횟수(시연은 주 1번). 내가 늘려도 적은 쪽에 맞춰진다 */
const PARTNER_FREQ: Freq = 1;

/** 서버 대신 가짜 데이터를 바꾼다 */
export function applyFixture(d: MyPage, a: MyAction): MyPage {
  switch (a.type) {
    case "profile":
      return { ...d, me: { ...d.me, ...a.patch } };
    case "memo_draft":
      return { ...d, me: { ...d.me, memo_draft_on: a.on } };
    case "freq":
    case "topics":
      return {
        ...d,
        families: d.families.map((f) =>
          f.relationship_id !== a.relationship
            ? f
            : a.type === "freq"
              ? { ...f, freq: a.freq, applied: Math.min(a.freq, PARTNER_FREQ) as Freq }
              : {
                  ...f,
                  avoid_topics: a.avoid_topics ?? f.avoid_topics,
                  curious_topics: a.curious_topics ?? f.curious_topics,
                },
        ),
      };
    case "call_times":
      return { ...d, call_times: a.times.map((t, i) => ({ ...t, id: `t${i}` })) };
    case "end":
      return { ...d, families: d.families.filter((f) => f.relationship_id !== a.relationship) };
    case "cancel_invite":
      return { ...d, invites: d.invites.filter((i) => i.id !== a.invite) };
    case "renew_invite":
      return {
        ...d,
        invites: d.invites.map((i) =>
          i.invite_as === a.invite_as
            ? {
                ...i,
                id: `${i.id}-new`,
                code: String(100000 + Math.floor(Math.random() * 900000)),
                expires_at: inDays(2),
              }
            : i,
        ),
      };
  }
}
