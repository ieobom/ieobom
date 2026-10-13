-- 6-1 통화 편한 시간 겹침 계산. 시간은 한국 시간으로 본다.
-- 한 칸은 같은 날 안(6시~23시)이라 자정을 넘지 않는다. '다음 겹치는 시간'은 날을 넘겨 7일 안에서 찾는다.

-- 요일 값 → ISO 요일(월 1 ~ 일 7)
create function public.call_days(days text) returns int[]
language sql
immutable
set search_path = ''
as $$
  select case days
    when 'weekdays' then array[1, 2, 3, 4, 5]
    when 'sat' then array[6]
    when 'sun' then array[7]
    when 'everyday' then array[1, 2, 3, 4, 5, 6, 7]
  end
$$;

-- 두 사람의 겹치는 시간을 at부터 7일 안에서 시간순으로. 이어 붙은 칸은 하나로 합치지 않는다(칸이 3개뿐이라 충분)
create function public.overlap_windows(a uuid, b uuid, at timestamptz default now())
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with days as (
    select (at at time zone 'Asia/Seoul')::date + d as day
    from generate_series(0, 7) as d
  ),
  pairs as (
    select
      days.day,
      greatest(x.start_hour, y.start_hour) as s,
      least(x.end_hour, y.end_hour) as e
    from days
    join public.call_times x on x.user_id = a and extract(isodow from days.day)::int = any (public.call_days(x.days))
    join public.call_times y on y.user_id = b and extract(isodow from days.day)::int = any (public.call_days(y.days))
  )
  select distinct
    ((day + make_interval(hours => s)) at time zone 'Asia/Seoul') as starts_at,
    ((day + make_interval(hours => e)) at time zone 'Asia/Seoul') as ends_at
  from pairs
  where e > s and ((day + make_interval(hours => e)) at time zone 'Asia/Seoul') > at
  order by starts_at
$$;

-- 지금 둘 다 편한가와 다음(또는 지금) 겹치는 시간. 연결된 사람만 부른다
create function public.call_time_overlap(relationship uuid, at timestamptz default now())
returns table (free_now boolean, next_starts_at timestamptz, next_ends_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.relationships;
  w record;
begin
  select * into r from public.relationships x where x.id = relationship;
  if r.id is null or not ((select auth.uid()) in (r.child_id, r.parent_id) or auth.role() = 'service_role') then
    raise exception 'not_member';
  end if;
  select * into w from public.overlap_windows(r.child_id, r.parent_id, at) limit 1;
  free_now := w.starts_at is not null and w.starts_at <= at and at < w.ends_at;
  next_starts_at := w.starts_at;
  next_ends_at := w.ends_at;
  return next;
end;
$$;

revoke execute on function public.overlap_windows(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.call_time_overlap(uuid, timestamptz) from public, anon;
grant execute on function public.call_time_overlap(uuid, timestamptz) to authenticated;
