// 기록 목록(이어 불러오기) · 달력 · 고른 날, 그리고 상세 창 동작(여쭤봤어요 · 메모 · 근황 지우기).
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CalendarData, Filter, RecordItem } from "./types";

const PAGE = 20;

export function useRecords(userId: string | undefined, relationshipId: string | undefined, filter: Filter) {
  return useInfiniteQuery({
    queryKey: ["records", userId, relationshipId, filter],
    enabled: !!userId && !!relationshipId,
    initialPageParam: null as null | { at: string; id: string },
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc("records", {
        relationship: relationshipId!,
        kind: filter === "all" ? undefined : filter,
        before_at: pageParam?.at,
        before_id: pageParam?.id,
        page_size: PAGE,
      });
      if (error) throw error;
      return data as unknown as RecordItem[];
    },
    getNextPageParam: (last) => {
      const tail = last[last.length - 1];
      return last.length < PAGE || !tail ? undefined : { at: tail.at, id: tail.id };
    },
  });
}

export function useCalendar(userId: string | undefined, relationshipId: string | undefined, month: string) {
  return useQuery({
    queryKey: ["calendar", userId, relationshipId, month],
    enabled: !!userId && !!relationshipId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("record_calendar", { relationship: relationshipId!, month });
      if (error) throw error;
      return data as unknown as CalendarData;
    },
  });
}

export function useDayRecords(
  userId: string | undefined,
  relationshipId: string | undefined,
  day: string | undefined,
) {
  return useQuery({
    queryKey: ["records-day", userId, relationshipId, day],
    enabled: !!userId && !!relationshipId && !!day,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("records", {
        relationship: relationshipId!,
        on_day: day!,
        page_size: 50,
      });
      if (error) throw error;
      return data as unknown as RecordItem[];
    },
  });
}

type Action =
  | { type: "ask"; relationship: string; suggestion: string; asked: boolean }
  | { type: "delete_memo"; memo: string }
  | { type: "delete_news"; news: string }
  | { type: "see_news"; news: string };

export function useRecordAction(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Action) => {
      const r =
        a.type === "ask"
          ? a.asked
            ? await supabase.rpc("unmark_asked", { suggestion: a.suggestion })
            : await supabase.rpc("mark_asked", { relationship: a.relationship, suggestion: a.suggestion })
          : a.type === "delete_memo"
            ? await supabase.rpc("delete_memo", { memo: a.memo })
            : a.type === "delete_news"
              ? await supabase.rpc("delete_news", { news_id: a.news })
              : await supabase.rpc("see_news", { news_id: a.news });
      if (r.error) throw r.error;
    },
    onSettled: () => {
      for (const key of ["records", "records-day", "calendar", "home", "talk"])
        qc.invalidateQueries({ queryKey: [key, userId] });
    },
  });
}
