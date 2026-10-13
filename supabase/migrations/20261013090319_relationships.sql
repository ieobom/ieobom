-- 2-3 가족 연결과 '연결된 사람인지' 함수. 1쌍 = 자녀 1명 + 부모님 1명이 한 줄이다.
-- 만들기 · 끊기 · 되살리기는 초대 코드 함수(4-1 · 4-2 · 4-5)가 한다. 앱은 읽기만 한다.

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  -- 탈퇴하면 그 사람 칸만 비우고 줄은 남긴다(ERD 7-1). 남은 사람의 기록이 같이 지워지지 않게
  child_id uuid references public.users (id) on delete set null,
  parent_id uuid references public.users (id) on delete set null,
  parent_kind text not null check (parent_kind in ('mom', 'dad')),
  -- connected 이어짐 · ended 끊음 · left 상대 탈퇴
  status text not null default 'connected' check (status in ('connected', 'ended', 'left')),
  connected_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_by uuid references public.users (id) on delete set null,
  check (child_id is distinct from parent_id),
  check (status <> 'connected' or (child_id is not null and parent_id is not null))
);

comment on table public.relationships is '가족 연결 (계획 2-3). 두 사람만 읽는다. 바꾸기는 DB 함수로만.';

-- 자녀와 부모님 한 쌍은 한 줄(다시 이으면 같은 줄을 되살림)
create unique index relationships_pair_idx on public.relationships (child_id, parent_id);
-- 한 자녀에게 이어진 엄마 · 아빠는 각 한 분
create unique index relationships_child_kind_idx on public.relationships (child_id, parent_kind) where status = 'connected';
create index relationships_parent_idx on public.relationships (parent_id);

-- 한 사람이 탈퇴해서 칸이 비면 '상대 탈퇴'로 바꾼다(on delete set null도 이 트리거를 지난다)
create function public.relationships_mark_left() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.child_id is null or new.parent_id is null) and old.status = 'connected' then
    new.status := 'left';
    new.ended_at := now();
  end if;
  return new;
end;
$$;

create trigger relationships_mark_left before update of child_id, parent_id on public.relationships
  for each row execute function public.relationships_mark_left();

alter table public.relationships enable row level security;
revoke all on public.relationships from anon, authenticated;
grant select on public.relationships to authenticated;
create policy "두 사람만 읽기" on public.relationships for select to authenticated
  using ((select auth.uid()) in (child_id, parent_id));

-- 다른 표의 규칙이 같이 쓴다. 끊긴 연결도 읽기는 되므로 is_member, 새로 쓰기는 is_connected로 막는다.
-- security definer라 relationships의 규칙을 다시 타지 않는다(규칙이 서로 부르며 도는 것을 막음)
create function public.is_member(relationship uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.relationships r
    where r.id = relationship and (select auth.uid()) in (r.child_id, r.parent_id)
  )
$$;

create function public.is_connected(relationship uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.relationships r
    where r.id = relationship and r.status = 'connected' and (select auth.uid()) in (r.child_id, r.parent_id)
  )
$$;

-- 이어진 가족 목록(홈 · 마이). 자녀 화면에는 부모님 이름 대신 엄마 · 아빠가 보이므로 부모님 이름은 주지 않는다
create function public.my_families()
returns table (
  relationship_id uuid,
  status text,
  my_side text,
  partner_id uuid,
  partner_name text,
  parent_kind text,
  connected_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.status,
    case when r.child_id = (select auth.uid()) then 'child' else 'parent' end,
    case when r.child_id = (select auth.uid()) then r.parent_id else r.child_id end,
    case when r.parent_id = (select auth.uid()) then c.name end,
    r.parent_kind,
    r.connected_at
  from public.relationships r
  left join public.users c on c.id = r.child_id
  where (select auth.uid()) in (r.child_id, r.parent_id)
  order by r.connected_at
$$;

revoke execute on function public.is_member(uuid) from public, anon;
revoke execute on function public.is_connected(uuid) from public, anon;
revoke execute on function public.my_families() from public, anon;
revoke execute on function public.relationships_mark_left() from public, anon, authenticated;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.is_connected(uuid) to authenticated;
grant execute on function public.my_families() to authenticated;
