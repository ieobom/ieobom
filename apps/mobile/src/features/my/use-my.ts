// 마이 불러오기와 바꾸기. 바로 바뀌어 보여야 하는 것(이름 · 켜고 끄기 · 주제)은 먼저 화면에 반영하고, 실패하면 되돌린다.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ko } from "@/copy/ko";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/ui";
import type { HomeData } from "@/features/home/types";
import type { CallTime, Freq, MyPage, NotifyTime } from "./types";

export function useMyPage(userId: string | undefined) {
  return useQuery({
    queryKey: ["my", userId],
    enabled: !!userId,
    queryFn: async (): Promise<MyPage> => {
      const { data, error } = await supabase.rpc("my_page");
      if (error) throw error;
      return data as unknown as MyPage;
    },
  });
}

export type Profile = Partial<{
  name: string;
  large_text: boolean;
  notify_on: boolean;
  notify_time: NotifyTime;
}>;

export type MyAction =
  | { type: "profile"; patch: Profile }
  | { type: "memo_draft"; on: boolean }
  | { type: "freq"; relationship: string; freq: Freq }
  | { type: "topics"; relationship: string; avoid_topics?: string[]; curious_topics?: string[] }
  | { type: "call_times"; times: CallTime[] }
  | { type: "end"; relationship: string }
  | { type: "cancel_invite"; invite: string }
  | { type: "renew_invite"; invite_as: "mom" | "dad" | "child"; my_kind?: "mom" | "dad" };

async function run(userId: string, a: MyAction) {
  const r =
    a.type === "profile"
      ? await supabase.from("users").update(a.patch).eq("id", userId)
      : a.type === "memo_draft"
        ? await supabase.rpc("set_memo_draft", { turn_on: a.on })
        : a.type === "freq"
          ? await supabase.rpc("set_question_freq", { relationship: a.relationship, freq: a.freq })
          : a.type === "topics"
            ? await supabase
                .from("relationship_settings")
                .update({
                  ...(a.avoid_topics && { avoid_topics: a.avoid_topics }),
                  ...(a.curious_topics && { curious_topics: a.curious_topics }),
                })
                .eq("relationship_id", a.relationship)
                .eq("user_id", userId)
            : a.type === "call_times"
              ? await supabase.rpc("set_call_times", { times: a.times })
              : a.type === "end"
                ? await supabase.rpc("end_relationship", { relationship: a.relationship })
                : a.type === "cancel_invite"
                  ? await supabase.rpc("cancel_invite", { invite: a.invite })
                  : await supabase.rpc("create_invite", { invite_as: a.invite_as, my_kind: a.my_kind });
  if (r.error) throw r.error;
}

/** 화면에 먼저 반영할 바꾸기 */
function optimistic(d: MyPage, a: MyAction): MyPage {
  if (a.type === "profile") return { ...d, me: { ...d.me, ...a.patch } };
  if (a.type === "memo_draft") return { ...d, me: { ...d.me, memo_draft_on: a.on } };
  if (a.type === "topics")
    return {
      ...d,
      families: d.families.map((f) =>
        f.relationship_id === a.relationship
          ? {
              ...f,
              avoid_topics: a.avoid_topics ?? f.avoid_topics,
              curious_topics: a.curious_topics ?? f.curious_topics,
            }
          : f,
      ),
    };
  return d;
}

export function useMyAction(userId: string | undefined) {
  const qc = useQueryClient();
  const toast = useToast();
  const key = ["my", userId];
  return useMutation({
    mutationFn: (a: MyAction) => run(userId!, a),
    onMutate: async (a) => {
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData<MyPage>(key);
      if (before) qc.setQueryData(key, optimistic(before, a));
      // 글자 크기는 앱 전체가 홈 값을 보고 그린다
      if (a.type === "profile" && a.patch.large_text !== undefined) {
        qc.setQueryData<HomeData>(["home", userId], (h) => h && { ...h, large_text: a.patch.large_text });
      }
      return { before };
    },
    onError: (_e, _a, ctx) => {
      if (ctx?.before) qc.setQueryData(key, ctx.before);
      toast(ko.error.internal);
    },
    onSettled: (_d, _e, a) => {
      qc.invalidateQueries({ queryKey: key });
      // 연결 · 초대 · 글자 크기 · 통화 편한 시간 · 다음 질문 날은 홈에도 보인다
      if (a.type !== "topics") qc.invalidateQueries({ queryKey: ["home", userId] });
    },
  });
}
