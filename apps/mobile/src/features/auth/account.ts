// 로그아웃(계획 3-5) · 탈퇴(3-7). 이 휴대폰의 로그인만 끊고, 불러 둔 데이터와 모아 둔 이용 기록을 비운다.
// 알림 기기 토큰 지우기(unregister_device)는 알림(6-2)을 붙일 때 더한다.
import { clearEvents, flush } from "@/lib/events";
import { queryClient } from "@/lib/query";
import { supabase } from "@/lib/supabase";
import { kakaoLogout } from "./kakao";

async function signOutHere() {
  await kakaoLogout();
  await supabase.auth.signOut({ scope: "local" });
  queryClient.clear();
}

export async function logout(): Promise<void> {
  // 로그인한 동안 모은 이용 기록은 보내고 나간다
  await flush().catch(() => undefined);
  clearEvents();
  await signOutHere();
}

/** 탈퇴 서버 함수(account)를 부른다. 카카오 연결 끊기 · 사진 · 계정 지우기를 서버가 한다 */
export async function withdraw(): Promise<void> {
  const { error } = await supabase.functions.invoke("account", { body: { action: "withdraw" } });
  if (error) throw error;
  clearEvents();
  await signOutHere();
}
