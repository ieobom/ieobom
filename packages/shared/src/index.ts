// 앱 · 서버 함수가 같이 쓰는 값. 기준: 39차 시안(UI시안/이어봄_39차시안.html) · docs/data-model.md
// DB 타입은 `pnpm db:types`로 supabase/functions/_shared/database.types.ts 에 만들고 여기서 다시 내보낸다.

export * from "../../../supabase/functions/_shared/database.types";

/** 근황 주제 · 요즘 궁금한 것 (news.topic, relationship_settings.curious_topics) */
export const NEWS_TOPICS = ["일·학교", "건강", "취미·운동", "먹은 것", "다녀온 곳", "가족·친구"] as const;

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
export const FEATURES = ["ai", "call_recording", "news_photos"] as const;
export type Feature = (typeof FEATURES)[number];
