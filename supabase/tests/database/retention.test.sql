begin;
select plan(9);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
insert into public.calls (id, relationship_id, caller_id, callee_id, status, started_at) values
  ('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'completed', now() - interval '31 days'),
  ('00000000-0000-0000-0000-0000000c0002', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'completed', now() - interval '29 days');
insert into public.memos (id, user_id, relationship_id, call_id, text) values
  ('00000000-0000-0000-0000-0000000d0001', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000c0001', '오래된 통화 메모');
insert into public.events (anon_id, name, created_at) values ('x', 'old', now() - interval '7 months'), ('x', 'new', now());
insert into public.inquiries (id, user_id, body, created_at, answered_at) values
  ('00000000-0000-0000-0000-000000002001', pg_temp.user_id('자녀'), '오래된 문의', now() - interval '13 months', now() - interval '13 months'),
  ('00000000-0000-0000-0000-000000002002', pg_temp.user_id('자녀'), '오래됐지만 최근 답', now() - interval '13 months', now() - interval '1 month');
insert into public.push_log (user_id, kind, sent_at) values (pg_temp.user_id('자녀'), 'daily', now() - interval '31 days');
insert into public.code_attempts (user_id, ok, attempted_at) values (pg_temp.user_id('자녀'), false, now() - interval '2 days');

select is(
  (select count(*)::int from cron.job where jobname = 'purge-expired' and schedule = '0 19 * * *'), 1, '새벽 4시(한국) 작업이 있다');
select public.purge_expired();
select is((select array_agg(id) from public.calls where relationship_id = '00000000-0000-0000-0000-00000000a001'),
  array['00000000-0000-0000-0000-0000000c0002'::uuid], '30일 지난 통화 기록은 지운다');
select is((select call_id from public.memos where id = '00000000-0000-0000-0000-0000000d0001'), null, '메모는 남고 통화 칸만 빈다');
select is((select count(*)::int from public.events where anon_id = 'x' and name = 'old'), 0, '6개월 지난 이용 기록은 지운다');
select is((select count(*)::int from public.events where anon_id = 'x' and name = 'new'), 1, '최근 이용 기록은 남긴다');
select is((select count(*)::int from public.inquiries where id = '00000000-0000-0000-0000-000000002001'), 0, '답한 지 1년 지난 문의는 지운다');
select is((select count(*)::int from public.inquiries where id = '00000000-0000-0000-0000-000000002002'), 1, '답한 날부터 1년이 안 됐으면 남긴다');
select is((select count(*)::int from public.push_log where user_id = pg_temp.user_id('자녀')), 0, '30일 지난 알림 기록은 지운다');
select is((select count(*)::int from public.code_attempts where user_id = pg_temp.user_id('자녀')), 0, '하루 지난 틀린 코드 기록은 지운다');

select * from finish();
rollback;
