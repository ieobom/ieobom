begin;
select plan(22);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('남');
insert into public.users (id, name, side, memo_draft_on) values
  (pg_temp.user_id('자녀'), '아영', 'child', true),
  (pg_temp.user_id('엄마'), '김순자', 'parent', true),
  (pg_temp.user_id('남'), '남', 'child', false);
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
-- 지금이 언제든 겹치도록 둘 다 매일 6~23시
insert into public.call_times (user_id, days, start_hour, end_hour) values
  (pg_temp.user_id('자녀'), 'everyday', 6, 23), (pg_temp.user_id('엄마'), 'everyday', 6, 23);

-- ── 걸기 · 받기 · 끝 ──
select pg_temp.login('자녀');
create temp table c1 as select * from public.start_call('00000000-0000-0000-0000-00000000a001');
grant select on c1 to public;
select is((select status from c1), 'ringing', '걸면 울림');
select is((select callee_id from c1), pg_temp.user_id('엄마'), '받는 사람은 상대');
select is((select room_name from c1), 'call-' || (select id from c1), '통화방 이름을 정한다');
select is((select id from public.start_call('00000000-0000-0000-0000-00000000a001')), (select id from c1), '다시 걸어도 같은 전화');
select throws_ok($$ select public.answer_call((select id from c1)) $$, 'P0001', 'call_not_ringing', '건 사람은 받지 못한다');

reset role;
-- 받기 직전에 엄마가 초안을 끄면 그 값이 적힌다
update public.users set memo_draft_on = false where id = pg_temp.user_id('엄마');
select pg_temp.login('엄마');
select is((select status from public.answer_call((select id from c1))), 'active', '받으면 통화 중');
select ok((select caller_draft_on and not callee_draft_on from public.calls where id = (select id from c1)), '받는 순간 두 사람의 초안 값을 적는다');
reset role;
update public.users set memo_draft_on = true where id = pg_temp.user_id('엄마');
select ok((select not callee_draft_on from public.calls where id = (select id from c1)), '받은 뒤 설정을 바꿔도 그 통화의 값은 그대로');
select pg_temp.login('엄마');
select throws_ok($$ select public.start_call('00000000-0000-0000-0000-00000000a001') $$, 'P0001', 'call_in_progress', '통화 중에는 새로 못 건다');
select is((select status from public.end_call((select id from c1))), 'completed', '끝내면 통화함');
select ok((select in_free_time from public.calls where id = (select id from c1)), '둘 다 편한 시간에 건 전화로 적는다');

-- ── 동시에 걸기 → 먼저 건 통화로 합침 ──
select pg_temp.login('자녀');
create temp table c2 as select * from public.start_call('00000000-0000-0000-0000-00000000a001');
grant select on c2 to public;
select pg_temp.login('엄마');
create temp table c3 as select * from public.start_call('00000000-0000-0000-0000-00000000a001');
grant select on c3 to public;
select is((select id from c3), (select id from c2), '나중에 건 쪽은 먼저 건 통화에 합쳐진다');
select is((select status from c3), 'active', '합쳐지면 바로 통화 중');
select public.end_call((select id from c2));

-- ── 거절 · 취소 · 못 받음 ──
select pg_temp.login('자녀');
create temp table c4 as select * from public.start_call('00000000-0000-0000-0000-00000000a001');
select throws_ok($$ select public.decline_call((select id from c4)) $$, 'P0001', 'call_not_ringing', '건 사람은 거절하지 못한다');
select pg_temp.login('남');
select throws_ok($$ select public.answer_call((select id from c4)) $$, 'P0001', 'call_not_ringing', '남은 받지 못한다');
select pg_temp.login('엄마');
select is((select status from public.decline_call((select id from c4))), 'declined', '받는 사람이 거절');

select pg_temp.login('자녀');
select is((select status from public.cancel_call((select id from public.start_call('00000000-0000-0000-0000-00000000a001')))), 'canceled',
  '받기 전에 끊으면 취소');
create temp table c6 as select * from public.cancel_call((select id from public.start_call('00000000-0000-0000-0000-00000000a001')), true);
select is((select status from c6), 'missed', '45초가 지나면 못 받음');
select public.see_missed_call((select id from c6));
reset role;
select is((select missed_seen_at from public.calls where id = (select id from c6)), null, '건 사람이 본 것은 치지 않는다');
select pg_temp.login('엄마');
select public.see_missed_call((select id from c6));
reset role;
select isnt((select missed_seen_at from public.calls where id = (select id from c6)), null, '받는 사람이 보면 홈 카드에서 빠진다');

select pg_temp.login('남');
select throws_ok($$ select public.start_call('00000000-0000-0000-0000-00000000a001') $$, 'P0001', 'not_connected', '남은 못 건다');
reset role;
update public.relationships set status = 'ended' where id = '00000000-0000-0000-0000-00000000a001';
select pg_temp.login('자녀');
select throws_ok($$ select public.start_call('00000000-0000-0000-0000-00000000a001') $$, 'P0001', 'not_connected', '끊은 연결로는 못 건다');

select * from finish();
rollback;
