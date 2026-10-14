// 화면 문구. 앱에 보이는 글은 모두 여기에 둔다(계획 1-8).
//
// 쓰는 법
// - 화면 · 부품에서는 `import { ko } from "@/copy/ko"` 로 가져와 `ko.common.confirm`처럼 쓴다.
// - 사람 이름 · 숫자가 들어가는 문구는 함수로 둔다: `ko.example.daysTogether(12)`.
// - 시안 담당이 문구를 고치면 이 파일만 고친다. 기능 이름은 기능명세서 · 시안의 이름을 그대로 쓴다.
// - src/app · src/ui · src/features에 한글 글자를 직접 쓰면 코드 검사(pnpm lint)가 막는다.
//   개발 확인용 화면(src/app/dev, src/features/dev)과 주석은 예외다.

export const ko = {
  appName: "이어봄",
  common: {
    confirm: "확인",
    cancel: "취소",
    close: "닫기",
    undo: "되돌리기",
    leave: "나가기",
  },
  tabs: { home: "홈", archive: "기록", settings: "마이" },
  /** 화면을 다 만들기 전 · 로그인 전 임시 안내 */
  app: {
    comingSoon: "곧 만들어요",
    signedOut: "로그인 전이에요. 카카오 로그인은 곧 붙어요.",
  },
  kind: { memo: "메모", question: "질문", news: "근황" },
  /** 서버 함수 오류 code별 문구 (supabase/functions/_shared/http.ts) */
  error: {
    unauthorized: "다시 로그인해 주세요",
    internal: "잠시 문제가 생겼어요. 조금 뒤에 다시 해 주세요",
    network: "인터넷 연결을 확인해 주세요",
  },
  dev: {
    serverChecking: "서버 확인 중",
    serverOk: "서버 연결됨",
    serverFail: "서버 연결 안 됨",
    gallery: "공통 부품 보기",
  },
} as const;
