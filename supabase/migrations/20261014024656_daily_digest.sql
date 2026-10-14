-- 6-4 하루 한 번 묶음 대상 뽑기. 알림 시각(8 · 12 · 19 · 21시, 한국)마다 그 시각을 고른 사람에게 한 통.
-- 가족마다 보낼 것: new_question 오늘 온 질문(아직 안 답함) · opened 둘 다 답함(아직 안 봄) · partner_sent_first 상대가 먼저 보냄
--                  free_today 오늘 둘 다 편한 시간(아직 안 지남) · news 받은 근황(아직 안 봄)
-- 오늘 이미 묶음을 보낸 사람(push_log의 daily:날짜)은 뺀다. 보내기와 기록은 6-5가 한다.

create function public.daily_digest_targets(at timestamptz default now())
returns table (user_id uuid, items jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  with params as (
    select (at at time zone 'Asia/Seoul')::date as today,
           make_time(extract(hour from (at at time zone 'Asia/Seoul'))::int, 0, 0) as slot
  ),
  people as (
    select u.id, u.notify_time from public.users u, params p
    where u.notify_on and u.notify_time = p.slot
      and not exists (select 1 from public.push_log l where l.user_id = u.id and l.dedupe_key = 'daily:' || p.today)
  ),
  fams as (
    select pe.id as uid, r.id as rel, case when r.child_id = pe.id then r.parent_id else r.child_id end as partner,
           r.child_id = pe.id as i_am_child, r.child_id, r.parent_id
    from people pe
    join public.relationships r on r.status = 'connected' and pe.id in (r.child_id, r.parent_id)
  ),
  kinds as (
    select f.uid, f.rel, k.kind
    from fams f, params p
    cross join lateral (
      select 'new_question' as kind where exists (
        select 1 from public.exchange_questions q
        where q.relationship_id = f.rel and q.sent_on = p.today and q.status = 'waiting'
          and not exists (select 1 from public.answers a where a.exchange_question_id = q.id and a.user_id = f.uid))
      union all
      select 'opened' where exists (
        select 1 from public.exchange_questions q
        where q.relationship_id = f.rel and q.status = 'opened'
          and (case when f.i_am_child then q.child_seen_at else q.parent_seen_at end) is null)
      union all
      select 'partner_sent_first' where exists (
        select 1 from public.exchange_questions q
        join public.answers a on a.exchange_question_id = q.id and a.user_id = f.partner and a.visible_to_partner
        where q.relationship_id = f.rel and q.status = 'waiting'
          and not exists (select 1 from public.answers m where m.exchange_question_id = q.id and m.user_id = f.uid))
      union all
      select 'free_today' where exists (
        select 1 from public.overlap_windows(f.child_id, f.parent_id, at) w
        where (w.starts_at at time zone 'Asia/Seoul')::date = p.today)
      union all
      select 'news' where exists (
        select 1 from public.news n where n.relationship_id = f.rel and n.author_id = f.partner and n.seen_at is null)
    ) k
  )
  select k.uid, jsonb_agg(jsonb_build_object('relationship_id', k.rel, 'kinds', k.kinds) order by k.rel)
  from (select uid, rel, jsonb_agg(kind order by kind) as kinds from kinds group by uid, rel) k
  group by k.uid
$$;

revoke execute on function public.daily_digest_targets(timestamptz) from public, anon, authenticated;
