begin;
select plan(8);

-- 2026-10-15(목) 19:00 한국: 저녁 7시를 고른 사람이 대상
select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('아빠');
insert into public.users (id, name, side, notify_time, notify_on) values
  (pg_temp.user_id('자녀'), '아영', 'child', '19:00', true),
  (pg_temp.user_id('엄마'), '김순자', 'parent', '19:00', true),
  (pg_temp.user_id('아빠'), '이철수', 'parent', '08:00', true);
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom'),
  ('00000000-0000-0000-0000-00000000a002', pg_temp.user_id('자녀'), pg_temp.user_id('아빠'), 'dad');
insert into public.exchange_questions (id, relationship_id, seq_no, sent_on, text) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', 1, '2026-10-15', '오늘 온 질문');
insert into public.answers (exchange_question_id, relationship_id, user_id, text) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '엄마 답');
insert into public.news (relationship_id, author_id, text) values
  ('00000000-0000-0000-0000-00000000a002', pg_temp.user_id('아빠'), '아빠 근황');
insert into public.call_times (user_id, days, start_hour, end_hour) values
  (pg_temp.user_id('자녀'), 'everyday', 20, 22), (pg_temp.user_id('엄마'), 'everyday', 21, 23);

create temp table d as select * from public.daily_digest_targets('2026-10-15 19:00+09') where user_id in (pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), pg_temp.user_id('아빠'));

select is((select count(*)::int from d), 2, '저녁 7시를 고른 두 사람만');
select is(
  (select i -> 'kinds' from d, jsonb_array_elements(items) i where user_id = pg_temp.user_id('자녀') and i ->> 'relationship_id' = '00000000-0000-0000-0000-00000000a001'),
  '["free_today", "new_question"]'::jsonb, '자녀: 엄마와 오늘 온 질문 · 오늘 겹치는 시간');
select is(
  (select i -> 'kinds' from d, jsonb_array_elements(items) i where user_id = pg_temp.user_id('자녀') and i ->> 'relationship_id' = '00000000-0000-0000-0000-00000000a002'),
  '["news"]'::jsonb, '자녀: 아빠가 보낸 근황 (가족마다 따로, 한 통에 묶음)');
select is(
  (select i -> 'kinds' from d, jsonb_array_elements(items) i where user_id = pg_temp.user_id('엄마')),
  '["free_today"]'::jsonb, '엄마는 이미 답했으니 새 질문은 빠진다');

-- 알림을 끄면 빠지고, 오늘 이미 보냈으면 빠진다
update public.users set notify_on = false where id = pg_temp.user_id('엄마');
insert into public.push_log (user_id, kind, dedupe_key) values (pg_temp.user_id('자녀'), 'daily', 'daily:2026-10-15');
select is((select count(*)::int from public.daily_digest_targets('2026-10-15 19:00+09') where user_id in (pg_temp.user_id('자녀'), pg_temp.user_id('엄마'))), 0,
  '알림을 껐거나 오늘 이미 보냈으면 빠진다');

-- 아침 8시: 아빠. 아빠는 보낼 것이 없으면 대상이 아니다
select is((select count(*)::int from public.daily_digest_targets('2026-10-15 08:00+09') where user_id = pg_temp.user_id('아빠')), 0, '보낼 것이 없으면 대상 아님');
insert into public.exchange_questions (relationship_id, seq_no, sent_on, text) values
  ('00000000-0000-0000-0000-00000000a002', 1, '2026-10-15', '아빠와 질문');
select is((select items -> 0 -> 'kinds' from public.daily_digest_targets('2026-10-15 08:00+09') where user_id = pg_temp.user_id('아빠')),
  '["new_question"]'::jsonb, '아침 8시를 고른 아빠에게 새 질문');

-- 끊긴 가족 것은 빠진다
update public.relationships set status = 'ended' where id = '00000000-0000-0000-0000-00000000a002';
select is((select count(*)::int from public.daily_digest_targets('2026-10-15 08:00+09') where user_id = pg_temp.user_id('아빠')), 0, '끊긴 가족은 빠진다');

select * from finish();
rollback;
