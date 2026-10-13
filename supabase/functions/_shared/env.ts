// 서버 함수가 쓰는 환경 변수. 없으면 바로 실패해서 빠진 설정을 일찍 알아챈다.

export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`환경 변수 ${name}이(가) 없습니다`);
  return value;
}

/**
 * Supabase가 자동으로 넣어 주는 열쇠. 새 방식은 이름별 JSON(`{"default": "sb_…"}`)이고,
 * 없으면 예전 이름(anon · service_role)을 쓴다.
 */
export function supabaseKey(kind: "publishable" | "secret"): string {
  const json = Deno.env.get(kind === "publishable" ? "SUPABASE_PUBLISHABLE_KEYS" : "SUPABASE_SECRET_KEYS");
  if (json) {
    const key = (JSON.parse(json) as Record<string, string>).default;
    if (key) return key;
  }
  return env(kind === "publishable" ? "SUPABASE_ANON_KEY" : "SUPABASE_SERVICE_ROLE_KEY");
}
