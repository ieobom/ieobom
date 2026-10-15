// 이용 설문 문항 불러오기 · 보내기 (survey_questions · survey_responses)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ko } from "@/copy/ko";
import { track } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/ui";
import type { SurveyRound } from "./types";

export type SurveyQuestion = { id: string; text: string };

export function useSurveyQuestions(round: SurveyRound | undefined) {
  return useQuery({
    queryKey: ["survey", round],
    enabled: round !== undefined,
    queryFn: async (): Promise<SurveyQuestion[]> => {
      const { data, error } = await supabase
        .from("survey_questions")
        .select("id, text")
        .eq("round", round!)
        .order("sort");
      if (error) throw error;
      return data;
    },
  });
}

export function useSendSurvey(userId: string | undefined) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (a: {
      relationship: string;
      round: SurveyRound;
      scores: Record<string, number>;
      comment: string;
    }) => {
      const { error } = await supabase.from("survey_responses").insert({
        user_id: userId!,
        relationship_id: a.relationship,
        round: a.round,
        scores: a.scores,
        comment: a.comment,
      });
      if (error) throw error;
    },
    onSuccess: (_, a) => track("survey_sent", { round: a.round }),
    onError: () => toast(ko.error.internal),
    onSettled: () => qc.invalidateQueries({ queryKey: ["my", userId] }),
  });
}
