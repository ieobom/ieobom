// 앱 · 서버 함수가 같이 쓰는 값. 기준: 39차 시안(UI시안/이어봄_39차시안.html) · docs/data-model.md
// DB 타입은 `pnpm db:types`로 supabase/functions/_shared/database.types.ts 에 만들고 여기서 다시 내보낸다.

export * from "../../../supabase/functions/_shared/database.types";

/** 근황 주제 · 요즘 궁금한 것 (news.topic, relationship_settings.curious_topics) */
export const NEWS_TOPICS = ["일·학교", "건강", "취미·운동", "먹은 것", "다녀온 곳", "가족·친구"] as const;
export type NewsTopic = (typeof NEWS_TOPICS)[number];

/** 근황 글로 주제를 고르는 낱말 규칙 (39차 시안의 TOPIC_WORDS, 계획 9-4). 앞에서부터 처음 맞는 것 */
export const TOPIC_WORDS: readonly (readonly [RegExp, NewsTopic])[] = [
  [/회사|발표|프로젝트|출근|야근|학교|시험|수업|일이/, "일·학교"],
  [/병원|검사|약|무릎|허리|감기|아프|건강/, "건강"],
  [/수영|등산|운동|헬스|산책|걷|요가|취미|배우/, "취미·운동"],
  [/먹|밥|맛집|요리|김장|반찬|떡볶이|커피/, "먹은 것"],
  [/여행|다녀|공원|바다|산에|나들이|구경/, "다녀온 곳"],
  [/친구|가족|이사|생일|생신|손주|조카|결혼식/, "가족·친구"],
];

/** 낱말 규칙으로 고른 근황 주제. 맞는 게 없으면 null (보낸 뒤 AI가 글로 고른다) */
export function guessTopic(text: string): NewsTopic | null {
  return TOPIC_WORDS.find(([re]) => re.test(text))?.[1] ?? null;
}

/** 피하고 싶은 주제 (relationship_settings.avoid_topics, question_bank.topic) */
export const AVOID_TOPICS = [
  "결혼·연애",
  "취업·직장",
  "돈·재정",
  "건강",
  "종교",
  "정치",
  "다이어트",
  "학업",
] as const;

/** 통화 후 메모 기분 (memos.mood) */
export const MOODS = ["좋았어요", "보통", "힘들었어요"] as const;

/** 통화 편한 시간 요일 (call_times.days): 평일 · 토요일 · 일요일 · 매일. 화면 글자는 앱의 ko.ts */
export const CALL_DAYS = ["weekdays", "sat", "sun", "everyday"] as const;

/** 기능 켜고 끄기 이름 (app_config.key, 계획 1-9). 앱 · 서버 함수가 같이 쓴다 */
export const FEATURES = ["ai", "call_recording", "news_photos", "voice"] as const;
export type Feature = (typeof FEATURES)[number];
