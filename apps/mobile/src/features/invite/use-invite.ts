// 초대 코드 만들기 · 이어졌는지 보기 · 받은 코드 확인 · 연결하기 (DB 함수 create_invite · preview_invite · accept_invite)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ko } from "@/copy/ko";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/ui";

export type InviteAs = "mom" | "dad" | "child";
export type Kind = "mom" | "dad";

export type Issued = { id: string; code: string; expires_at: string };

/** 코드 확인 결과 (invite_lookup). ok가 아니면 reason별 문구를 보여 준다 */
export type Lookup =
  | { ok: true; invite_as: InviteAs; parent_kind: Kind; inviter_name: string | null }
  | { ok: false; reason: string; invite_as?: InviteAs; parent_kind?: Kind; child_name?: string | null };

export function useIssueInvite(userId: string | undefined) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (a: { invite_as: InviteAs; my_kind?: Kind }): Promise<Issued> => {
      const { data, error } = await supabase.rpc("create_invite", a);
      if (error) throw error;
      return { id: data.id, code: data.code, expires_at: data.expires_at };
    },
    onError: () => toast(ko.error.internal),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["my", userId] });
      qc.invalidateQueries({ queryKey: ["home", userId] });
    },
  });
}

/** 보낸 코드가 쓰였는지. 기다리는 동안 3초마다, 앱으로 돌아오면 바로 다시 본다 */
export function useInviteStatus(inviteId: string | undefined) {
  return useQuery({
    queryKey: ["invite", inviteId],
    enabled: !!inviteId,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invites")
        .select("status, relationship_id")
        .eq("id", inviteId!)
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: (q) => (q.state.data?.status === "used" ? false : 3000),
  });
}

export function usePreviewInvite() {
  return useMutation({
    mutationFn: async (code: string): Promise<Lookup> => {
      const { data, error } = await supabase.rpc("preview_invite", { code });
      if (error) throw error;
      return data as unknown as Lookup;
    },
  });
}

export function useAcceptInvite(userId: string | undefined) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (code: string): Promise<Lookup | { ok: true; relationship_id: string }> => {
      const { data, error } = await supabase.rpc("accept_invite", { code });
      if (error) throw error;
      return data as unknown as Lookup | { ok: true; relationship_id: string };
    },
    onError: () => toast(ko.error.internal),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["my", userId] });
      qc.invalidateQueries({ queryKey: ["home", userId] });
    },
  });
}
