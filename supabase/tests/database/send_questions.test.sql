begin;
select plan(12);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('아빠');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('아빠'), '이철수', 'parent');
insert into public.relationships (id, child_id, parent_id, parent_kind, status) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom', 'connected'),
  ('00000000-0000-0000-0000-00000000a002', pg_temp.user_id('자녀'), pg_temp.user_id('아빠'), 'dad', 'ended');
-- 엄마와는 주 2번(월 · 목). 자녀는 '건강'을 피하고 싶다
insert into public.relationship_settings (relationship_id, user_id, question_freq, avoid_topics) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), 2, '{건강}'),
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), 3, '{}');
-- 다른 질문(가짜 데이터 등)이 먼저 뽑히지 않게 이 검사 동안은 시험용 질문만 검토한 것으로 둔다
update public.question_bank set reviewed = false;
insert into public.question_bank (id, text, topic, reviewed, created_at) values
  ('00000000-0000-0000-0000-0000000b0001', '요즘 몸은 괜찮아요?', '건강', true, '2026-01-01'),
  ('00000000-0000-0000-0000-0000000b0002', '좋아했던 반찬은?', null, true, '2026-01-02'),
  ('00000000-0000-0000-0000-0000000b0003', '요즘 듣는 노래는?', null, true, '2026-01-03'),
  ('00000000-0000-0000-0000-0000000b0004', '검토 전', null, false, '2026-01-04');
insert into public.custom_questions (id, relationship_id, author_id, text, send_on, created_at) values
  ('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '엄마가 만든 질문', '2026-10-15', now());

select is((select count(*)::int from cron.job where jobname = 'send-questions' and schedule = '0 20 * * *'), 1, '새벽 5시(한국) 작업이 있다');

-- 2026-10-12(월) ~ 10-18(일) 한 주를 당겨서 매일 돌린다
select public.send_due_questions('2026-10-12'::date + d) from generate_series(0, 6) as d;

select is((select count(*)::int from public.exchange_questions where relationship_id = '00000000-0000-0000-0000-00000000a001'), 2,
  '주 2번이면 한 주에 질문 2개(월 · 목)');
select is((select array_agg(sent_on order by seq_no) from public.exchange_questions where relationship_id = '00000000-0000-0000-0000-00000000a001'),
  array['2026-10-12', '2026-10-15']::date[], '월요일과 목요일');
select is((select text from public.exchange_questions where relationship_id = '00000000-0000-0000-0000-00000000a001' and sent_on = '2026-10-12'),
  '좋아했던 반찬은?', '피하고 싶은 주제(건강)는 빼고 보낸다');
select is((select text from public.exchange_questions where relationship_id = '00000000-0000-0000-0000-00000000a001' and sent_on = '2026-10-15'),
  '엄마가 만든 질문', '차례가 된 직접 만든 질문을 먼저 보낸다');
select is((select status from public.custom_questions where id = '00000000-0000-0000-0000-0000000c0001'), 'sent', '보낸 직접 만든 질문은 보냄');
select is((select array_agg(seq_no order by seq_no) from public.exchange_questions where relationship_id = '00000000-0000-0000-0000-00000000a001'),
  array[1, 2], '#번호를 이어 매긴다');
select is((select status from public.exchange_questions where relationship_id = '00000000-0000-0000-0000-00000000a001' and sent_on = '2026-10-12'),
  'closed', '새 질문이 오면 이전 질문은 끝남');
select is((select count(*)::int from public.exchange_questions where relationship_id = '00000000-0000-0000-0000-00000000a002'), 0, '끊긴 연결에는 보내지 않는다');

select public.send_due_questions('2026-10-15');
select is((select count(*)::int from public.exchange_questions where relationship_id = '00000000-0000-0000-0000-00000000a001'), 2,
  '같은 날 두 번 돌려도 다시 보내지 않는다');

-- 다음 주 월요일: 남은 질문(노래), 그다음 질문 날에는 더 보낼 것이 없다
select public.send_due_questions('2026-10-19');
select is((select text from public.exchange_questions where relationship_id = '00000000-0000-0000-0000-00000000a001' and sent_on = '2026-10-19'),
  '요즘 듣는 노래는?', '안 보낸 질문을 차례로');
select public.send_due_questions('2026-10-22');
select is((select count(*)::int from public.exchange_questions where relationship_id = '00000000-0000-0000-0000-00000000a001'), 3,
  '보낼 질문이 없으면 보내지 않는다(검토 전 질문은 안 보냄)');

select * from finish();
rollback;
