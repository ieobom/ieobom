-- 10-7 기록 화면이 그리는 값을 기록 함수에 맞춘다(39차 기록 · 목록 · 달력).
-- 질문은 끝났거나 둘 다 답한 것만 쌓인다: both 둘 다 답함 · mine_only 내 답만 · sent_first 먼저 보냄 · their_first 먼저 온 답
-- 달력에는 함께 답한 질문(both)만 표시하고, 그달의 '메모 남긴 날 · 함께 답한 질문 · 주고받은 근황' 수를 함께 준다.
-- 상세에 쓰는 여쭤볼 이야기(그 메모 · 근황으로 만든 것)와 '내가 궁금해한 주제'도 담는다.

create or replace function public.record_items(relationship uuid, uid uuid)
returns table (kind text, id uuid, at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select 'memo', m.id, m.created_at from public.memos m where m.relationship_id = relationship and m.user_id = uid
  union all
  select 'question', q.id, (q.sent_on + time '05:00') at time zone 'Asia/Seoul'
  from public.exchange_questions q
  where q.relationship_id = relationship
    and (q.opened_at is not null
      or (q.status = 'closed' and exists (
        select 1 from public.answers a
        where a.exchange_question_id = q.id and (a.user_id = uid or a.visible_to_partner))))
  union all
  select 'news', n.id, n.created_at from public.news n where n.relationship_id = relationship
$$;

-- 질문 하나의 내 쪽 상태
create function public.question_record_status(q public.exchange_questions, uid uuid) returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when q.opened_at is not null then 'both'
    when exists (select 1 from public.answers a where a.exchange_question_id = q.id and a.user_id = uid and a.early_choice = 'send') then 'sent_first'
    when exists (select 1 from public.answers a where a.exchange_question_id = q.id and a.user_id = uid) then 'mine_only'
    else 'their_first'
  end
$$;

drop function public.records(uuid, text, timestamptz, uuid, int);

create function public.records(
  relationship uuid,
  kind text default null,
  before_at timestamptz default null,
  before_id uuid default null,
  page_size int default 20,
  on_day date default null
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  curious text[];
  items jsonb;
begin
  if not public.is_member(relationship) then
    raise exception 'not_member';
  end if;
  if records.kind is not null and records.kind not in ('memo', 'question', 'news') then
    raise exception 'invalid_kind';
  end if;
  select s.curious_topics into curious from public.relationship_settings s where s.relationship_id = relationship and s.user_id = uid;

  select coalesce(jsonb_agg(
    case r.kind
      when 'memo' then (
        select jsonb_build_object('kind', 'memo', 'id', m.id, 'at', m.created_at, 'mood', m.mood, 'text', m.text, 'call_id', m.call_id,
          'suggest_status', m.suggest_status,
          'talk', (select jsonb_build_object('id', s.id, 'text', s.text, 'asked_on', s.asked_on, 'made_by', s.made_by)
                   from public.talk_suggestions s where s.memo_id = m.id and s.status = 'picked' order by s.created_at limit 1))
        from public.memos m where m.id = r.id)
      when 'question' then (
        select jsonb_build_object(
          'kind', 'question', 'id', q.id, 'at', r.at, 'seq_no', q.seq_no, 'text', q.text,
          'status', public.question_record_status(q, uid),
          'made_by', case
            when q.custom_question_id is null then 'ai'
            when (select c.author_id from public.custom_questions c where c.id = q.custom_question_id) = uid then 'me'
            else 'partner' end,
          'my_answer', (select a.text from public.answers a where a.exchange_question_id = q.id and a.user_id = uid),
          'partner_answer', (select a.text from public.answers a where a.exchange_question_id = q.id and a.user_id <> uid and a.visible_to_partner))
        from public.exchange_questions q where q.id = r.id)
      else (
        select jsonb_build_object(
          'kind', 'news', 'id', n.id, 'at', n.created_at, 'mine', n.author_id = uid, 'text', n.text, 'topic', n.topic,
          'curious', n.author_id <> uid and n.topic = any (coalesce(curious, '{}')),
          'photos', coalesce((select jsonb_agg(jsonb_build_object('path', p.file_path, 'thumb', p.thumb_path) order by p.sort)
                              from public.news_photos p where p.news_id = n.id), '[]'::jsonb),
          'talk', (select jsonb_build_object('id', s.id, 'text', s.text, 'asked_on', s.asked_on, 'made_by', s.made_by)
                   from public.talk_suggestions s where s.news_id = n.id and s.owner_id = uid limit 1))
        from public.news n where n.id = r.id)
    end
    order by r.at desc, r.id desc), '[]'::jsonb)
  into items
  from (
    select x.kind, x.id, x.at from public.record_items(relationship, uid) x
    where (records.kind is null or x.kind = records.kind)
      and (before_at is null or (x.at, x.id) < (before_at, before_id))
      and (on_day is null or (x.at at time zone 'Asia/Seoul')::date = on_day)
    order by x.at desc, x.id desc
    limit least(greatest(page_size, 1), 50)
  ) r;
  return items;
end;
$$;

create or replace function public.record_calendar(relationship uuid, month date) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  first_day date := date_trunc('month', month)::date;
  out jsonb;
begin
  if not public.is_member(relationship) then
    raise exception 'not_member';
  end if;
  with marks as (
    select (x.at at time zone 'Asia/Seoul')::date as day, x.kind
    from public.record_items(relationship, uid) x
    left join public.exchange_questions q on x.kind = 'question' and q.id = x.id
    where (x.at at time zone 'Asia/Seoul')::date >= first_day
      and (x.at at time zone 'Asia/Seoul')::date < (first_day + interval '1 month')::date
      -- 달력의 질문 표시는 함께 답한 질문만
      and (x.kind <> 'question' or q.opened_at is not null)
  )
  select jsonb_build_object(
    'days', coalesce((select jsonb_object_agg(d.day::text, d.kinds) from (
      select day, jsonb_agg(distinct kind) as kinds from marks group by day) d), '{}'::jsonb),
    'counts', jsonb_build_object(
      'memo_days', (select count(distinct day) from marks where kind = 'memo'),
      'questions', (select count(*) from marks where kind = 'question'),
      'news', (select count(*) from marks where kind = 'news')),
    -- 이전 달로 갈 수 있는 첫 달(이어진 달)
    'since', (select (r.connected_at at time zone 'Asia/Seoul')::date from public.relationships r where r.id = relationship)
  ) into out;
  return out;
end;
$$;

revoke execute on function public.question_record_status(public.exchange_questions, uuid) from public, anon, authenticated;
revoke execute on function public.records(uuid, text, timestamptz, uuid, int, date) from public, anon;
grant execute on function public.records(uuid, text, timestamptz, uuid, int, date) to authenticated;
