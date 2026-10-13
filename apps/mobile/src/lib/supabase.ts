// 서버(Supabase) 연결. 앱 전체가 이 하나를 쓴다.
import "react-native-url-polyfill/auto";

import type { Database } from "@ieobom/shared";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import { env } from "./env";
import { sessionStorage } from "./session-storage";

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storage: sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 앱이 화면에 있을 때만 로그인 토큰을 새로 고친다(백그라운드에서는 배터리를 아낀다).
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
