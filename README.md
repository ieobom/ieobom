# 이어봄

앱과 서버를 한 저장소에서 관리합니다(pnpm 모노레포). 표 하나를 바꾸면 앱 화면과 서버 함수를 함께 고치기 때문입니다.

## 디렉토리 구조

<!-- structure:start -->
```
ieobom/
├── .github/
│   └── workflows/
│       └── ci.yml                        올릴 때마다 설치 · 구조도 검사
├── .vscode/                              팀 공통 편집기 설정 (서버 함수는 Deno)
├── apps/                                 앱
│   └── mobile/                           Expo 앱 (자녀 · 부모님이 같은 앱)
│       └── .env.example                  앱 공개 값 목록 (Supabase 주소 · 공개 키 · 카카오 앱 키)
├── docs/                                 개발 문서
│   ├── dev-plan.md                       개발 계획 — 작업 단위 · 커밋 · 일정 · 최적화
│   └── tech-stack.md                     기술 스택 · 정할 것
├── packages/                             앱이 같이 쓰는 패키지
│   └── shared/                           @ieobom/shared — 공통 값과 DB 타입
│       └── src/
│           └── index.ts                  근황 주제 · 기분 · 요일 같은 정해진 값
├── scripts/                              개발용 스크립트
│   └── update-structure.mjs              이 구조도를 다시 만든다 (pnpm structure)
├── supabase/                             서버 (Supabase)
│   ├── functions/                        Edge Functions — AI · 말 → 글 · 통화 · 알림
│   │   ├── _shared/                      서버 함수끼리 쓰는 코드와 DB 타입
│   │   └── .env.example                  서버 함수 비밀값 목록 (AI · 말 → 글 · 통화 · 알림 · 카카오)
│   ├── migrations/                       표 · RLS · DB 함수 · pg_cron SQL (기준: 19 ERD)
│   └── config.toml                       Supabase CLI 설정
├── .npmrc                                pnpm 설치 방식 (네이티브 모듈 때문에 hoisted)
├── .nvmrc                                Node 버전 (24)
├── CLAUDE.md                             Claude 작업 규칙
├── package.json                          pnpm 버전 고정 · 스크립트
├── pnpm-workspace.yaml                   워크스페이스 목록
└── README.md                             이 문서
```
<!-- structure:end -->

이 구조도는 `scripts/update-structure.mjs`가 실제 폴더를 읽어 만듭니다. 폴더나 주요 파일을 더하거나 옮기면 그 스크립트의 `DESC`에 한 줄 설명을 넣고 `pnpm structure`를 실행합니다. `pnpm structure:check`는 구조도가 실제와 다르거나 설명이 빠진 폴더가 있으면 실패합니다.

서버 함수는 Deno에서 돌아가 `packages/shared`를 바로 가져오기 어렵습니다. 그래서 DB 타입은 `supabase/functions/_shared/database.types.ts`에 만들고 `packages/shared`가 그 파일을 다시 내보냅니다.

## 기준 문서

- 개발 계획: `docs/dev-plan.md` (작업 단위와 커밋 · 일정과 관문 · 최적화)
- 기술 스택: `docs/tech-stack.md` (서버 · 앱 · 바깥 서비스 · 정할 것)
- 데이터 구조: `../19_이어봄_ERD.html` (38차 시안 기준)
- 서버 함수 · 정해진 시간 작업: `../16_이어봄_서비스_아키텍처.html` (27차 기준이라 앱 안 통화 · 근황은 19를 따름)
- 화면 동작: `../이어봄_39차시안.html` (바뀐 내용은 `../20_이어봄_39차시안_변경내역.html`)

## 시작하기

Node 24와 pnpm이 필요합니다. pnpm 버전은 `package.json`의 `packageManager`에 고정되어 있고, corepack이 그 버전을 받아 씁니다.

```bash
corepack enable pnpm
pnpm install
cp apps/mobile/.env.example apps/mobile/.env
cp supabase/functions/.env.example supabase/functions/.env
```

`.env` 값은 팀 비밀 공유 채널에서 받습니다. 저장소에는 `.env.example`(이름만)만 올립니다.

- `apps/mobile/.env`: 앱에 들어가는 공개 값만 (`EXPO_PUBLIC_`)
- `supabase/functions/.env`: 서버 함수 비밀값. 배포할 때 `supabase secrets set`으로 올립니다.

### Supabase

개발용 프로젝트(`ieobom-dev`, 서울)에 연결해서 씁니다. 로컬 DB(Docker)는 쓰지 않습니다. 프로젝트 ref는 `njsecrkivrpdzhxffgjy`입니다.

```bash
pnpm supabase login
pnpm supabase link --project-ref njsecrkivrpdzhxffgjy
```

표를 바꿀 때는 마이그레이션을 만들고 개발 DB에 올립니다.

```bash
pnpm supabase migration new 이름
pnpm supabase db push
```

VS Code를 쓰면 추천 확장(Deno · ESLint · Prettier · EditorConfig)을 설치합니다. `supabase/functions`는 Deno로 검사됩니다.

이 저장소는 비공개이고 라이선스를 두지 않습니다(All rights reserved).
