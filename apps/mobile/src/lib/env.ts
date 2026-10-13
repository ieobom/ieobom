// 앱에 들어가는 공개 값(.env의 EXPO_PUBLIC_). 빠지면 앱을 열 때 바로 알 수 있게 실패시킨다.
// EXPO_PUBLIC_ 값은 빌드할 때 글자 그대로 바뀌어 들어가므로 process.env.이름 을 그대로 써야 한다.

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`apps/mobile/.env에 ${name}이(가) 없습니다`);
  return value;
}

export const env = {
  supabaseUrl: required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseKey: required(
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
};
