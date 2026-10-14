// 홈 함수 home()이 돌려주는 모양 (supabase/migrations/*_home*.sql)

export type QuestionState =
  "new" | "partner_sent_first" | "opened" | "ask_early" | "received" | "waiting" | "next";

export type NewsItem = {
  id: string;
  text: string;
  topic: string | null;
  at: string;
  thumbs: string[];
  talk: string | null;
};

export type HomeCard =
  | { kind: "missed_call"; call_id: string; at: string }
  | { kind: "free_now"; from: string; until: string }
  | {
      kind: "question";
      state: QuestionState;
      question_id?: string;
      seq_no?: number;
      text?: string;
      source?: "bank" | "custom";
      my_answer?: string | null;
      partner_answer?: string | null;
      next_on?: string;
    }
  | { kind: "news"; news_ids: string[]; items: NewsItem[] }
  | { kind: "memo_draft"; draft_id: string; call_id: string; count: number; text: string; at: string }
  | { kind: "partner_left" };

export type HomeFamily = {
  relationship_id: string;
  status: "connected" | "left";
  my_side: "child" | "parent";
  parent_kind: "mom" | "dad";
  /** 부모님에게만 자녀 이름이 온다 */
  partner_name: string | null;
  days_together: number;
  next_question_on: string;
  my_custom_question: { id: string; text: string; send_on: string } | null;
  partner_custom_question_on: string | null;
  answered_together: number;
  memo_count: number;
  cards: HomeCard[];
};

export type HomeNotice = { id: string; kind: string; title: string; body: string; note: string };

export type PendingInvite = {
  id: string;
  invite_as: "mom" | "dad" | "child";
  parent_kind: "mom" | "dad";
  code: string;
  expires_at: string;
};

export type HomeData = {
  families: HomeFamily[];
  notice: HomeNotice | null;
  pending_invites?: PendingInvite[];
};

/** 이 사람을 부르는 말: 자녀 화면은 엄마 · 아빠, 부모님 화면은 '아영이' */
export type Talk = { text: string; source: "memo" | "news" | "answer" | "weather" };
