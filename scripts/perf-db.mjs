// DB 속도 점검(계획 10-4). supabase/tests/perf/load.sql에 가짜 가족을 넣고 주요 DB 함수를 여러 번 불러
// 걸린 시간과 처음부터 끝까지 훑은 표를 보여 준다. 한 묶음으로 실행하고 끝에 일부러 오류를 내서 모두 되돌린다.
//
//   pnpm perf:db           연결된 개발 DB에서 가족 1만 쌍
//   pnpm perf:db 1000      쌍 수를 바꿔서
// 아직 올리지 않은 마이그레이션(예: 새 인덱스)도 같은 묶음에 넣어 재 본다.
//
// 되돌린 뒤 남는 빈 공간은 표마다 VACUUM · REINDEX로 돌려준다(개발 DB 크기가 늘지 않게).

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SUPABASE = join(ROOT, "node_modules", ".bin", "supabase");
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const pairs = Number(process.argv[2] ?? 10000);
if (!Number.isInteger(pairs) || pairs < 120) throw new Error("쌍 수는 120 이상인 정수로 주세요");

function query(sql) {
  const file = join(mkdtempSync(join(tmpdir(), "ieobom-perf-")), "q.sql");
  writeFileSync(file, sql);
  try {
    return execFileSync(SUPABASE, ["db", "query", "--linked", "-f", file], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
      maxBuffer: 1 << 26,
    });
  } catch (e) {
    return `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
}

// 개발 DB에 아직 안 올린 마이그레이션
const applied = new Set(
  [
    ...query("select version from supabase_migrations.schema_migrations").matchAll(/"version":\s*"(\d+)"/g),
  ].map((m) => m[1]),
);
const pending = readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith(".sql") && !applied.has(f.split("_")[0]))
  .sort();
if (pending.length) console.log(`아직 올리지 않은 마이그레이션도 함께: ${pending.join(", ")}`);

const body = readFileSync(join(ROOT, "supabase", "tests", "perf", "load.sql"), "utf8").replaceAll(
  "{{PAIRS}}",
  String(pairs),
);
const started = Date.now();
const out = query(
  [
    "begin;",
    "set local statement_timeout = '10min';",
    ...pending.map((f) => readFileSync(join(MIGRATIONS, f), "utf8")),
    body,
    `do $$ declare out text; begin
  select jsonb_agg(to_jsonb(p))::text into out from pg_temp.perf_out p;
  raise exception 'PERFB64:%:END', translate(encode(convert_to(coalesce(out, '[]'), 'UTF8'), 'base64'), E'\\n', '');
end $$;`,
  ].join("\n"),
);
const m = /PERFB64:([A-Za-z0-9+/=]*):END/.exec(out);
if (!m) {
  console.error(`실행 실패\n${out.trim()}`);
  process.exit(1);
}
const rows = JSON.parse(Buffer.from(m[1], "base64").toString("utf8"));
console.log(`가족 ${pairs}쌍 · ${Math.round((Date.now() - started) / 1000)}초\n`);
console.log("| 함수 | 평균 ms | 가장 느림 ms | 훑은 표(줄 수) |");
console.log("|---|---:|---:|---|");
for (const r of rows) console.log(`| ${r.label} | ${r.avg_ms} | ${r.max_ms} | ${r.seq_scans || "없음"} |`);

const tables = [
  "users",
  "relationships",
  "relationship_settings",
  "call_times",
  "exchange_questions",
  "answers",
  "calls",
  "memos",
  "news",
  "news_photos",
  "talk_suggestions",
  "memo_drafts",
];
for (const t of [...tables.map((t) => `public.${t}`), "auth.users"]) {
  query(`vacuum ${t};`);
  query(`reindex table ${t};`);
}
