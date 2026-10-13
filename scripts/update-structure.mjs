// README의 '디렉토리 구조'를 실제 폴더에서 다시 만든다.
//   pnpm structure         README를 고친다
//   pnpm structure:check   README가 실제와 다르거나 설명이 빠진 폴더가 있으면 실패한다
//
// 폴더나 주요 파일을 더하면 아래 DESC에 한 줄 설명을 함께 넣는다.
// 설명이 없는 폴더는 '← 설명 필요'로 표시된다. 파일은 DESC에 있는 것만 보인다.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const README = join(ROOT, "README.md");
const START = "<!-- structure:start -->";
const END = "<!-- structure:end -->";
const MAX_DEPTH = 4;

const IGNORE = new Set([
  "node_modules",
  ".git",
  ".expo",
  "dist",
  "build",
  "ios",
  "android",
  ".temp",
  ".branches",
  ".DS_Store",
  ".gitkeep",
]);

/** 경로(폴더는 끝에 /) → 한 줄 설명 */
const DESC = {
  ".github/": "",
  ".github/workflows/": "",
  ".github/workflows/ci.yml": "올릴 때마다 설치 · 구조도 · 모양 · 코드 · 타입 · 서버 함수 · DB 검사",
  ".vscode/": "팀 공통 편집기 설정 (서버 함수는 Deno)",
  "apps/": "앱",
  "apps/mobile/": "Expo 앱 (자녀 · 부모님이 같은 앱)",
  "apps/mobile/.env.example": "앱 공개 값 목록 (Supabase 주소 · 공개 키 · 카카오 앱 키)",
  "apps/mobile/app.config.ts": "앱 이름 · 번들 ID (개발용 빌드는 APP_VARIANT=development)",
  "apps/mobile/src/": "",
  "apps/mobile/src/app/": "화면 (Expo Router, 파일 = 주소)",
  "apps/mobile/src/copy/": "화면 문구 (ko.ts 하나에 모음)",
  "apps/mobile/src/features/": "기능별 데이터 불러오기 · 부품",
  "apps/mobile/src/features/config/": "기능 켜고 끄기 읽기 (useFeature · IfFeature)",
  "apps/mobile/src/features/dev/": "개발 확인용 (서버 연결)",
  "apps/mobile/src/app/dev/": "개발 확인용 화면 (공통 부품 모음 · 출시 빌드에서는 안 열림)",
  "apps/mobile/src/ui/": "디자인 값(39차 시안의 C · R) · 글꼴 · 공통 부품",
  "apps/mobile/src/lib/": "서버 연결 · 세션 저장 · 데이터 불러오기 설정",
  "docs/": "개발 문서",
  "docs/tech-stack.md": "기술 스택 · 정할 것",
  "docs/dev-plan.md": "개발 계획 — 작업 단위 · 커밋 · 일정 · 최적화",
  "packages/": "앱이 같이 쓰는 패키지",
  "packages/shared/": "@ieobom/shared — 공통 값과 DB 타입",
  "packages/shared/src/": "",
  "packages/shared/tsconfig.json": "타입 검사 설정 (tsconfig.base.json을 이어 씀)",
  "packages/shared/src/index.ts":
    "근황 주제 · 기분 · 요일 · 기능 이름 같은 정해진 값 + DB 타입 다시 내보내기",
  "scripts/": "개발용 스크립트",
  "scripts/update-structure.mjs": "이 구조도를 다시 만든다 (pnpm structure)",
  "scripts/test-db.mjs": "DB 검사 실행 (pnpm test:db, 끝나면 모두 되돌림)",
  "supabase/": "서버 (Supabase)",
  "supabase/config.toml": "Supabase CLI 설정",
  "supabase/migrations/": "표 · RLS · DB 함수 · pg_cron SQL (기준: 19 ERD)",
  "supabase/tests/": "DB 검사 (pgTAP)",
  "supabase/tests/helpers.sql": "시험용 사용자 만들기 · 로그인 바꾸기",
  "supabase/tests/database/": "표마다 보는 사람 규칙 · DB 함수 검사",
  "supabase/functions/": "Edge Functions — AI · 말 → 글 · 통화 · 알림",
  "supabase/functions/deno.json": "서버 함수 의존성 · 검사 설정 (pnpm fn:lint · fn:check · fn:test)",
  "supabase/functions/_shared/": "서버 함수끼리 쓰는 코드와 DB 타입",
  "supabase/functions/_shared/auth.ts": "부른 사람 확인 (로그인 토큰 검증)",
  "supabase/functions/_shared/env.ts": "환경 변수 · Supabase 열쇠 읽기",
  "supabase/functions/_shared/http.ts": "응답 · 오류 형식",
  "supabase/functions/ping/": "살아 있는지 · 로그인 토큰이 통하는지 확인",
  "supabase/functions/_shared/database.types.ts": "DB 타입 — pnpm db:types로 만든다 (손으로 고치지 않음)",
  "supabase/functions/.env.example": "서버 함수 비밀값 목록 (AI · 말 → 글 · 통화 · 알림 · 카카오)",
  "eslint.config.mjs": "코드 검사 설정 (pnpm lint, 서버 함수는 제외)",
  ".prettierrc.json": "모양 맞추기 설정 (pnpm format)",
  "tsconfig.base.json": "패키지들이 같이 쓰는 타입 검사 설정",
  ".nvmrc": "Node 버전 (24)",
  ".npmrc": "pnpm 설치 방식 (네이티브 모듈 때문에 hoisted)",
  "CLAUDE.md": "Claude 작업 규칙",
  "README.md": "이 문서",
  "package.json": "pnpm 버전 고정 · 스크립트 (structure · db:types)",
  "pnpm-workspace.yaml": "워크스페이스 목록",
};

function walk(dir, depth) {
  if (depth > MAX_DEPTH) return [];
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => !IGNORE.has(e.name))
    .map((e) => ({ e, rel: relative(ROOT, join(dir, e.name)) + (e.isDirectory() ? "/" : "") }))
    .filter(({ e, rel }) => e.isDirectory() || rel in DESC)
    .sort((a, b) =>
      a.e.isDirectory() === b.e.isDirectory() ? a.e.name.localeCompare(b.e.name) : a.e.isDirectory() ? -1 : 1,
    );
  return entries.map(({ e, rel }) => ({
    name: e.name + (e.isDirectory() ? "/" : ""),
    rel,
    children: e.isDirectory() ? walk(join(dir, e.name), depth + 1) : [],
  }));
}

const missing = [];
function render(nodes, prefix = "") {
  const lines = [];
  nodes.forEach((n, i) => {
    const last = i === nodes.length - 1;
    const head = prefix + (last ? "└── " : "├── ") + n.name;
    let note = DESC[n.rel];
    if (note === undefined) {
      note = "← 설명 필요";
      missing.push(n.rel);
    }
    lines.push(note ? head.padEnd(40) + "  " + note : head);
    lines.push(...render(n.children, prefix + (last ? "    " : "│   ")));
  });
  return lines;
}

const tree = ["ieobom/", ...render(walk(ROOT, 1))].join("\n");
const block = `${START}\n\`\`\`\n${tree}\n\`\`\`\n${END}`;

const readme = readFileSync(README, "utf8");
const s = readme.indexOf(START),
  e = readme.indexOf(END);
if (s < 0 || e < 0) {
  console.error(`README에 ${START} / ${END} 표시가 없습니다.`);
  process.exit(1);
}
const next = readme.slice(0, s) + block + readme.slice(e + END.length);

if (process.argv.includes("--check")) {
  const problems = [];
  if (next !== readme) problems.push("README 구조도가 실제 폴더와 다릅니다. `pnpm structure`를 실행하세요.");
  if (missing.length)
    problems.push(
      "설명이 없는 폴더: " + missing.join(", ") + " → scripts/update-structure.mjs의 DESC에 더하세요.",
    );
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log("README 구조도가 최신입니다.");
} else {
  writeFileSync(README, next);
  console.log(next === readme ? "바뀐 것 없음" : "README 구조도를 고쳤습니다.");
  if (missing.length) console.warn("설명이 없는 폴더: " + missing.join(", "));
}
