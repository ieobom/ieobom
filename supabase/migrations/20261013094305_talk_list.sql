-- 7-13 여쭤볼 이야기 목록 · 여쭤봤어요 · 되돌리기.
-- 39차 순서: 요즘 궁금한 것에 맞는 받은 근황 → 내 메모에서 고른 이야기 → 다른 받은 근황 → 함께 답한 질문 → 요즘 날씨. 3개까지.
-- 내가 피하고 싶은 주제에 걸리는 근황 · 날씨(건강)는 뺀다. 자녀 → 부모님은 존댓말, 부모님 → 자녀는 반말.

-- 요즘 날씨 문장(정해진 문장 목록). 운영팀이 관리 화면에서 고친다. 겨울 문장은 39차 시안 그대로
create table public.weather_lines (
  season text primary key check (season in ('spring', 'summer', 'fall', 'winter')),
  to_parent text not null,
  to_child text not null,
  topic text not null default '건강'
);

alter table public.weather_lines enable row level security;
revoke all on public.weather_lines from anon, authenticated;

insert into public.weather_lines (season, to_parent, to_child) values
  ('spring', '요즘 날이 풀렸는데 산책은 자주 하세요?', '요즘 날 풀렸는데 바깥바람은 좀 쐬어?'),
  ('summer', '요즘 많이 더운데 더위는 괜찮으세요?', '요즘 많이 덥던데 더위 안 먹었어?'),
  ('fall', '요즘 아침저녁으로 쌀쌀한데 감기는 안 걸리셨어요?', '요즘 아침저녁으로 쌀쌀한데 옷 따뜻하게 입고 다녀?'),
  ('winter', '요즘 날이 추운데 감기는 안 걸리셨어요?', '요즘 날 추운데 옷 따뜻하게 입고 다녀?');

create function public.season_of(day date) returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when extract(month from day) in (3, 4, 5) then 'spring'
    when extract(month from day) in (6, 7, 8) then 'summer'
    when extract(month from day) in (9, 10, 11) then 'fall'
    else 'winter'
  end
$$;

create function public.talk_list(relationship uuid) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  today date := public.seoul_today();
  r public.relationships;
  me_child boolean;
  pref public.relationship_settings;
  w public.weather_lines;
  items jsonb;
begin
  select * into r from public.relationships x where x.id = relationship and uid in (x.child_id, x.parent_id);
  if r.id is null then
    raise exception 'not_member';
  end if;
  me_child := r.child_id = uid;
  select * into pref from public.relationship_settings s where s.relationship_id = relationship and s.user_id = uid;
  select * into w from public.weather_lines x where x.season = public.season_of(today);

  with listed as (
    select
      s.id,
      s.source,
      s.text,
      case
        when s.source = 'news' and n.topic = any (coalesce(pref.curious_topics, '{}')) then 1
        when s.source = 'memo' then 2
        when s.source = 'news' then 3
        else 4
      end as rank,
      s.created_at,
      jsonb_build_object('news_text', n.text, 'memo_at', m.created_at, 'question_seq', q.seq_no) as note
    from public.talk_suggestions s
    left join public.news n on n.id = s.news_id
    left join public.memos m on m.id = s.memo_id
    left join public.exchange_questions q on q.id = s.exchange_question_id
    where s.owner_id = uid and s.relationship_id = relationship and s.status = 'picked' and s.asked_on is null
      and s.source <> 'weather'
      and not (s.source = 'news' and n.topic is not null and n.topic = any (coalesce(pref.avoid_topics, '{}')))
    union all
    -- 요즘 날씨: 이번 계절에 아직 안 여쭤봤고, 그 주제를 피하지 않을 때
    select null, 'weather', case when me_child then w.to_parent else w.to_child end, 5, now(), '{}'::jsonb
    where w.season is not null
      and not (w.topic = any (coalesce(pref.avoid_topics, '{}')))
      and not exists (
        select 1 from public.talk_suggestions s
        where s.owner_id = uid and s.relationship_id = relationship and s.source = 'weather'
          and public.season_of(s.asked_on) = w.season and s.asked_on > today - 120
      )
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'source', l.source, 'text', l.text, 'note', l.note) order by l.rank, l.created_at desc), '[]'::jsonb)
  into items
  from (select * from listed order by rank, created_at desc limit 3) l;
  return items;
end;
$$;

-- 여쭤봤어요. 날씨는 줄이 없으므로 이번 계절 문장으로 한 줄 남긴다
create function public.mark_asked(relationship uuid, suggestion uuid default null) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  made uuid;
begin
  if not public.is_member(relationship) then
    raise exception 'not_member';
  end if;
  if suggestion is not null then
    update public.talk_suggestions set asked_on = public.seoul_today()
    where id = suggestion and owner_id = uid and relationship_id = relationship and asked_on is null
    returning id into made;
    if made is null then
      raise exception 'suggestion_not_found';
    end if;
    return made;
  end if;
  insert into public.talk_suggestions (owner_id, relationship_id, source, text, status, asked_on)
  select uid, relationship, 'weather',
         case when (select r.child_id from public.relationships r where r.id = relationship) = uid then w.to_parent else w.to_child end,
         'picked', public.seoul_today()
  from public.weather_lines w where w.season = public.season_of(public.seoul_today())
  returning id into made;
  return made;
end;
$$;

-- 되돌리기: 다시 목록에 올린다(날씨 줄은 지운다)
create function public.unmark_asked(suggestion uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.talk_suggestions where id = suggestion and owner_id = auth.uid() and source = 'weather';
  if not found then
    update public.talk_suggestions set asked_on = null where id = suggestion and owner_id = auth.uid();
    if not found then
      raise exception 'suggestion_not_found';
    end if;
  end if;
end;
$$;

revoke execute on function public.talk_list(uuid) from public, anon;
revoke execute on function public.mark_asked(uuid, uuid) from public, anon;
revoke execute on function public.unmark_asked(uuid) from public, anon;
grant execute on function public.talk_list(uuid) to authenticated;
grant execute on function public.mark_asked(uuid, uuid) to authenticated;
grant execute on function public.unmark_asked(uuid) to authenticated;
