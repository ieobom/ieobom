// 가입을 마쳤는지(users 줄이 있는지)와 가입 마무리(signup_complete)
import { useMutation, useQuery } from "@tanstack/react-query";
import { ko } from "@/copy/ko";
import { track } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/ui";

export function useSignedUp(userId: string | undefined) {
  return useQuery({
    queryKey: ["signed-up", userId],
    enabled: !!userId,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.from("users").select("id").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useSignupComplete(userId: string | undefined) {
  const toast = useToast();
  return useMutation({
    // 자녀 · 부모님은 가족을 고를 때(create_invite · accept_invite) 다시 맞춘다. 처음에는 자녀로 둔다
    mutationFn: async (a: { name: string; agreed: string[] }) => {
      const { error } = await supabase.rpc("signup_complete", {
        name: a.name,
        side: "child",
        agreed: a.agreed,
      });
      // 이미 가입했으면(두 번 눌렀거나 다시 들어온 경우) 이름만 맞추고 이어 간다
      if (error?.message === "already_signed_up" && userId) {
        const r = await supabase.from("users").update({ name: a.name }).eq("id", userId);
        if (r.error) throw r.error;
        return;
      }
      if (error) throw error;
    },
    onSuccess: () => track("signup_done"),
    onError: () => toast(ko.error.internal),
  });
}
