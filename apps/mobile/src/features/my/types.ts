// 마이 함수 my_page()가 돌려주는 모양 (supabase/migrations/*_my_page.sql)
import type { CALL_DAYS } from "@ieobom/shared";

export type CallDays = (typeof CALL_DAYS)[number];
export type CallTime = { days: CallDays; start_hour: number; end_hour: number };
export type NotifyTime = "08:00" | "12:00" | "19:00" | "21:00";
export type Freq = 1 | 2 | 3;

export type MyFamily = {
  relationship_id: string;
  my_side: "child" | "parent";
  parent_kind: "mom" | "dad";
  /** 부모님에게만 자녀 이름이 온다 */
  partner_name: string | null;
  connected_at: string;
  /** 내가 고른 횟수(바꿨으면 바꾼 횟수) */
  freq: Freq;
  freq_from: string | null;
  /** 다음 주부터 실제로 받을 횟수(두 사람 중 적은 쪽) */
  applied: Freq;
  avoid_topics: string[];
  curious_topics: string[];
};

export type MyInvite = {
  id: string;
  invite_as: "mom" | "dad" | "child";
  parent_kind: "mom" | "dad";
  code: string;
  expires_at: string;
};

export type MyPage = {
  me: {
    name: string;
    side: "child" | "parent";
    large_text: boolean;
    notify_on: boolean;
    notify_time: NotifyTime;
    memo_draft_on: boolean;
    provider: string | null;
    agreed_at: string | null;
    doc_version: string | null;
  };
  families: MyFamily[];
  invites: MyInvite[];
  call_times: (CallTime & { id: string })[];
  /** 지금 받을 이용 설문(이어진 날 기준 0 · 3 · 6주차). 다 보냈으면 null */
  survey: { relationship_id: string; round: SurveyRound } | null;
};

export type SurveyRound = 0 | 3 | 6;
