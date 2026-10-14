// 화면 문구. 앱에 보이는 글은 모두 여기에 둔다(계획 1-8).
//
// 쓰는 법
// - 화면 · 부품에서는 `import { ko } from "@/copy/ko"` 로 가져와 `ko.common.confirm`처럼 쓴다.
// - 사람 이름 · 숫자가 들어가는 문구는 함수로 둔다: `ko.example.daysTogether(12)`.
// - 시안 담당이 문구를 고치면 이 파일만 고친다. 기능 이름은 기능명세서 · 시안의 이름을 그대로 쓴다.
// - src/app · src/ui · src/features에 한글 글자를 직접 쓰면 코드 검사(pnpm lint)가 막는다.
//   개발 확인용 화면(src/app/dev, src/features/dev)과 주석은 예외다.

import type { SeoulParts } from "@/lib/dates";
import { josa, withKke, withWa } from "@/lib/korean";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 시안의 hourSeg: 오전 · 낮 · 오후 · 저녁 · 밤
const seg = (h: number) => (h < 12 ? "오전" : h === 12 ? "낮" : h < 18 ? "오후" : h < 21 ? "저녁" : "밤");
const hour12 = (h: number) => (h > 12 ? h - 12 : h);

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
  family: { mom: "엄마", dad: "아빠", someone: "가족" },
  time: {
    hour: (h: number) => `${seg(h)} ${hour12(h)}시`,
    /** '저녁 8시 – 10시' (같은 때면 뒤는 시만) */
    range: (s: number, e: number) => {
      const same = seg(s) === seg(e) || (seg(s) === "저녁" && seg(e) === "밤");
      return `${seg(s)} ${hour12(s)}시 – ${same ? `${hour12(e)}시` : `${seg(e)} ${hour12(e)}시`}`;
    },
    date: (p: SeoulParts) => `${p.month}월 ${p.day}일`,
    dateDay: (p: SeoulParts) => `${p.month}월 ${p.day}일 ${WEEK[p.dow]}요일`,
    weekday: (p: SeoulParts) => `${WEEK[p.dow]}요일`,
    justNow: "조금 전",
  },
  /** 홈 (39차 홈 · 카드 줄) */
  home: {
    invite: "초대",
    inviteLabel: "가족 초대하기",
    inviting: (who: string) => `${who} 초대 중`,
    child: "자녀",
    together: (p: string, days: number) =>
      days > 1 ? `${withWa(p)} 이어진 지 ${days}일` : `${withWa(p)} 오늘 이어졌어요`,
    notice: "공지",
    noticeOn: (date: string) => `공지 · ${date}`,
    noticeOk: "확인했어요",
    tiles: { call: "통화", make: "질문 만들기", makeSub: "근황도 보내요" },
    deck: (n: number) => `홈 카드 ${n}장`,
    dot: (n: number, i: number) => `${n}장 중 ${i}번째 카드`,
    prev: "이전 카드",
    next: "다음 카드",
    onlyMe: "나만 보여요",
    ok: "확인했어요",
    missed: {
      head: "못 받은 전화",
      title: (p: string) => `${josa(p, "이", "가")} 전화했었어요`,
      call: (p: string) => `${withKke(p)} 다시 걸기`,
    },
    timing: {
      head: "통화 편한 시간",
      title1: (p: string) => `지금은 ${withWa(p)} 둘 다`,
      title2: "통화 편한 시간이에요.",
      sub: (range: string) => `서로 고른 ${josa(range, "이", "가")} 겹쳐요.`,
      talkHead: (parent: boolean) => (parent ? "이번 통화 때 물어볼 이야기" : "이번 통화 때 여쭤볼 이야기"),
      fromMemo: "내가 쓴 메모",
      ai: "AI",
      call: (p: string) => `${withKke(p)} 전화 걸기`,
    },
    question: {
      today: "오늘의 질문",
      last: "지난 질문",
      next: "다음 질문",
      fromBank: "AI가 만든 질문",
      fromCustom: "직접 만든 질문",
      threeDays: "답한 지 3일이 지났어요",
      opened: "서로의 답이 열렸어요",
      received: "먼저 온 답",
      openHint: "둘 다 답하면 서로의 답이 열려요.",
      voice: "말로 답하기",
      text: "글로 쓰기",
      answer: "답하기",
      mine: "내 답",
      me: "나",
      waitingLine: (p: string) => `${josa(p, "이", "가")} 답하면 서로의 답이 열려요.`,
      askEarly1: (p: string) => `${p} 답이 아직이에요.`,
      askEarly2: "내 답만 먼저 보낼까요?",
      sendFirst: "먼저 보내기",
      keepMine: "나만 보고 끝내기",
      received1: (p: string) => `${josa(p, "이", "가")} 먼저 보낸 답이에요.`,
      received2: "이 질문은 여기서 끝났어요.",
      partnerFirst2: "내 답을 보내면 서로의 답이 열려요.",
      past: "지난 질문 보기",
      nextOn: (date: string, day: string) => `다음 질문은 ${date} ${day}에 와요`,
      mineOn1: (date: string) => `${date}에는 `,
      mineOn2: "내가 만든 질문",
      mineOn3: "이 가요",
      theirsOn: (date: string, p: string) => `${date}에는 ${josa(p, "이", "가")} 만든 질문이 와요`,
      statAnswered: "함께 답한 질문",
      statMemos: "남긴 메모",
      statDays: "이어진 지",
      count: (n: number) => `${n}개`,
      days: (n: number) => (n > 1 ? `${n}일` : "첫날"),
    },
    news: {
      head: "새 근황",
      many: (n: number) => `${n}개 · 최근 것부터`,
      title: (p: string) => `${josa(p, "이", "가")} 근황을 보냈어요`,
      talk: (parent: boolean, q: string) =>
        `다음 통화 때 ${parent ? "물어볼" : "여쭤볼"} 이야기에 넣었어요 · ${q}`,
      ai: "AI",
    },
    draft: {
      head: "통화 메모 초안",
      title: "통화 메모 초안이 다 됐어요",
      sub: (date: string, p: string) => `${date} · ${withWa(p)}의 통화`,
      tag: "AI 초안",
      note: "고쳐서 저장해야 기록에 남아요 · 3일 뒤 지워져요",
      open: "확인하고 저장하기",
      remove: "초안 지우기",
      removed: "초안을 지웠어요",
    },
    solo: {
      left1: (p: string) => `${josa(p, "이", "가")} 이어봄을`,
      left2: "그만두어 연결이 끊겼어요",
      leftSub: "내가 남긴 메모와 답은 기록에 그대로 있어요.",
      none1: "지금 이어진",
      none2: "가족이 없어요",
      noneSub: "가족과 이어지면 시작할 수 있어요.",
      reinvite: "새로 초대하기",
      invite: "가족 초대하기",
      code: "받은 초대 코드 넣기",
    },
  },
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
    homeGallery: "홈 화면 (가짜 데이터)",
  },
} as const;
