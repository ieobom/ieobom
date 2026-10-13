begin;
select plan(8);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('남');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('남'), '남', 'child');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
insert into public.calls (relationship_id, caller_id, callee_id, status) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'ringing');
insert into public.memos (user_id, relationship_id, text) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', '지난 메모');

select pg_temp.login('남');
select throws_ok($$ select public.end_relationship('00000000-0000-0000-0000-00000000a001') $$, 'P0001', 'not_connected', '남은 끊지 못한다');

select pg_temp.login('엄마');
select lives_ok($$ select public.end_relationship('00000000-0000-0000-0000-00000000a001') $$, '연결된 사람은 끊는다');
select is((select status from public.relationships), 'ended', '끊김');
select is((select ended_by from public.relationships), pg_temp.user_id('엄마'), '누가 끊었는지 남긴다');
select ok(not public.is_connected('00000000-0000-0000-0000-00000000a001'), '끊은 연결로는 새로 쓸 수 없다');
select is((select status from public.calls), 'canceled', '울리던 전화는 끝낸다');
select throws_ok($$ select public.end_relationship('00000000-0000-0000-0000-00000000a001') $$, 'P0001', 'not_connected', '이미 끊긴 연결');

select pg_temp.login('자녀');
select is((select count(*)::int from public.memos), 1, '기록은 남는다');

select * from finish();
rollback;
