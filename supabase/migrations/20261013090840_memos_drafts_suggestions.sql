-- 2-7 메모 · 통화 메모 초안 · 여쭤볼 이야기. 모두 나만 본다(상대에게 보내지 않음).
-- 쓰기는 DB 함수(7-7 · 7-13)와 서버 함수(7-8 · 7-9 · 7-14)가 한다.

-- ── 메모 ───────────────────────────────────────
create table public.memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  -- 어느 통화 뒤 메모인지. 통화 기록을 30일 뒤 지우면 빈칸
  call_id uuid references public.calls (id) on delete set null,
  -- good 좋았어요 · okay 보통 · hard 힘들었어요(선택)
  mood text check (mood in ('good', 'okay', 'hard')),
  -- 메모 글(통화 메모 초안을 고친 글 또는 직접 쓴 글). 39차: 통화 뒤 메모는 글로만
  text text not null default '' check (char_length(text) <= 2000),
  -- 고칠 때마다 올린다. 여쭤볼 이야기 후보를 같은 버전으로 다시 만들지 않는다(7-9)
  version int not null default 1,
  -- 여쭤볼 이야기 후보: none 아직 · making 만드는 중 · done 다 됨 · failed 못 만듦 · mood_only 기분만 남김
  suggest_status text not null default 'none' check (suggest_status in ('none', 'making', 'done', 'failed', 'mood_only')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 기분만 있어도 저장되지만 둘 다 비면 안 된다
  check (mood is not null or char_length(btrim(text)) > 0)
);

comment on table public.memos is '메모 (계획 2-7). 쓴 사람만 읽는다. 지우면 그 메모로 만든 이야기도 함께 지운다.';

create index memos_user_idx on public.memos (user_id, relationship_id, created_at desc);

alter table public.memos enable row level security;
revoke all on public.memos from anon, authenticated;
grant select on public.memos to authenticated;
create policy "나만 읽기" on public.memos for select to authenticated using (user_id = (select auth.uid()));

-- ── 통화 메모 초안 ──────────────────────────────
-- 통화마다 사람마다 한 줄. 저장하면 메모가 되고, 저장하지 않으면 3일 뒤 지운다(7-11)
create table public.memo_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  call_id uuid not null references public.calls (id) on delete cascade,
  -- AI가 쓴 초안(세 줄 이내). ready일 때만 있다
  text text,
  -- making 만드는 중 · ready 초안 있음 · saved 저장함 · discarded 지움
  -- off_self 내가 끔 · off_partner 상대가 끔 · too_short 1분 미만 · failed 못 만듦 (초안 없을 때 4가지)
  status text not null default 'making'
    check (status in ('making', 'ready', 'saved', 'discarded', 'off_self', 'off_partner', 'too_short', 'failed')),
  memo_id uuid references public.memos (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '3 days',
  unique (call_id, user_id),
  check ((status = 'ready') = (text is not null) or status = 'saved')
);

comment on table public.memo_drafts is '통화 메모 초안 (계획 2-7). 나만 읽는다. 저장 안 한 초안은 3일 뒤 지운다.';

create index memo_drafts_user_idx on public.memo_drafts (user_id, created_at desc);
create index memo_drafts_expires_idx on public.memo_drafts (expires_at) where status in ('making', 'ready');

alter table public.memo_drafts enable row level security;
revoke all on public.memo_drafts from anon, authenticated;
grant select on public.memo_drafts to authenticated;
create policy "나만 읽기" on public.memo_drafts for select to authenticated using (user_id = (select auth.uid()));

-- ── 여쭤볼 이야기 ───────────────────────────────
create table public.talk_suggestions (
  id uuid primary key default gen_random_uuid(),
  -- 이 이야기를 볼 사람
  owner_id uuid not null references public.users (id) on delete cascade,
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  -- memo 메모 · news 받은 근황 · answer 함께 답한 질문 · weather 요즘 날씨
  source text not null check (source in ('memo', 'news', 'answer', 'weather')),
  memo_id uuid references public.memos (id) on delete cascade,
  -- 근황을 가리키는 외래 키는 근황 표를 만드는 2-8 마이그레이션에서 붙인다
  news_id uuid,
  exchange_question_id uuid references public.exchange_questions (id) on delete cascade,
  text text not null check (char_length(btrim(text)) between 1 and 200),
  -- ai AI가 만듦 · original 검사를 못 넘어 내가 쓴 메모를 그대로
  made_by text not null default 'ai' check (made_by in ('ai', 'original')),
  -- candidate 후보 · picked 고름 · skipped 안 고름. 목록에는 고른 것만 올라간다
  status text not null default 'candidate' check (status in ('candidate', 'picked', 'skipped')),
  -- '○월 ○일에 여쭤봤어요'. 되돌리면 빈칸
  asked_on date,
  created_at timestamptz not null default now(),
  -- 나온 곳과 가리키는 줄이 맞아야 한다
  check ((source = 'memo') = (memo_id is not null)),
  check ((source = 'news') = (news_id is not null)),
  check ((source = 'answer') = (exchange_question_id is not null))
);

comment on table public.talk_suggestions is '여쭤볼 이야기 (계획 2-7). 볼 사람만 읽는다. 나온 메모 · 근황 · 질문을 지우면 함께 지운다.';

create index talk_suggestions_owner_idx on public.talk_suggestions (owner_id, relationship_id, status);

alter table public.talk_suggestions enable row level security;
revoke all on public.talk_suggestions from anon, authenticated;
grant select on public.talk_suggestions to authenticated;
create policy "나만 읽기" on public.talk_suggestions for select to authenticated using (owner_id = (select auth.uid()));
