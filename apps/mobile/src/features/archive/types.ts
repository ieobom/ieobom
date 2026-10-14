// 기록 함수 records() · record_calendar()가 돌려주는 모양 (supabase/migrations/*_records*.sql)

export type TalkRef = { id: string; text: string; asked_on: string | null; made_by: "ai" | "original" };

export type RecordItem =
  | {
      kind: "memo";
      id: string;
      at: string;
      mood: "good" | "okay" | "hard" | null;
      text: string;
      call_id: string | null;
      suggest_status: "none" | "making" | "done" | "failed" | "mood_only";
      talk: TalkRef | null;
    }
  | {
      kind: "question";
      id: string;
      at: string;
      seq_no: number;
      text: string;
      status: "both" | "mine_only" | "sent_first" | "their_first";
      made_by: "ai" | "me" | "partner";
      my_answer: string | null;
      partner_answer: string | null;
    }
  | {
      kind: "news";
      id: string;
      at: string;
      mine: boolean;
      text: string;
      topic: string | null;
      curious: boolean;
      photos: { path: string; thumb: string }[];
      talk: TalkRef | null;
    };

export type Filter = "all" | "memo" | "question" | "news";

export type CalendarData = {
  days: Record<string, ("memo" | "question" | "news")[]>;
  counts: { memo_days: number; questions: number; news: number };
  since: string;
};
