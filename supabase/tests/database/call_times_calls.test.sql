begin;
select plan(16);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('아빠');
select pg_temp.make_user('남');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('아빠'), '이철수', 'parent'),
  (pg_temp.user_id('남'), '남', 'child');
insert into public.relationships (id, child_id, parent_id, parent_kind, status) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom', 'connected'),
  ('00000000-0000-0000-0000-00000000a002', pg_temp.user_id('자녀'), pg_temp.user_id('아빠'), 'dad', 'ended');
insert into public.calls (id, relationship_id, caller_id, callee_id, status) values
  ('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'completed');
insert into public.call_transcripts (call_id, user_id) values
  ('00000000-0000-0000-0000-0000000c0001', pg_temp.user_id('자녀'));

-- ── 통화 편한 시간 ──
select pg_temp.login('자녀');
select lives_ok($$ insert into public.call_times (user_id, days, start_hour, end_hour) values
  (pg_temp.user_id('자녀'), 'weekdays', 19, 21), (pg_temp.user_id('자녀'), 'sat', 10, 12), (pg_temp.user_id('자녀'), 'sun', 10, 12) $$,
  '내 시간을 3개까지 더한다');
select throws_ok($$ insert into public.call_times (user_id, days, start_hour, end_hour) values (pg_temp.user_id('자녀'), 'everyday', 8, 9) $$,
  'P0001', 'too_many_call_times', '4번째 시간은 거절');
select lives_ok($$ delete from public.call_times where days = 'sun' $$, '내 시간을 지운다');
select throws_ok($$ insert into public.call_times (user_id, days, start_hour, end_hour) values (pg_temp.user_id('자녀'), 'sun', 21, 20) $$,
  '23514', null, '끝이 시작보다 빠르면 거절');
select throws_ok($$ insert into public.call_times (user_id, days, start_hour, end_hour) values (pg_temp.user_id('자녀'), 'sun', 5, 9) $$,
  '23514', null, '6시 전은 거절');
select throws_ok($$ insert into public.call_times (user_id, days, start_hour, end_hour) values (pg_temp.user_id('엄마'), 'sun', 10, 11) $$,
  '42501', null, '남의 시간은 못 더한다');

select pg_temp.login('엄마');
select is((select count(*)::int from public.call_times), 2, '이어진 가족은 내 시간을 읽는다');
select is_empty($$ delete from public.call_times returning 1 $$, '가족의 시간은 못 지운다');

select pg_temp.login('아빠');
select is((select count(*)::int from public.call_times), 0, '끊긴 가족은 못 읽는다');

select pg_temp.login('남');
select is((select count(*)::int from public.call_times), 0, '남은 못 읽는다');
select is((select count(*)::int from public.calls), 0, '남은 통화 기록을 못 본다');

-- ── 통화 ──
select pg_temp.login('엄마');
select is((select count(*)::int from public.calls), 1, '두 사람은 통화 기록을 본다');
select throws_ok($$ insert into public.calls (relationship_id, caller_id, callee_id) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), pg_temp.user_id('자녀')) $$, '42501', null, '통화 줄은 함수로만 만든다');
select throws_ok($$ select * from public.call_transcripts $$, '42501', null, '통화 글은 앱이 못 읽는다');
reset role;

insert into public.calls (relationship_id, caller_id, callee_id) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'));
select throws_ok($$ insert into public.calls (relationship_id, caller_id, callee_id) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), pg_temp.user_id('자녀')) $$, '23505', null, '한 연결에 진행 중 통화는 하나');

delete from auth.users where id = pg_temp.user_id('자녀');
select is((select count(*)::int from public.call_transcripts where call_id = '00000000-0000-0000-0000-0000000c0001'), 0, '탈퇴하면 그 사람 통화 글도 지운다');

select * from finish();
rollback;
