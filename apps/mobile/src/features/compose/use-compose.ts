// 답 보내기 · 질문 만들기 · 고치기 · 지우기 · 근황 보내기 (DB 함수 submit_answer · *_custom_question · create_news)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { ko } from "@/copy/ko";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/ui";

/** 지금 만들면 내 질문이 갈 날 */
export function useNextSlot(userId: string | undefined, relationshipId: string | undefined) {
  return useQuery({
    queryKey: ["custom-slot", userId, relationshipId],
    enabled: !!userId && !!relationshipId,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.rpc("custom_question_next", { relationship: relationshipId! });
      if (error) throw error;
      return data;
    },
  });
}

export type ComposeAction =
  | { type: "answer"; question: string; text: string }
  | { type: "make"; relationship: string; text: string }
  | { type: "edit"; question: string; text: string }
  | { type: "remove"; question: string }
  | {
      type: "news";
      relationship: string;
      text: string;
      topic: string | null;
      topicBy: "chip" | "custom" | null;
    };

async function run(a: ComposeAction) {
  const r =
    a.type === "answer"
      ? await supabase.rpc("submit_answer", { question: a.question, text: a.text })
      : a.type === "make"
        ? await supabase.rpc("create_custom_question", { relationship: a.relationship, text: a.text })
        : a.type === "edit"
          ? await supabase.rpc("update_custom_question", { question: a.question, text: a.text })
          : a.type === "remove"
            ? await supabase.rpc("delete_custom_question", { question: a.question })
            : await supabase.rpc("create_news", {
                // 사진을 붙이면(9-1) 이 번호의 폴더에 먼저 올린다
                news_id: Crypto.randomUUID(),
                relationship: a.relationship,
                text: a.text,
                topic: a.topic ?? undefined,
                topic_by: a.topicBy ?? undefined,
              });
  if (r.error) throw r.error;
  return r.data;
}

/** 서버 오류 code (raise exception 'question_closed' 같은 것) */
export const errorCode = (e: unknown) => (e as { message?: string } | null)?.message ?? "";

export function useComposeAction(userId: string | undefined) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: run,
    onError: (e) => {
      // 답할 기간이 지난 것은 화면이 따로 알려 준다
      if (errorCode(e) !== "question_closed") toast(ko.error.internal);
    },
    onSettled: () => {
      for (const key of ["home", "records", "calendar", "records-day", "custom-slot"]) {
        qc.invalidateQueries({ queryKey: [key, userId] });
      }
    },
  });
}
