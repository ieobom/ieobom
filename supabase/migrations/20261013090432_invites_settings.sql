-- 2-4 초대 코드 · 틀린 횟수 · 가족별 내 설정.
-- 코드 만들기 · 확인 · 연결은 DB 함수(4-1 · 4-2)가 한다. 앱은 내가 만든 코드와 내 설정만 읽는다.
-- 주제 값은 화면 글자(@ieobom/shared의 AVOID_TOPICS · NEWS_TOPICS) 그대로 저장한다(근황 주제는 직접 쓴 글도 받으므로).

-- ── 초대 코드 ───────────────────────────────────
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[0-9]{6}$'),
  inviter_id uuid not null references public.users (id) on delete cascade,
  -- 코드를 넣을 사람이 무엇으로 이어지나: 엄마로 · 아빠로 · 자녀로. 계정과 맞지 않으면 잇지 않음
  invite_as text not null check (invite_as in ('mom', 'dad', 'child')),
  -- waiting 기다림 · used 연결됨 · canceled 취소 · replaced 새 코드로 바뀜. 기한 지남은 expires_at으로 계산
  status text not null default 'waiting' check (status in ('waiting', 'used', 'canceled', 'replaced')),
  expires_at timestamptz not null default now() + interval '48 hours',
  joined_by uuid references public.users (id) on delete set null,
  relationship_id uuid references public.relationships (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.invites is '초대 코드 (계획 2-4). 만든 사람만 읽는다. 코드 확인은 DB 함수로만.';

-- 기다리는 코드끼리는 겹치지 않는다
create unique index invites_waiting_code_idx on public.invites (code) where status = 'waiting';
create index invites_inviter_idx on public.invites (inviter_id, created_at desc);

alter table public.invites enable row level security;
revoke all on public.invites from anon, authenticated;
grant select on public.invites to authenticated;
create policy "만든 사람만 읽기" on public.invites for select to authenticated using (inviter_id = (select auth.uid()));

-- ── 코드 넣은 기록 ──────────────────────────────
-- 10분 안에 5번 틀리면 10분 막는다(ERD 7-3). 앱은 못 읽는다
create table public.code_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  ok boolean not null,
  attempted_at timestamptz not null default now()
);

create index code_attempts_user_idx on public.code_attempts (user_id, attempted_at desc);

alter table public.code_attempts enable row level security;
revoke all on public.code_attempts from anon, authenticated;

-- ── 가족별 내 설정 ──────────────────────────────
create table public.relationship_settings (
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  -- 질문 받는 횟수 주 1 · 2 · 3번(기본 1). 실제는 두 사람 중 적은 쪽. 바꾸면 다음 주부터(8-2 함수)
  question_freq int not null default 1 check (question_freq between 1 and 3),
  next_freq int check (next_freq between 1 and 3),
  next_freq_from date,
  -- 피하고 싶은 주제: AI 질문에서만 빼고 가족이 만든 질문은 그대로 감. 고른 것은 상대에게 알리지 않음
  avoid_topics text[] not null default '{}'
    check (avoid_topics <@ array['결혼·연애', '취업·직장', '돈·재정', '건강', '종교', '정치', '다이어트', '학업']),
  -- 요즘 궁금한 것: 근황 주제 목록에서 고름
  curious_topics text[] not null default '{}'
    check (curious_topics <@ array['일·학교', '건강', '취미·운동', '먹은 것', '다녀온 곳', '가족·친구']),
  primary key (relationship_id, user_id),
  check ((next_freq is null) = (next_freq_from is null))
);

comment on table public.relationship_settings is '가족별 내 설정 (계획 2-4). 나만 읽고, 주제는 바로 고친다. 횟수는 함수로.';

create index relationship_settings_user_idx on public.relationship_settings (user_id);

alter table public.relationship_settings enable row level security;
revoke all on public.relationship_settings from anon, authenticated;
grant select on public.relationship_settings to authenticated;
grant update (avoid_topics, curious_topics) on public.relationship_settings to authenticated;
create policy "나만 읽기" on public.relationship_settings for select to authenticated
  using (user_id = (select auth.uid()));
create policy "이어진 가족의 내 설정만 고치기" on public.relationship_settings for update to authenticated
  using (user_id = (select auth.uid()) and public.is_connected(relationship_id))
  with check (user_id = (select auth.uid()));
