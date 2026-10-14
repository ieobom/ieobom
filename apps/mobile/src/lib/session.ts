// 로그인 세션. 앱 어디서나 지금 로그인했는지 알 수 있다.
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

/** undefined: 아직 확인 중 · null: 로그인 전 · Session: 로그인함 */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}
