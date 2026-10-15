-- 10-4 많은 데이터로 속도 점검. scripts/perf-db.mjs가 {{PAIRS}}를 바꿔 넣고 한 묶음으로 실행한 뒤 모두 되돌린다.
-- 가족 {{PAIRS}}쌍(10쌍 중 1쌍은 아빠와도 이어짐)에 6주쯤 쓴 만큼의 질문 · 답 · 메모 · 통화 · 근황 · 여쭤볼 이야기를 넣고,
-- 홈 · 기록(목록 · 질문만 · 달력) · 이야기 목록 · 마이 · 답 열기를 사람마다 여러 번 불러 걸린 시간과
-- 한 번 부를 때 처음부터 끝까지 훑은 표(seq scan)를 모은다.

create temp table perf_pairs as
select i,
  md5('perf-child:' || i)::uuid as child,
  md5('perf-mom:' || i)::uuid as mom,
  case when i % 10 = 0 then md5('perf-dad:' || i)::uuid end as dad,
  md5('perf-rel:' || i)::uuid as rel,
  case when i % 10 = 0 then md5('perf-rel-dad:' || i)::uuid end as rel_dad,
  now() - make_interval(days => 38 + i % 7) as since
from generate_series(1, {{PAIRS}}) i;

-- 연결 하나마다 한 줄(엄마 · 아빠)
create temp table perf_rels as
select i, rel, child, mom as parent, 'mom' as kind, since from perf_pairs
union all
select i, rel_dad, child, dad, 'dad', since from perf_pairs where dad is not null;

insert into auth.users (id, aud, role, email)
select p, 'authenticated', 'authenticated', md5(p::text) || '@perf.ieobom'
from (select child as p from perf_pairs union all select mom from perf_pairs union all select dad from perf_pairs where dad is not null) x;

insert into public.users (id, name, side, large_text)
select child, '자녀' || i, 'child', false from perf_pairs
union all select mom, '엄마' || i, 'parent', true from perf_pairs
union all select dad, '아빠' || i, 'parent', true from perf_pairs where dad is not null;

insert into public.relationships (id, child_id, parent_id, parent_kind, status, connected_at)
select rel, child, parent, kind, 'connected', since from perf_rels;

insert into public.relationship_settings (relationship_id, user_id, question_freq)
select rel, child, 2 from perf_rels union all select rel, parent, 2 from perf_rels;

insert into public.call_times (user_id, days, start_hour, end_hour)
select child, 'weekdays', 19, 22 from perf_pairs
union all select mom, 'everyday', 9, 12 from perf_pairs
union all select dad, 'everyday', 18, 21 from perf_pairs where dad is not null;

-- 질문 12개: 11개는 끝남(4개 중 3개는 둘 다 답해서 열림), 마지막은 자녀만 답하고 기다리는 중
insert into public.exchange_questions (id, relationship_id, seq_no, sent_on, text, status, opened_at, closed_at)
select md5('perf-q:' || r.rel || ':' || s)::uuid, r.rel, s, (r.since + make_interval(days => (s - 1) * 3))::date,
  '시험 질문 ' || s,
  case when s = 12 then 'waiting' else 'closed' end,
  case when s < 12 and s % 4 <> 0 then r.since + make_interval(days => (s - 1) * 3 + 1) end,
  case when s < 12 then r.since + make_interval(days => s * 3) end
from perf_rels r, generate_series(1, 12) s;

insert into public.answers (exchange_question_id, relationship_id, user_id, text, answered_at, visible_to_partner)
select md5('perf-q:' || r.rel || ':' || s)::uuid, r.rel, r.child, '자녀 답 ' || s,
  r.since + make_interval(days => (s - 1) * 3, hours => 5), s < 12 and s % 4 <> 0
from perf_rels r, generate_series(1, 12) s
union all
select md5('perf-q:' || r.rel || ':' || s)::uuid, r.rel, r.parent, '부모님 답 ' || s,
  r.since + make_interval(days => (s - 1) * 3, hours => 20), true
from perf_rels r, generate_series(1, 11) s where s % 4 <> 0;

-- 통화 5번(끝남) + 7쌍 중 1쌍은 오늘 못 받은 전화
insert into public.calls (id, relationship_id, caller_id, callee_id, status, started_at, answered_at, ended_at)
select md5('perf-call:' || r.rel || ':' || k)::uuid, r.rel, r.child, r.parent, 'completed',
  r.since + make_interval(days => k * 7, hours => 20), r.since + make_interval(days => k * 7, hours => 20),
  r.since + make_interval(days => k * 7, hours => 20, mins => 15)
from perf_rels r, generate_series(1, 5) k
union all
select md5('perf-call:' || r.rel || ':missed')::uuid, r.rel, r.parent, r.child, 'missed', now() - interval '1 hour', null, null
from perf_rels r where r.i % 7 = 0;

-- 메모 4개(두 사람이 2개씩)
insert into public.memos (id, user_id, relationship_id, call_id, mood, text, created_at)
select md5('perf-memo:' || r.rel || ':' || k)::uuid, case when k % 2 = 0 then r.child else r.parent end, r.rel,
  md5('perf-call:' || r.rel || ':' || k)::uuid, 'good', '통화 메모 ' || k, r.since + make_interval(days => k * 7, hours => 21)
from perf_rels r, generate_series(1, 4) k;

-- 근황 5개(번갈아), 마지막 것은 아직 확인 안 함
insert into public.news (id, relationship_id, author_id, text, topic, topic_by, created_at, seen_at)
select md5('perf-news:' || r.rel || ':' || k)::uuid, r.rel, case when k % 2 = 0 then r.child else r.parent end,
  '근황 ' || k, '먹은 것', 'chip', r.since + make_interval(days => k * 6, hours => 12),
  case when k < 5 then r.since + make_interval(days => k * 6, hours => 14) end
from perf_rels r, generate_series(1, 5) k;

insert into public.news_photos (news_id, relationship_id, file_path, thumb_path, sort)
select md5('perf-news:' || r.rel || ':1')::uuid, r.rel, r.rel || '/perf1/1.jpg', r.rel || '/perf1/1_t.jpg', 1 from perf_rels r;

-- 여쭤볼 이야기: 메모에서 2개(고름), 근황에서 1개(후보)
insert into public.talk_suggestions (owner_id, relationship_id, source, memo_id, text, made_by, status)
select case when k % 2 = 0 then r.child else r.parent end, r.rel, 'memo', md5('perf-memo:' || r.rel || ':' || k)::uuid,
  '여쭤볼 이야기 ' || k, 'ai', 'picked'
from perf_rels r, generate_series(1, 2) k;
insert into public.talk_suggestions (owner_id, relationship_id, source, news_id, text, made_by, status)
select r.child, r.rel, 'news', md5('perf-news:' || r.rel || ':5')::uuid, '근황 이야기', 'ai', 'candidate' from perf_rels r;

-- 통화 메모 초안: 자녀에게 하나(저장 전)
insert into public.memo_drafts (user_id, relationship_id, call_id, text, status, expires_at)
select r.child, r.rel, md5('perf-call:' || r.rel || ':5')::uuid, '초안', 'ready', now() + interval '2 days' from perf_rels r;

analyze auth.users;
analyze public.users;
analyze public.relationships;
analyze public.relationship_settings;
analyze public.call_times;
analyze public.exchange_questions;
analyze public.answers;
analyze public.calls;
analyze public.memos;
analyze public.news;
analyze public.news_photos;
analyze public.talk_suggestions;
analyze public.memo_drafts;
analyze public.custom_questions;
analyze public.invites;

create temp table perf_out (label text, runs int, avg_ms numeric, max_ms numeric, seq_scans text);

-- sql을 그 사람으로 runs번 불러 걸린 시간을 재고, 한 번 부를 때 훑은 표(줄 수 100 넘는 것)를 적는다
create function pg_temp.perf(label text, who uuid, sql text, runs int default 10) returns void
language plpgsql as $$
declare
  t0 timestamptz;
  times numeric[] := '{}';
  scans text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', who, 'role', 'authenticated')::text, true);
  execute sql;
  create temp table if not exists perf_before (relid oid, seq_scan bigint);
  delete from perf_before;
  insert into perf_before select relid, seq_scan from pg_stat_xact_user_tables;
  execute sql;
  select string_agg(s.relname || '(' || c.reltuples::bigint || ')', ', ' order by s.relname) into scans
  from pg_stat_xact_user_tables s join perf_before b on b.relid = s.relid join pg_class c on c.oid = s.relid
  where s.seq_scan > b.seq_scan and c.reltuples > 100;
  for k in 1..runs loop
    t0 := clock_timestamp();
    execute sql;
    times := times || (extract(epoch from clock_timestamp() - t0) * 1000)::numeric;
  end loop;
  insert into perf_out values (label, runs,
    round((select avg(x) from unnest(times) x), 2), round((select max(x) from unnest(times) x), 2), coalesce(scans, ''));
end;
$$;

-- 아빠와도 이어진 자녀(가족 둘) · 엄마 · 홈 카드가 많은 자녀(못 받은 전화 · 새 근황 · 초안)
select pg_temp.perf('home · 자녀(가족 둘)', (select child from perf_pairs where i = 70), 'select public.home()');
select pg_temp.perf('home · 부모님', (select mom from perf_pairs where i = 35), 'select public.home()');
select pg_temp.perf('records · 첫 20개', (select child from perf_pairs where i = 70),
  format('select public.records(%L)', (select rel from perf_pairs where i = 70)));
select pg_temp.perf('records · 질문만', (select child from perf_pairs where i = 70),
  format('select public.records(%L, %L)', (select rel from perf_pairs where i = 70), 'question'));
select pg_temp.perf('records · 다음 20개', (select child from perf_pairs where i = 70),
  format('select public.records(%L, null, %L, %L)', (select rel from perf_pairs where i = 70),
    (select since + interval '20 days' from perf_pairs where i = 70), '00000000-0000-0000-0000-000000000000'));
select pg_temp.perf('record_calendar · 이번 달', (select child from perf_pairs where i = 70),
  format('select public.record_calendar(%L, %L)', (select rel from perf_pairs where i = 70), (select since::date + 30 from perf_pairs where i = 70)));
select pg_temp.perf('talk_list', (select child from perf_pairs where i = 70),
  format('select public.talk_list(%L)', (select rel from perf_pairs where i = 70)));
select pg_temp.perf('my_page', (select child from perf_pairs where i = 70), 'select public.my_page()');

-- 답 열기: 자녀가 먼저 답해 둔 마지막 질문에 부모님이 답하면 열린다. 사람마다 한 번이라 열 쌍으로 잰다
do $$
declare
  t0 timestamptz;
  times numeric[] := '{}';
  p record;
  scans text;
begin
  delete from perf_before;
  insert into perf_before select relid, seq_scan from pg_stat_xact_user_tables;
  for p in select * from perf_rels where i between 101 and 110 and kind = 'mom' loop
    perform set_config('request.jwt.claims', json_build_object('sub', p.parent, 'role', 'authenticated')::text, true);
    t0 := clock_timestamp();
    perform public.submit_answer(md5('perf-q:' || p.rel || ':12')::uuid, '부모님 답');
    times := times || (extract(epoch from clock_timestamp() - t0) * 1000)::numeric;
  end loop;
  select string_agg(s.relname || '(' || c.reltuples::bigint || ')', ', ' order by s.relname) into scans
  from pg_stat_xact_user_tables s join perf_before b on b.relid = s.relid join pg_class c on c.oid = s.relid
  where s.seq_scan > b.seq_scan and c.reltuples > 100;
  insert into perf_out values ('submit_answer · 답 열기', 10,
    round((select avg(x) from unnest(times) x), 2), round((select max(x) from unnest(times) x), 2), coalesce(scans, ''));
end;
$$;
