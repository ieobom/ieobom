-- 8-2 질문 오는 날 규칙. 날짜는 한국 날짜.
-- 주 1번 목 · 주 2번 월 · 목 · 주 3번 월 · 수 · 금(계획 1장). 두 사람 중 적은 쪽을 따른다.
-- 횟수를 바꾸면 다음 주 월요일부터 적용한다(그 전까지는 next_freq에 둔다).

create function public.seoul_today() returns date
language sql
stable
set search_path = ''
as $$ select (now() at time zone 'Asia/Seoul')::date $$;

create function public.question_days(freq int) returns int[]
language sql
immutable
set search_path = ''
as $$
  select case freq when 1 then array[4] when 2 then array[1, 4] when 3 then array[1, 3, 5] end
$$;

-- 한 사람의 그날 횟수(바꾼 횟수가 적용되는 날이 지났으면 그것)
create function public.freq_on(s public.relationship_settings, day date) returns int
language sql
immutable
set search_path = ''
as $$
  select case when s.next_freq is not null and day >= s.next_freq_from then s.next_freq else s.question_freq end
$$;

-- 그 연결의 그날 횟수: 두 사람 중 적은 쪽. 설정 줄이 없는 사람은 기본 1번
create function public.relationship_freq(relationship uuid, day date) returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(min(public.freq_on(s, day)), 1)
  from public.relationship_settings s
  where s.relationship_id = relationship
$$;

-- day부터(그날 포함) 다음 질문이 오는 날
create function public.next_question_day(relationship uuid, day date) returns date
language sql
stable
security definer
set search_path = ''
as $$
  select d::date
  from generate_series(day, day + 13, interval '1 day') as d
  where extract(isodow from d)::int = any (public.question_days(public.relationship_freq(relationship, d::date)))
  order by d
  limit 1
$$;

-- 내 질문 횟수 바꾸기(가족별 설정). 다음 주 월요일부터 적용
create function public.set_question_freq(relationship uuid, freq int) returns public.relationship_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.relationship_settings;
  monday date := date_trunc('week', public.seoul_today())::date + 7;
begin
  if freq not between 1 and 3 then
    raise exception 'invalid_freq';
  end if;
  if not public.is_connected(relationship) then
    raise exception 'not_connected';
  end if;
  update public.relationship_settings x
  set next_freq = case when freq = x.question_freq then null else freq end,
      next_freq_from = case when freq = x.question_freq then null else monday end
  where x.relationship_id = relationship and x.user_id = auth.uid()
  returning * into s;
  if s.relationship_id is null then
    raise exception 'settings_not_found';
  end if;
  return s;
end;
$$;

revoke execute on function public.relationship_freq(uuid, date) from public, anon, authenticated;
revoke execute on function public.next_question_day(uuid, date) from public, anon, authenticated;
revoke execute on function public.set_question_freq(uuid, int) from public, anon;
grant execute on function public.set_question_freq(uuid, int) to authenticated;
