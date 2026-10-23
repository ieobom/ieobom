// 휴대폰으로 들어온 주소를 화면 주소로 바꾼다. 카카오톡에서 로그인하고 돌아오는 주소(kakao{앱 키}://oauth)는
// 카카오 SDK가 처리하므로 화면을 옮기지 않는다(그대로 두면 '없는 화면'이 뜬다).
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return path.startsWith("kakao") ? "" : path;
}
