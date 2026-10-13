// 서버 함수 ping을 불러 연결을 확인한다(계획 1-6). 로그인하면 내 사용자 ID도 돌아온다.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type Ping = { pong: boolean; user: string | null };

export function usePing() {
  return useQuery({
    queryKey: ["ping"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ data: Ping }>("ping", { method: "GET" });
      if (error) throw error;
      if (!data) throw new Error("빈 응답");
      return data.data;
    },
  });
}
