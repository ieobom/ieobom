begin;
select plan(15);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('가입전');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent');

select pg_temp.login('자녀');
select matches((select code from public.create_invite('mom')), '^[0-9]{6}$', '6자리 숫자 코드를 만든다');
select is((select expires_at - created_at from public.invites where status = 'waiting'), interval '48 hours', '48시간 동안 쓴다');
select public.create_invite('mom');
select is((select count(*)::int from public.invites where status = 'replaced'), 1, '새 코드를 만들면 이전 코드는 바뀜');
select is((select count(*)::int from public.invites where status = 'waiting'), 1, '같은 관계로 기다리는 코드는 하나');
select public.create_invite('dad');
select is((select count(*)::int from public.invites where status = 'waiting'), 2, '엄마 · 아빠 코드는 따로');
select lives_ok($$ select public.cancel_invite((select id from public.invites where invite_as = 'dad' and status = 'waiting')) $$, '초대를 취소한다');
select is((select status from public.invites where invite_as = 'dad'), 'canceled', '취소한 코드는 취소');
select throws_ok($$ select public.cancel_invite((select id from public.invites where invite_as = 'dad')) $$,
  'P0001', 'invite_not_found', '이미 취소한 코드는 다시 못 취소한다');

-- 아직 아무와도 이어지지 않았으면 고른 관계에 맞게 바뀐다
select public.create_invite('child', 'mom');
select is((select side from public.users), 'parent', '자녀를 초대하면 부모님 계정이 된다');
select is((select parent_kind from public.invites where invite_as = 'child' and status = 'waiting'), 'mom', '부모님은 엄마 · 아빠를 같이 정한다');
select throws_ok($$ select public.create_invite('child') $$, 'P0001', 'parent_kind_required', '부모님이 자녀를 초대할 때는 엄마 · 아빠가 필요');

reset role;
insert into public.relationships (child_id, parent_id, parent_kind) values (pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
update public.users set side = 'child' where id = pg_temp.user_id('자녀');
select pg_temp.login('자녀');
select throws_ok($$ select public.create_invite('mom') $$, 'P0001', 'already_has_parent', '이미 이어진 엄마가 있으면 엄마 코드는 못 만든다');
select throws_ok($$ select public.create_invite('child', 'mom') $$, 'P0001', 'side_mismatch', '이어진 적이 있으면 자녀/부모님을 못 바꾼다');

select pg_temp.login('가입전');
select throws_ok($$ select public.create_invite('mom') $$, 'P0001', 'not_signed_up', '가입 전에는 못 만든다');

select pg_temp.login('엄마');
select is((select count(*)::int from public.invites), 0, '남의 코드는 안 보인다');

select * from finish();
rollback;
