// DB 검사(pgTAP)를 돌린다. 검사마다 한 묶음(트랜잭션)으로 실행하고 끝에 일부러 오류를 내서
// 모두 되돌린다. 그래서 개발 DB에 돌려도 데이터가 남지 않는다.
//
//   pnpm test:db                 연결된 개발 DB에서 (아직 올리지 않은 마이그레이션도 같은 묶음에 넣어 시험)
//   pnpm test:db --local         로컬 DB(Docker, CI)에서 psql로 (supabase db start가 마이그레이션을 이미 올림)
//   pnpm test:db --with-seed     가짜 데이터(supabase/seed.sql)를 넣은 상태로 (CI의 로컬 DB와 같은 조건)
//   pnpm test:db 파일 …          일부만
//
// 검사 파일(supabase/tests/database/*.test.sql)은 보통 pgTAP 모양으로 쓴다:
//   begin; select plan(N); select ok(…); … select * from finish(); rollback;
// 맨 앞에 supabase/tests/helpers.sql(시험용 사용자 만들기 · 로그인 바꾸기)을 붙여 실행한다.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SUPABASE = join(ROOT, "node_modules", ".bin", "supabase");
const TESTS = join(ROOT, "supabase", "tests", "database");
const MIGRATIONS = join(ROOT, "supabase", "migrations");

const args = process.argv.slice(2);
const local = args.includes("--local");
const withSeed = args.includes("--with-seed");
const target = local ? "--local" : "--linked";
const picked = args.filter((a) => !a.startsWith("--"));

// 로컬 DB 기본 주소 (supabase db start). 다르면 SUPABASE_DB_URL로 준다
const LOCAL_DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

function query(sql) {
  const file = join(mkdtempSync(join(tmpdir(), "ieobom-db-")), "q.sql");
  writeFileSync(file, sql);
  // 개발 DB는 관리 API로 여러 문장을 한 번에 보낸다. 로컬은 CLI가 한 문장씩만 받아서 psql을 쓴다
  const [cmd, cmdArgs] = local
    ? ["psql", [LOCAL_DB_URL, "-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", file]]
    : [SUPABASE, ["db", "query", target, "-f", file]];
  try {
    return { ok: true, out: execFileSync(cmd, cmdArgs, { cwd: ROOT, encoding: "utf8", stdio: "pipe" }) };
  } catch (e) {
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

/** 개발 DB에 아직 안 올린 마이그레이션 */
function pendingMigrations() {
  if (local) return [];
  const res = query("select version from supabase_migrations.schema_migrations");
  if (!res.ok) throw new Error(`마이그레이션 기록을 못 읽었습니다\n${res.out}`);
  const applied = new Set([...res.out.matchAll(/"version":\s*"(\d+)"/g)].map((m) => m[1]));
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql") && !applied.has(f.split("_")[0]))
    .sort();
}

// pgTAP 함수를 부르는 줄의 결과(TAP 글)를 모아 둔다
const TAP_CALL =
  /^select\s+(plan|ok|is|isnt|matches|imatches|alike|unalike|cmp_ok|pass|fail|diag|results_eq|results_ne|set_eq|bag_eq|row_eq|is_empty|isnt_empty|throws_ok|throws_like|throws_matching|lives_ok|performs_ok|has_\w+|hasnt_\w+|col_\w+|policies_are|policy_\w+|function_\w+|is_definer|isnt_definer|table_privs_are|is_strict)\s*\(/i;

function wrap(body) {
  const lines = body
    .replace(/^\s*begin\s*;\s*$/im, "")
    .replace(/^\s*select\s+\*\s+from\s+finish\(\)\s*;\s*$/im, "")
    .replace(/^\s*rollback\s*;\s*$/im, "")
    .split("\n")
    .map((l) =>
      TAP_CALL.test(l) ? l.replace(/^select\s+/i, "insert into pg_temp.tap_out(line) select ") : l,
    );
  return lines.join("\n");
}

function run(file, pending) {
  const sql = [
    "begin;",
    // 다른 사용자(anon · authenticated)로 바꾼 뒤에도 결과를 적을 수 있게 연다(pgTAP 표도 같은 방식)
    "create temp table tap_out(id serial, line text);",
    "grant insert on pg_temp.tap_out to public; grant usage on sequence pg_temp.tap_out_id_seq to public;",
    ...pending.map((m) => `-- 마이그레이션 ${m}\n${readFileSync(join(MIGRATIONS, m), "utf8")}`),
    withSeed ? readFileSync(join(ROOT, "supabase", "seed.sql"), "utf8") : "",
    readFileSync(join(ROOT, "supabase", "tests", "helpers.sql"), "utf8"),
    wrap(readFileSync(file, "utf8")),
    // 다른 사용자로 바꿨다면 되돌린 뒤 결과를 모은다
    "reset role;",
    `do $$ declare out text; planned int; failed int; ran int;
begin
  select string_agg(line, E'\\n' order by id) into out from pg_temp.tap_out;
  -- pgTAP 1.3은 실패 수 · 계획 수를 _get()으로, 실행 수를 번호 시퀀스로 남긴다
  failed := coalesce(_get('failed'), 0);
  planned := _get('plan');
  select case when is_called then last_value else 0 end into ran from __tresults___numb_seq;
  raise exception 'TAPB64:%:%:%:%:END', translate(encode(convert_to(coalesce(out, ''), 'UTF8'), 'base64'), E'\\n', ''), ran, failed, coalesce(planned, -1);
end $$;`,
  ].join("\n");
  const res = query(sql);
  const m = /TAPB64:([A-Za-z0-9+/=]*):(\d+):(\d+):(-?\d+):END/.exec(res.out);
  if (!m) return { pass: false, text: `실행 실패\n${res.out.trim()}` };
  const [, b64, ran, failed, planned] = m;
  const text = Buffer.from(b64, "base64").toString("utf8");
  const pass = Number(failed) === 0 && Number(ran) === Number(planned);
  const note = Number(ran) !== Number(planned) ? `\n# 계획 ${planned}개 중 ${ran}개 실행` : "";
  return { pass, text: text + note };
}

const files = (
  picked.length
    ? picked
    : readdirSync(TESTS)
        .filter((f) => f.endsWith(".test.sql"))
        .sort()
        .map((f) => join(TESTS, f))
).map((f) => (f.includes("/") ? f : join(TESTS, f)));
const pending = pendingMigrations();
if (pending.length) console.log(`아직 올리지 않은 마이그레이션도 함께 시험: ${pending.join(", ")}`);

let failedFiles = 0;
for (const f of files) {
  const { pass, text } = run(f, pending);
  console.log(`${pass ? "ok  " : "FAIL"} ${basename(f)}`);
  if (!pass) {
    failedFiles++;
    console.log(text.replace(/^/gm, "    "));
  }
}
console.log(failedFiles ? `\n${failedFiles}개 파일 실패` : `\n${files.length}개 파일 모두 통과`);
process.exit(failedFiles ? 1 : 0);
