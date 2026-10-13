-- 2-6 질문 목록 · 교환 질문 · 답 · 직접 만든 질문.
-- 질문 보내기는 정해진 시간 작업(8-3), 답 보내기 · 답 열기 · 먼저 보내기는 DB 함수(8-4 · 8-5)가 한다.

-- ── 질문 목록 (운영) ─────────────────────────────
create table public.question_bank (
  id uuid primary key default gen_random_uuid(),
  -- AI가 만든 초안을 사람이 검토한 문장
  text text not null check (char_length(btrim(text)) between 1 and 200),
  -- 피하고 싶은 주제와 같은 목록. 비어 있으면 어느 주제에도 걸리지 않는 질문
  topic text check (topic in ('결혼·연애', '취업·직장', '돈·재정', '건강', '종교', '정치', '다이어트', '학업')),
  reviewed boolean not null default false,
  -- 질문 만들기 화면의 예시로 보임
  is_example boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.question_bank is '질문 목록 (계획 2-6). 운영팀이 관리 화면에서 넣는다. 앱은 예시 질문만 읽는다.';

alter table public.question_bank enable row level security;
revoke all on public.question_bank from anon, authenticated;
grant select on public.question_bank to authenticated;
create policy "예시 질문만 읽기" on public.question_bank for select to authenticated using (is_example and reviewed);

-- ── 직접 만든 질문 ──────────────────────────────
create table public.custom_questions (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  -- 쓴 그대로. AI가 고치지 않음
  text text not null check (char_length(btrim(text)) between 1 and 200),
  -- 보낼 날(다음 질문 차례). 앞 질문이 지워지면 한 차례 앞당겨짐(8-6)
  send_on date not null,
  -- waiting 기다림 · sent 보냄 · deleted 지움
  status text not null default 'waiting' check (status in ('waiting', 'sent', 'deleted')),
  created_at timestamptz not null default now()
);

comment on table public.custom_questions is '직접 만든 질문 (계획 2-6). 만든 사람만 읽는다. 상대는 보내는 날까지 날짜만(함수로).';

-- 한 사람이 한 가족에게 기다리게 할 수 있는 질문은 하나
create unique index custom_questions_one_waiting_idx on public.custom_questions (relationship_id, author_id) where status = 'waiting';
create index custom_questions_send_idx on public.custom_questions (send_on) where status = 'waiting';

alter table public.custom_questions enable row level security;
revoke all on public.custom_questions from anon, authenticated;
grant select on public.custom_questions to authenticated;
create policy "만든 사람만 읽기" on public.custom_questions for select to authenticated using (author_id = (select auth.uid()));

-- ── 교환 질문 ──────────────────────────────────
create table public.exchange_questions (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  -- #번호. 연결마다 1부터, 두 화면에서 같음
  seq_no int not null check (seq_no > 0),
  -- 질문이 온 날(한국 날짜)
  sent_on date not null,
  bank_question_id uuid references public.question_bank (id) on delete set null,
  custom_question_id uuid references public.custom_questions (id) on delete set null,
  -- 보낸 질문 문장. 앱은 질문 목록을 못 읽어서 여기 남긴다
  text text not null,
  -- waiting 답 기다림 · opened 답 열림(둘 다 답함) · closed 끝남(다음 질문이 옴)
  status text not null default 'waiting' check (status in ('waiting', 'opened', 'closed')),
  opened_at timestamptz,
  child_seen_at timestamptz,
  parent_seen_at timestamptz,
  closed_at timestamptz,
  unique (relationship_id, seq_no),
  -- 답이 같은 연결을 가리키는지 묶기 위한 짝
  unique (id, relationship_id)
);

comment on table public.exchange_questions is '교환 질문 (계획 2-6). 두 사람이 읽는다. 바꾸기는 함수 · 정해진 시간 작업으로만.';

create index exchange_questions_relationship_idx on public.exchange_questions (relationship_id, sent_on desc);

alter table public.exchange_questions enable row level security;
revoke all on public.exchange_questions from anon, authenticated;
grant select on public.exchange_questions to authenticated;
create policy "두 사람이 읽기" on public.exchange_questions for select to authenticated using (public.is_member(relationship_id));

-- ── 답 ─────────────────────────────────────────
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  exchange_question_id uuid not null,
  -- 규칙이 질문 표를 뒤지지 않게 연결을 같이 적는다(질문의 연결과 같아야 함)
  relationship_id uuid not null,
  user_id uuid not null references public.users (id) on delete cascade,
  -- 원문 그대로. 말로 답해도 글로 바꿔 저장
  text text not null check (char_length(btrim(text)) between 1 and 2000),
  method text not null default 'text' check (method in ('text', 'voice')),
  answered_at timestamptz not null default now(),
  -- '먼저 보낼까요'를 물은 때(답한 지 3일 또는 다음 질문이 오는 날)와 고른 것
  early_asked_at timestamptz,
  early_choice text check (early_choice in ('send', 'keep')),
  early_chosen_at timestamptz,
  -- 상대에게 보이는지. 둘 다 답했거나 '먼저 보내기'를 골랐을 때 함수가 켠다. '나만 보고 끝내기'는 상대에게 알리지 않음
  visible_to_partner boolean not null default false,
  unique (exchange_question_id, user_id),
  foreign key (exchange_question_id, relationship_id)
    references public.exchange_questions (id, relationship_id) on delete cascade
);

comment on table public.answers is '답 (계획 2-6). 내 답과 상대에게 보이게 된 답만 읽는다. 쓰기는 함수로만.';

create index answers_relationship_idx on public.answers (relationship_id);
create index answers_user_idx on public.answers (user_id);

alter table public.answers enable row level security;
revoke all on public.answers from anon, authenticated;
grant select on public.answers to authenticated;
create policy "내 답과 열린 답만 읽기" on public.answers for select to authenticated
  using (user_id = (select auth.uid()) or (visible_to_partner and public.is_member(relationship_id)));
