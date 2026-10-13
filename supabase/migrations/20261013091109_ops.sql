-- 2-9 운영 표: 공지 · 공지 확인 · 문의 · 설문 문항 · 설문 응답 · 알림 보낸 기록 · 이용 기록 · 앱 오류 · 사용량.
-- 운영팀은 Supabase 관리 화면에서 공지 · 문의 답 · 설문 문항을 쓴다(11-6).

-- ── 공지 ───────────────────────────────────────
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  -- maintenance 점검 · terms 약관 변경 · etc 기타
  kind text not null default 'etc' check (kind in ('maintenance', 'terms', 'etc')),
  title text not null,
  body text not null,
  -- 덧붙임(예: 급한 일은 휴대폰 전화로)
  note text not null default '',
  show_from timestamptz not null default now(),
  show_until timestamptz not null,
  created_at timestamptz not null default now(),
  check (show_until > show_from)
);

alter table public.notices enable row level security;
revoke all on public.notices from anon, authenticated;
grant select on public.notices to anon, authenticated;
create policy "보일 때만 읽기" on public.notices for select to anon, authenticated
  using (now() >= show_from and now() < show_until);

create table public.notice_reads (
  notice_id uuid not null references public.notices (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  primary key (notice_id, user_id)
);

alter table public.notice_reads enable row level security;
revoke all on public.notice_reads from anon, authenticated;
grant select on public.notice_reads to authenticated;
grant insert (notice_id, user_id) on public.notice_reads to authenticated;
create policy "나만 읽기" on public.notice_reads for select to authenticated using (user_id = (select auth.uid()));
create policy "나만 확인하기" on public.notice_reads for insert to authenticated with check (user_id = (select auth.uid()));

-- ── 문의 ───────────────────────────────────────
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  -- 보낸 사람. 탈퇴하면 빈칸(답한 날부터 1년 보관, 11-5)
  user_id uuid references public.users (id) on delete set null,
  -- 어느 도움말에서 보냈는지
  help_item text not null default '',
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  answer text,
  -- 답한 때. 알림을 바로 보낸다(6-6)
  answered_at timestamptz,
  answer_seen_at timestamptz
);

create index inquiries_user_idx on public.inquiries (user_id, created_at desc);

alter table public.inquiries enable row level security;
revoke all on public.inquiries from anon, authenticated;
grant select on public.inquiries to authenticated;
grant insert (user_id, help_item, body) on public.inquiries to authenticated;
grant update (answer_seen_at) on public.inquiries to authenticated;
create policy "나만 읽기" on public.inquiries for select to authenticated using (user_id = (select auth.uid()));
create policy "내 이름으로만 보내기" on public.inquiries for insert to authenticated with check (user_id = (select auth.uid()));
create policy "내 문의의 답 본 때만 적기" on public.inquiries for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ── 이용 설문 (0 · 3 · 6주) ─────────────────────
create table public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  round int not null check (round in (0, 3, 6)),
  sort int not null,
  text text not null,
  unique (round, sort)
);

alter table public.survey_questions enable row level security;
revoke all on public.survey_questions from anon, authenticated;
grant select on public.survey_questions to authenticated;
create policy "누구나 읽기" on public.survey_questions for select to authenticated using (true);

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  -- 어느 가족과 이어진 날 기준인지(ERD 7-5)
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  round int not null check (round in (0, 3, 6)),
  -- 문항마다 고른 점수 { 문항 ID: 점수 }
  scores jsonb not null default '{}'::jsonb,
  comment text not null default '' check (char_length(comment) <= 2000),
  submitted_at timestamptz not null default now(),
  -- 차수마다 한 번
  unique (user_id, relationship_id, round)
);

alter table public.survey_responses enable row level security;
revoke all on public.survey_responses from anon, authenticated;
grant select on public.survey_responses to authenticated;
grant insert (user_id, relationship_id, round, scores, comment) on public.survey_responses to authenticated;
create policy "나만 읽기" on public.survey_responses for select to authenticated using (user_id = (select auth.uid()));
create policy "내 가족 설문만 보내기" on public.survey_responses for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_member(relationship_id));

-- ── 알림 보낸 기록 (서버만) ─────────────────────
create table public.push_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  -- 누구의 알림인지(가족이 둘 이상일 때 '이어봄 · 엄마')
  relationship_id uuid references public.relationships (id) on delete set null,
  -- daily 하루 묶음 · missed_call 못 받은 전화 · connected 이어졌어요 · early_answer 먼저 온 답 · inquiry_answer 문의 답 · draft_ready 초안 다 됨
  kind text not null check (kind in ('daily', 'missed_call', 'connected', 'early_answer', 'inquiry_answer', 'draft_ready')),
  body text not null default '',
  -- 같은 알림이 두 번 가지 않게 하는 열쇠(예: daily:2026-10-15)
  dedupe_key text,
  sent_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index push_log_sent_idx on public.push_log (sent_at);

alter table public.push_log enable row level security;
revoke all on public.push_log from anon, authenticated;

-- ── 이용 기록 (서버 · 함수만) ───────────────────
-- 사용자 표와 잇지 않는다. 개인을 알아볼 수 없게 바꾼 표시만 둔다. 6개월 뒤 지운다(11-5)
create table public.events (
  id bigint generated always as identity primary key,
  anon_id text not null,
  name text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index events_created_idx on public.events (created_at);

alter table public.events enable row level security;
revoke all on public.events from anon, authenticated;

-- ── 앱 오류 (쓰기만) ────────────────────────────
-- 오류 종류 · 화면 · 앱 버전만 적는다(개인정보 없이, 11-3). 해외 오류 업체로 보내지 않는다
create table public.client_errors (
  id bigint generated always as identity primary key,
  kind text not null check (char_length(kind) between 1 and 100),
  screen text not null default '' check (char_length(screen) <= 100),
  app_version text not null default '' check (char_length(app_version) <= 30),
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now()
);

create index client_errors_created_idx on public.client_errors (created_at);

alter table public.client_errors enable row level security;
revoke all on public.client_errors from anon, authenticated;
grant insert (kind, screen, app_version, platform) on public.client_errors to anon, authenticated;
create policy "누구나 쓰기만" on public.client_errors for insert to anon, authenticated with check (true);

-- ── 사용량 (서버만) ─────────────────────────────
-- 쌍당 주간 사용량을 본다(11-1). 탈퇴해도 수치는 남기고 사람 칸만 비운다
create table public.usage (
  id bigint generated always as identity primary key,
  user_id uuid references public.users (id) on delete set null,
  relationship_id uuid references public.relationships (id) on delete set null,
  -- ai_tokens AI 토큰 · stt_short_seconds 짧은 말→글 초 · stt_call_seconds 통화 녹음 말→글 초
  -- call_minutes 통화 참가자·분 · recording_minutes 녹음 분 · photo_mb 사진 MB
  kind text not null check (kind in ('ai_tokens', 'stt_short_seconds', 'stt_call_seconds', 'call_minutes', 'recording_minutes', 'photo_mb')),
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index usage_created_idx on public.usage (created_at);
create index usage_relationship_idx on public.usage (relationship_id, created_at);

alter table public.usage enable row level security;
revoke all on public.usage from anon, authenticated;
