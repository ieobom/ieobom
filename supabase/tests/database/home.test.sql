begin;
select plan(20);

-- 기준 때: 2026-10-14(수) 20:30 한국 시간
create temp table t as select '2026-10-14 20:30+09'::timestamptz as at;
grant select on t to public;

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('아빠');
select pg_temp.make_user('삼촌');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('아빠'), '이철수', 'parent'),
  (pg_temp.user_id('삼촌'), '삼촌', 'parent');
insert into public.relationships (id, child_id, parent_id, parent_kind, status, connected_at) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom', 'connected', '2026-10-01 10:00+09'),
  ('00000000-0000-0000-0000-00000000a002', pg_temp.user_id('자녀'), null, 'dad', 'left', '2026-09-01 10:00+09'),
  ('00000000-0000-0000-0000-00000000a003', pg_temp.user_id('자녀'), pg_temp.user_id('삼촌'), 'dad', 'ended', '2026-09-01 10:00+09');
insert into public.call_times (user_id, days, start_hour, end_hour) values
  (pg_temp.user_id('자녀'), 'everyday', 6, 23), (pg_temp.user_id('엄마'), 'everyday', 6, 23);
insert into public.calls (id, relationship_id, caller_id, callee_id, status, started_at) values
  ('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), pg_temp.user_id('자녀'), 'missed', '2026-10-14 19:00+09'),
  ('00000000-0000-0000-0000-0000000c0002', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'completed', '2026-10-12 20:00+09');
insert into public.exchange_questions (id, relationship_id, seq_no, sent_on, text, status, opened_at, closed_at) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', 1, '2026-10-08', '지난 질문', 'closed', '2026-10-09 10:00+09', '2026-10-12 05:00+09'),
  ('00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000a001', 2, '2026-10-12', '요즘 듣는 노래는?', 'waiting', null, null);
insert into public.answers (id, exchange_question_id, relationship_id, user_id, text, answered_at) values
  ('00000000-0000-0000-0000-0000000a0201', '00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '옛날 가요', '2026-10-12 21:00+09');
insert into public.news (id, relationship_id, author_id, text, created_at) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '단풍이 들었어', '2026-10-14 09:00+09'),
  ('00000000-0000-0000-0000-0000000f0002', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '등산 다녀왔어', '2026-10-14 15:00+09');
insert into public.memo_drafts (id, user_id, relationship_id, call_id, status, text, expires_at) values
  ('00000000-0000-0000-0000-0000000d0001', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001',
   '00000000-0000-0000-0000-0000000c0002', 'ready', '엄마가 병원에 다녀오셨대요.', '2026-10-15 20:00+09');
insert into public.notices (id, title, body, show_from, show_until) values
  ('00000000-0000-0000-0000-000000001001', '점검 안내', '새벽 2시에 점검해요', '2026-10-13', '2026-10-20');

create function pg_temp.kinds(home jsonb, rel text) returns text[]
language sql as $$
  select array_agg(case when c ->> 'kind' = 'question' then 'question:' || (c ->> 'state') else c ->> 'kind' end order by o)
  from jsonb_array_elements(home -> 'families') f, jsonb_array_elements(f -> 'cards') with ordinality as x (c, o)
  where f ->> 'relationship_id' = rel
$$;

-- ── 자녀 ──
select pg_temp.login('자녀');
create temp table h1 as select public.home((select at from t)) as h;
select is(pg_temp.kinds((select h from h1), '00000000-0000-0000-0000-00000000a001'),
  array['missed_call', 'free_now', 'news', 'memo_draft', 'question:waiting'], '급한 것부터, 질문 기다림은 맨 뒤');
select is(jsonb_array_length((select h from h1) -> 'families'), 2, '끊은 연결은 홈에 없다');
select is(pg_temp.kinds((select h from h1), '00000000-0000-0000-0000-00000000a002'), array['partner_left'], '상대가 탈퇴한 연결은 카드 하나');
select is((select f -> 'cards' -> 2 -> 'news_ids' from h1, jsonb_array_elements(h -> 'families') f where f ->> 'relationship_id' = '00000000-0000-0000-0000-00000000a001'),
  '["00000000-0000-0000-0000-0000000f0002", "00000000-0000-0000-0000-0000000f0001"]'::jsonb, '새 근황은 한 장, 최근 것부터');
select is((select (f ->> 'days_together')::int from h1, jsonb_array_elements(h -> 'families') f where f ->> 'relationship_id' = '00000000-0000-0000-0000-00000000a001'),
  14, '이어진 지 14일째');
select is((select f ->> 'partner_name' from h1, jsonb_array_elements(h -> 'families') f where f ->> 'relationship_id' = '00000000-0000-0000-0000-00000000a001'),
  null, '자녀에게는 부모님 이름을 주지 않는다');
select is((select f ->> 'next_question_on' from h1, jsonb_array_elements(h -> 'families') f where f ->> 'relationship_id' = '00000000-0000-0000-0000-00000000a001'),
  '2026-10-15', '다음 질문은 목요일');
select is((select h -> 'notice' ->> 'title' from h1), '점검 안내', '보일 때인 공지');

-- ── 엄마: 못 받은 전화는 받는 사람에게만, 새 질문은 할 일 ──
select pg_temp.login('엄마');
select is(pg_temp.kinds(public.home((select at from t)), '00000000-0000-0000-0000-00000000a001'),
  array['free_now', 'question:new'], '엄마는 편한 시간과 답할 새 질문');
select is((select f ->> 'partner_name' from jsonb_array_elements(public.home((select at from t)) -> 'families') f), '아영', '부모님에게는 자녀 이름');

-- ── 답한 지 3일이 지나면 먼저 보낼까요 ──
reset role;
update public.answers set answered_at = '2026-10-11 09:00+09' where id = '00000000-0000-0000-0000-0000000a0201';
select pg_temp.login('자녀');
select is(pg_temp.kinds(public.home((select at from t)), '00000000-0000-0000-0000-00000000a001'),
  array['missed_call', 'free_now', 'question:ask_early', 'news', 'memo_draft'], '답한 지 3일이면 질문 할 일이 3번째');

-- ── 먼저 보내면 엄마 쪽은 '상대가 먼저 보냄' ──
reset role;
update public.answers set early_choice = 'send', visible_to_partner = true where id = '00000000-0000-0000-0000-0000000a0201';
select pg_temp.login('엄마');
select is(pg_temp.kinds(public.home((select at from t)), '00000000-0000-0000-0000-00000000a001'),
  array['free_now', 'question:partner_sent_first'], '상대가 먼저 보냄');
select pg_temp.login('자녀');
select is(pg_temp.kinds(public.home((select at from t)), '00000000-0000-0000-0000-00000000a001'),
  array['missed_call', 'free_now', 'news', 'memo_draft', 'question:waiting'], '먼저 보낸 쪽은 다시 기다림');

-- ── 둘 다 답하면 열림 → 확인했어요 하면 다음 질문 ──
reset role;
insert into public.answers (exchange_question_id, relationship_id, user_id, text, visible_to_partner) values
  ('00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '트로트', true);
update public.exchange_questions set status = 'opened', opened_at = now() where id = '00000000-0000-0000-0000-0000000e0002';
select pg_temp.login('자녀');
select ok('question:opened' = any (pg_temp.kinds(public.home((select at from t)), '00000000-0000-0000-0000-00000000a001')), '둘 다 답함');
reset role;
update public.exchange_questions set child_seen_at = now() where id = '00000000-0000-0000-0000-0000000e0002';
select pg_temp.login('자녀');
select is((pg_temp.kinds(public.home((select at from t)), '00000000-0000-0000-0000-00000000a001'))[5], 'question:next', '확인하면 맨 뒤 다음 질문 날짜');

-- ── 확인했어요 · 다시 걸기 · 저장으로 카드가 빠진다 ──
reset role;
update public.news set seen_at = now() where relationship_id = '00000000-0000-0000-0000-00000000a001';
update public.memo_drafts set status = 'saved' where id = '00000000-0000-0000-0000-0000000d0001';
insert into public.calls (relationship_id, caller_id, callee_id, status, started_at) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'completed', '2026-10-14 20:00+09');
select pg_temp.login('자녀');
select is(pg_temp.kinds(public.home((select at from t)), '00000000-0000-0000-0000-00000000a001'),
  array['question:next'], '다시 걸고 그 시간에 통화하고 확인 · 저장하면 질문 카드만 남는다');

-- ── 다음 날이면 못 받은 전화는 빠지고, 3일 지난 초안도 빠진다 ──
reset role;
delete from public.calls where started_at = '2026-10-14 20:00+09';
update public.memo_drafts set status = 'ready' where id = '00000000-0000-0000-0000-0000000d0001';
select pg_temp.login('자녀');
select ok(not ('missed_call' = any (pg_temp.kinds(public.home('2026-10-15 07:00+09'), '00000000-0000-0000-0000-00000000a001'))), '다음 날 못 받은 전화는 빠진다');
select ok(not ('memo_draft' = any (pg_temp.kinds(public.home('2026-10-16 07:00+09'), '00000000-0000-0000-0000-00000000a001'))), '3일 지난 초안은 빠진다');
select ok(not ('free_now' = any (pg_temp.kinds(public.home('2026-10-14 23:30+09'), '00000000-0000-0000-0000-00000000a001'))), '편한 시간이 끝나면 빠진다');

reset role;
insert into public.notice_reads (notice_id, user_id) values ('00000000-0000-0000-0000-000000001001', pg_temp.user_id('자녀'));
select pg_temp.login('자녀');
select is(public.home((select at from t)) -> 'notice', 'null'::jsonb, '확인한 공지는 안 나온다');

select * from finish();
rollback;
