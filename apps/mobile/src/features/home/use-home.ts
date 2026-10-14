// 홈 불러오기와 카드 동작. 카드를 빼는 동작은 DB 함수(see_* · choose_early · discard_draft)가 하고, 끝나면 홈을 다시 불러온다.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { HomeData, Talk } from "./types";

export function useHome(userId: string | undefined) {
  return useQuery({
    queryKey: ["home", userId],
    enabled: !!userId,
    queryFn: async (): Promise<HomeData> => {
      const { data, error } = await supabase.rpc("home");
      if (error) throw error;
      return data as unknown as HomeData;
    },
  });
}

export function useTalkList(userId: string | undefined, relationshipId: string | undefined) {
  return useQuery({
    queryKey: ["talk", userId, relationshipId],
    enabled: !!userId && !!relationshipId,
    queryFn: async (): Promise<Talk[]> => {
      const { data, error } = await supabase.rpc("talk_list", { relationship: relationshipId! });
      if (error) throw error;
      return data as unknown as Talk[];
    },
  });
}

type Action =
  | { type: "see_missed"; call: string }
  | { type: "see_news"; ids: string[] }
  | { type: "see_question"; question: string }
  | { type: "choose_early"; question: string; choice: "send" | "keep" }
  | { type: "discard_draft"; draft: string }
  | { type: "restore_draft"; draft: string }
  | { type: "see_notice"; notice: string; user: string };

async function run(a: Action) {
  const r =
    a.type === "see_missed"
      ? await supabase.rpc("see_missed_call", { call: a.call })
      : a.type === "see_question"
        ? await supabase.rpc("see_question", { question: a.question })
        : a.type === "choose_early"
          ? await supabase.rpc("choose_early", { question: a.question, choice: a.choice })
          : a.type === "discard_draft"
            ? await supabase.rpc("discard_draft", { draft: a.draft })
            : a.type === "restore_draft"
              ? await supabase.rpc("restore_draft", { draft: a.draft })
              : a.type === "see_notice"
                ? await supabase.from("notice_reads").insert({ notice_id: a.notice, user_id: a.user })
                : {
                    error:
                      (await Promise.all(a.ids.map((id) => supabase.rpc("see_news", { news_id: id })))).find(
                        (x) => x.error,
                      )?.error ?? null,
                  };
  if (r.error) throw r.error;
}

export function useHomeAction(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSettled: () => qc.invalidateQueries({ queryKey: ["home", userId] }),
  });
}
