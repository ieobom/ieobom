// 앱에서 같이 쓰는 값. 기준: 이어봄_38차시안.html · 19_이어봄_ERD.html
// DB 타입은 supabase/functions/_shared/database.types.ts 에 만들고 여기서 다시 내보낸다(표를 만든 뒤).

/** 근황 주제 · 요즘 궁금한 것 (news.topic, relationship_settings.curious_topics) */
export const NEWS_TOPICS = ["일·학교", "건강", "취미·운동", "먹은 것", "다녀온 곳", "가족·친구"] as const;

/** 피하고 싶은 주제 (relationship_settings.avoid_topics, question_bank.topic) */
export const AVOID_TOPICS = ["결혼·연애", "취업·직장", "돈·재정", "건강", "종교", "정치", "다이어트", "학업"] as const;

/** 통화 후 메모 기분 (memos.mood) */
export const MOODS = ["좋았어요", "보통", "힘들었어요"] as const;

/** 통화 편한 시간 요일 (call_times.days) */
export const CALL_DAYS = ["평일", "토요일", "일요일", "매일"] as const;
