-- 2-5 통화 편한 시간 · 앱 안 통화 · 통화 글(서버만).
-- 통화 상태는 DB 함수(5-3)와 서버 함수(5-9 웹훅)만 바꾼다. 앱은 읽기만 한다.

-- 나와 이어진(connected) 가족인지. 통화 편한 시간처럼 가족에게 보이는 내 정보의 규칙에 쓴다
create function public.is_family(other uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.relationships r
    where r.status = 'connected'
      and ((r.child_id = (select auth.uid()) and r.parent_id = other)
        or (r.parent_id = (select auth.uid()) and r.child_id = other))
  )
$$;

revoke execute on function public.is_family(uuid) from public, anon;
grant execute on function public.is_family(uuid) to authenticated;

-- ── 통화 편한 시간 ──────────────────────────────
create table public.call_times (
  id uuid primary key default gen_random_uuid(),
  -- 정한 사람. 모든 가족에게 같은 시간
  user_id uuid not null references public.users (id) on delete cascade,
  -- weekdays 평일 · sat 토요일 · sun 일요일 · everyday 매일
  days text not null check (days in ('weekdays', 'sat', 'sun', 'everyday')),
  -- 6시~23시 중 고름(39차 시안). 끝은 시작보다 늦어야 함
  start_hour int not null check (start_hour between 6 and 23),
  end_hour int not null check (end_hour between 6 and 23),
  created_at timestamptz not null default now(),
  check (end_hour > start_hour)
);

create index call_times_user_idx on public.call_times (user_id);

-- 한 사람 3개까지(하나도 없어도 됨)
create function public.call_times_limit() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.call_times t where t.user_id = new.user_id) >= 3 then
    raise exception 'too_many_call_times';
  end if;
  return new;
end;
$$;

create trigger call_times_limit before insert on public.call_times
  for each row execute function public.call_times_limit();

revoke execute on function public.call_times_limit() from public, anon, authenticated;

alter table public.call_times enable row level security;
revoke all on public.call_times from anon, authenticated;
grant select, insert, delete on public.call_times to authenticated;
grant update (days, start_hour, end_hour) on public.call_times to authenticated;
create policy "나와 이어진 가족이 읽기" on public.call_times for select to authenticated
  using (user_id = (select auth.uid()) or public.is_family(user_id));
create policy "내 시간만 더하기" on public.call_times for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "내 시간만 고치기" on public.call_times for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "내 시간만 지우기" on public.call_times for delete to authenticated
  using (user_id = (select auth.uid()));

-- ── 앱 안 통화 ─────────────────────────────────
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  caller_id uuid references public.users (id) on delete set null,
  callee_id uuid references public.users (id) on delete set null,
  -- ringing 울림 · active 통화 중 · completed 통화함 · declined 거절 · missed 못 받음 · canceled 취소 · dropped 끊김
  status text not null default 'ringing'
    check (status in ('ringing', 'active', 'completed', 'declined', 'missed', 'canceled', 'dropped')),
  started_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz,
  -- 둘 다 통화 편한 시간에 건 전화(그 시간 안내를 끝냄)
  in_free_time boolean not null default false,
  -- 못 받은 전화를 본 때(홈 카드에서 빠짐)
  missed_seen_at timestamptz,
  -- 받는 순간의 두 사람 '통화 메모 초안' 값. 둘 다 켜야 녹음한다(계획 1장). 받은 뒤 설정을 바꿔도 그대로
  caller_draft_on boolean,
  callee_draft_on boolean,
  -- none 안 함 · recording 녹음 중 · transcribing 글로 바꾸는 중 · done 끝 · failed 실패 · skipped 1분 미만 등으로 안 함
  recording text not null default 'none'
    check (recording in ('none', 'recording', 'transcribing', 'done', 'failed', 'skipped')),
  -- LiveKit 통화방 이름 (ERD 7-6)
  room_name text unique,
  check (caller_id is distinct from callee_id)
);

comment on table public.calls is '앱 안 통화 (계획 2-5). 두 사람이 읽는다. 목소리는 저장하지 않고, 녹음은 글로 바꾸면 지운다. 30일 보관.';

create index calls_relationship_idx on public.calls (relationship_id, started_at desc);
-- 한 연결에 진행 중 통화는 하나(동시에 걸면 먼저 건 통화로 합침, 5-3)
create unique index calls_one_live_idx on public.calls (relationship_id) where status in ('ringing', 'active');

alter table public.calls enable row level security;
revoke all on public.calls from anon, authenticated;
grant select on public.calls to authenticated;
create policy "두 사람이 읽기" on public.calls for select to authenticated using (public.is_member(relationship_id));

-- ── 통화 글 (서버만) ────────────────────────────
-- 녹음을 사람별로 글로 바꾼 것. 통화 메모 초안을 만들면 바로 지운다(7-8). 앱은 읽지도 쓰지도 못한다
create table public.call_transcripts (
  call_id uuid not null references public.calls (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  -- [{ "start": 초, "text": 말한 글 }] 시간순
  segments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (call_id, user_id)
);

alter table public.call_transcripts enable row level security;
revoke all on public.call_transcripts from anon, authenticated;
