-- 10-3 기록 목록 · 달력. 메모(내 것) · 질문(온 것) · 근황(두 사람)을 날짜순으로 모은다.
-- 목록은 마지막 항목(때, 번호) 기준으로 이어 불러온다(건너뛰기 방식은 쓰지 않음, 기록이 쌓여도 속도가 같다).
-- 질문의 때는 온 날 새벽 5시(한국)로 둔다.

create function public.record_items(relationship uuid, uid uuid)
returns table (kind text, id uuid, at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select 'memo', m.id, m.created_at from public.memos m where m.relationship_id = relationship and m.user_id = uid
  union all
  select 'question', q.id, (q.sent_on + time '05:00') at time zone 'Asia/Seoul'
  from public.exchange_questions q where q.relationship_id = relationship
  union all
  select 'news', n.id, n.created_at from public.news n where n.relationship_id = relationship
$$;

create function public.records(
  relationship uuid,
  kind text default null,
  before_at timestamptz default null,
  before_id uuid default null,
  page_size int default 20
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  items jsonb;
begin
  if not public.is_member(relationship) then
    raise exception 'not_member';
  end if;
  if records.kind is not null and records.kind not in ('memo', 'question', 'news') then
    raise exception 'invalid_kind';
  end if;

  select coalesce(jsonb_agg(
    case r.kind
      when 'memo' then (
        select jsonb_build_object('kind', 'memo', 'id', m.id, 'at', m.created_at, 'mood', m.mood, 'text', m.text, 'call_id', m.call_id)
        from public.memos m where m.id = r.id)
      when 'question' then (
        select jsonb_build_object(
          'kind', 'question', 'id', q.id, 'at', r.at, 'seq_no', q.seq_no, 'text', q.text, 'status', q.status,
          'my_answer', (select a.text from public.answers a where a.exchange_question_id = q.id and a.user_id = uid),
          'partner_answer', (select a.text from public.answers a where a.exchange_question_id = q.id and a.user_id <> uid and a.visible_to_partner))
        from public.exchange_questions q where q.id = r.id)
      else (
        select jsonb_build_object(
          'kind', 'news', 'id', n.id, 'at', n.created_at, 'mine', n.author_id = uid, 'text', n.text, 'topic', n.topic,
          'photos', coalesce((select jsonb_agg(jsonb_build_object('path', p.file_path, 'thumb', p.thumb_path) order by p.sort)
                              from public.news_photos p where p.news_id = n.id), '[]'::jsonb))
        from public.news n where n.id = r.id)
    end
    order by r.at desc, r.id desc), '[]'::jsonb)
  into items
  from (
    select x.kind, x.id, x.at from public.record_items(relationship, uid) x
    where (records.kind is null or x.kind = records.kind)
      and (before_at is null or (x.at, x.id) < (before_at, before_id))
    order by x.at desc, x.id desc
    limit least(greatest(page_size, 1), 50)
  ) r;
  return items;
end;
$$;

-- 그 달의 날짜별 표시(메모 · 질문 · 근황이 있는 날)
create function public.record_calendar(relationship uuid, month date) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  first_day date := date_trunc('month', month)::date;
  out jsonb;
begin
  if not public.is_member(relationship) then
    raise exception 'not_member';
  end if;
  select coalesce(jsonb_object_agg(day, kinds), '{}'::jsonb) into out
  from (
    select (x.at at time zone 'Asia/Seoul')::date::text as day, jsonb_agg(distinct x.kind) as kinds
    from public.record_items(relationship, auth.uid()) x
    where (x.at at time zone 'Asia/Seoul')::date >= first_day
      and (x.at at time zone 'Asia/Seoul')::date < (first_day + interval '1 month')::date
    group by 1
  ) d;
  return out;
end;
$$;

revoke execute on function public.record_items(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.records(uuid, text, timestamptz, uuid, int) from public, anon;
revoke execute on function public.record_calendar(uuid, date) from public, anon;
grant execute on function public.records(uuid, text, timestamptz, uuid, int) to authenticated;
grant execute on function public.record_calendar(uuid, date) to authenticated;
