# 이어봄

앱과 서버를 한 저장소에서 관리합니다(pnpm 모노레포). 표 하나를 바꾸면 앱 화면과 서버 함수를 함께 고치기 때문입니다.

## 디렉토리 구조

<!-- structure:start -->
```
ieobom/
├── apps/                                 앱
│   └── mobile/                           Expo 앱 (자녀 · 부모님이 같은 앱)
├── docs/                                 개발 문서
│   └── tech-stack.md                     기술 스택 · 정할 것
├── packages/                             앱이 같이 쓰는 패키지
│   └── shared/                           @ieobom/shared — 공통 값과 DB 타입
│       └── src/
│           └── index.ts                  근황 주제 · 기분 · 요일 같은 정해진 값
├── scripts/                              개발용 스크립트
│   └── update-structure.mjs              이 구조도를 다시 만든다 (pnpm structure)
├── supabase/                             서버 (Supabase)
│   ├── functions/                        Edge Functions — AI · 말 → 글 · 통화 · 알림
│   │   └── _shared/                      서버 함수끼리 쓰는 코드와 DB 타입
│   └── migrations/                       표 · RLS · DB 함수 · pg_cron SQL (기준: 19 ERD)
├── CLAUDE.md                             Claude 작업 규칙
├── package.json                          pnpm 버전 고정 · 스크립트
├── pnpm-workspace.yaml                   워크스페이스 목록
└── README.md                             이 문서
```
<!-- structure:end -->

이 구조도는 `scripts/update-structure.mjs`가 실제 폴더를 읽어 만듭니다. 폴더나 주요 파일을 더하거나 옮기면 그 스크립트의 `DESC`에 한 줄 설명을 넣고 `pnpm structure`를 실행합니다. `pnpm structure:check`는 구조도가 실제와 다르거나 설명이 빠진 폴더가 있으면 실패합니다.

서버 함수는 Deno에서 돌아가 `packages/shared`를 바로 가져오기 어렵습니다. 그래서 DB 타입은 `supabase/functions/_shared/database.types.ts`에 만들고 `packages/shared`가 그 파일을 다시 내보냅니다.

## 기준 문서

- 기술 스택: `docs/tech-stack.md` (서버 · 앱 · 바깥 서비스 · 정할 것)
- 데이터 구조: `../19_이어봄_ERD.html` (38차 시안 기준)
- 서버 함수 · 정해진 시간 작업: `../16_이어봄_서비스_아키텍처.html` (27차 기준이라 앱 안 통화 · 근황은 19를 따름)
- 화면 동작: `../이어봄_39차시안.html` (바뀐 내용은 `../20_이어봄_39차시안_변경내역.html`)

## 시작하기

```bash
corepack enable pnpm
pnpm install
pnpm dlx supabase init
```

pnpm 버전은 `package.json`의 `packageManager`에 고정되어 있고, corepack이 그 버전을 받아 씁니다.

앱은 `apps/mobile`에 Expo로 만듭니다. 열쇠(카카오 · OpenAI · 음성 인식 · 음성 통화)는 `.env`에만 두고 올리지 않습니다.
