begin;
select plan(15);

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

select throws_ok($$ insert into public.relationships (child_id, parent_id, parent_kind) values (pg_temp.user_id('자녀'), pg_temp.user_id('남'), 'mom') $$,
  '23505', null, '한 자녀에게 이어진 엄마는 한 분');
select throws_ok($$ insert into public.relationships (child_id, parent_id, parent_kind) values (pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'dad') $$,
  '23505', null, '같은 쌍은 한 줄');

select pg_temp.login('자녀');
select is((select count(*)::int from public.relationships), 2, '내 연결은 끊긴 것까지 보인다');
select ok(public.is_member('00000000-0000-0000-0000-00000000a002'), '끊긴 연결도 연결된 사람이다');
select ok(not public.is_connected('00000000-0000-0000-0000-00000000a002'), '끊긴 연결에는 새로 쓸 수 없다');
select ok(public.is_connected('00000000-0000-0000-0000-00000000a001'), '이어진 연결');
select is((select partner_name from public.my_families() where parent_kind = 'mom'), null, '자녀에게는 부모님 이름을 주지 않는다');
select throws_ok($$ insert into public.relationships (child_id, parent_id, parent_kind) values (pg_temp.user_id('자녀'), pg_temp.user_id('남'), 'dad') $$,
  '42501', null, '앱은 연결을 직접 만들지 못한다');
select throws_ok($$ update public.relationships set status = 'connected' $$, '42501', null, '앱은 연결을 직접 바꾸지 못한다');

select pg_temp.login('엄마');
select is((select partner_name from public.my_families()), '아영', '부모님에게는 자녀 이름이 보인다');

select pg_temp.login('남');
select is((select count(*)::int from public.relationships), 0, '남의 연결은 못 본다');
select ok(not public.is_member('00000000-0000-0000-0000-00000000a001'), '남은 연결된 사람이 아니다');

-- 엄마가 탈퇴하면 줄은 남고 엄마 칸만 빈다
reset role;
delete from auth.users where id = pg_temp.user_id('엄마');
select is((select status from public.relationships where id = '00000000-0000-0000-0000-00000000a001'), 'left', '상대가 탈퇴하면 상대 탈퇴');
select is((select parent_id from public.relationships where id = '00000000-0000-0000-0000-00000000a001'), null, '탈퇴한 사람 칸만 빈다');
select pg_temp.login('자녀');
select is((select count(*)::int from public.relationships), 2, '남은 사람은 그 연결을 계속 본다');

select * from finish();
rollback;
