// 통화 후 메모의 초안 · 메모 불러오기와 저장 · 고치기 · 지우기 · 여쭤봤어요 (memo_drafts · memos · DB 함수 *_memo · mark_asked)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ko } from "@/copy/ko";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/ui";
import type { DraftStatus, Mood, TalkItem } from "./memo-screen";

export type CallMemoContext = {
  callId: string;
  relationshipId: string;
  draft: { status: DraftStatus; text: string | null } | null;
};

/** 통화 뒤(?call=) 또는 홈의 초안 카드(?draft=)에서 연 메모의 통화 · 가족 · 내 초안 */
export function useCallMemoContext(userId: string | undefined, ids: { call?: string; draft?: string }) {
  return useQuery({
    queryKey: ["memo-context", userId, ids.call ?? ids.draft],
    enabled: !!userId && !!(ids.call || ids.draft),
    queryFn: async (): Promise<CallMemoContext> => {
      const cols = "call_id, relationship_id, status, text";
      if (ids.draft) {
        const { data, error } = await supabase.from("memo_drafts").select(cols).eq("id", ids.draft).single();
        if (error) throw error;
        return {
          callId: data.call_id,
          relationshipId: data.relationship_id,
          draft: { status: data.status as DraftStatus, text: data.text },
        };
      }
      const [d, c] = await Promise.all([
        supabase.from("memo_drafts").select(cols).eq("call_id", ids.call!).maybeSingle(),
        supabase.from("calls").select("relationship_id").eq("id", ids.call!).single(),
      ]);
      if (d.error) throw d.error;
      if (c.error) throw c.error;
      return {
        callId: ids.call!,
        relationshipId: c.data.relationship_id,
        draft: d.data ? { status: d.data.status as DraftStatus, text: d.data.text } : null,
      };
    },
  });
}

/** 기록에서 고칠 메모 */
export function useMemoRecord(userId: string | undefined, memoId: string | undefined) {
  return useQuery({
    queryKey: ["memo", userId, memoId],
    enabled: !!userId && !!memoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memos")
        .select("id, text, mood, created_at, relationship_id")
        .eq("id", memoId!)
        .single();
      if (error) throw error;
      return { ...data, mood: data.mood as Mood | null };
    },
  });
}

/** 이번 통화 때 여쭤볼 이야기 (홈과 같은 talk_list. 여쭤봤어요 표시에 ID가 필요하다) */
export function useTalkItems(userId: string | undefined, relationshipId: string | undefined) {
  return useQuery({
    queryKey: ["talk-items", userId, relationshipId],
    enabled: !!userId && !!relationshipId,
    queryFn: async (): Promise<TalkItem[]> => {
      const { data, error } = await supabase.rpc("talk_list", { relationship: relationshipId! });
      if (error) throw error;
      return data as unknown as TalkItem[];
    },
  });
}

export type MemoAction =
  | { type: "save"; call: string; mood: Mood | null; text: string }
  | { type: "update"; memo: string; mood: Mood | null; text: string }
  | { type: "delete"; memo: string }
  | { type: "ask"; relationship: string; suggestion: string | null }
  | { type: "unask"; suggestion: string };

async function run(a: MemoAction): Promise<string | null> {
  if (a.type === "save") {
    const { error } = await supabase.rpc("save_call_memo", {
      call: a.call,
      mood: a.mood ?? undefined,
      text: a.text,
    });
    if (error) throw error;
    return null;
  }
  if (a.type === "update") {
    const { error } = await supabase.rpc("update_memo", {
      memo: a.memo,
      mood: a.mood as string,
      text: a.text,
    });
    if (error) throw error;
    return null;
  }
  if (a.type === "delete") {
    const { error } = await supabase.rpc("delete_memo", { memo: a.memo });
    if (error) throw error;
    return null;
  }
  if (a.type === "ask") {
    // 날씨처럼 줄이 없는 이야기는 표시하면서 줄이 생긴다. 되돌릴 때 그 ID를 쓴다
    const { data, error } = await supabase.rpc("mark_asked", {
      relationship: a.relationship,
      suggestion: a.suggestion ?? undefined,
    });
    if (error) throw error;
    return data;
  }
  const { error } = await supabase.rpc("unmark_asked", { suggestion: a.suggestion });
  if (error) throw error;
  return null;
}

export function useMemoAction(userId: string | undefined) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: run,
    onError: () => toast(ko.error.internal),
    onSettled: () => {
      for (const key of ["home", "records", "calendar", "records-day", "talk", "talk-items", "memo"]) {
        qc.invalidateQueries({ queryKey: [key, userId] });
      }
    },
  });
}
