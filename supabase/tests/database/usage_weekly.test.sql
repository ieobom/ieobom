begin;
select plan(4);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'), (pg_temp.user_id('엄마'), '김순자', 'parent');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
-- 10-12(월) ~ 10-18(일)이 한 주. 10-19 00:30(한국)은 다음 주
insert into public.usage (user_id, relationship_id, kind, amount, created_at) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'call_minutes', 30, '2026-10-12 20:00+09'),
  (pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001', 'call_minutes', 12, '2026-10-18 23:00+09'),
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'ai_tokens', 1800, '2026-10-15 21:00+09'),
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'call_minutes', 5, '2026-10-19 00:30+09');

select is((select call_minutes from public.usage_weekly where relationship_id = '00000000-0000-0000-0000-00000000a001' and week = '2026-10-12'),
  42::numeric, '한 주의 통화 분을 더한다(한국 날짜 기준)');
select is((select ai_tokens from public.usage_weekly where relationship_id = '00000000-0000-0000-0000-00000000a001' and week = '2026-10-12'),
  1800::numeric, '종류별로 따로');
select is((select call_minutes from public.usage_weekly where relationship_id = '00000000-0000-0000-0000-00000000a001' and week = '2026-10-19'),
  5::numeric, '월요일 0시가 지나면 다음 주');

select pg_temp.login('자녀');
select throws_ok($$ select * from public.usage_weekly $$, '42501', null, '앱은 못 본다');
reset role;

select * from finish();
rollback;
