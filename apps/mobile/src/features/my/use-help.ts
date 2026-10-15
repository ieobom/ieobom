// 보낸 문의 불러오기 · 보내기 · 답 본 때 적기 (inquiries 표, 나만 읽음)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import { ko } from "@/copy/ko";
import { appVersion } from "@/lib/errors";
import { track } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/ui";

export type Inquiry = {
  id: string;
  help_item: string;
  body: string;
  created_at: string;
  answer: string | null;
  answered_at: string | null;
  answer_seen_at: string | null;
};

export function useInquiries(userId: string | undefined) {
  return useQuery({
    queryKey: ["inquiries", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Inquiry[]> => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("id, help_item, body, created_at, answer, answered_at, answer_seen_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

type Action = { type: "send"; body: string; help_item: string } | { type: "seen"; ids: string[] };

export function useInquiryAction(userId: string | undefined) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (a: Action) => {
      const r =
        a.type === "send"
          ? await supabase.from("inquiries").insert({
              user_id: userId!,
              body: a.body,
              help_item: a.help_item,
              // 답할 때 원인을 찾기 쉽게 앱 버전과 휴대폰 종류를 같이 보낸다
              app_version: appVersion,
              device: `${Platform.OS} ${Platform.Version ?? ""}`.trim(),
            })
          : await supabase
              .from("inquiries")
              .update({ answer_seen_at: new Date().toISOString() })
              .in("id", a.ids);
      if (r.error) throw r.error;
    },
    onSuccess: (_, a) => {
      if (a.type === "send") track("inquiry_sent");
    },
    onError: () => toast(ko.error.internal),
    onSettled: () => qc.invalidateQueries({ queryKey: ["inquiries", userId] }),
  });
}
