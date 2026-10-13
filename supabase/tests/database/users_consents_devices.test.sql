begin;
select plan(20);

-- 시험용 가족: 자녀 · 엄마. 가입 함수(3-3) 전이라 관리자로 바로 넣는다
select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent');
insert into public.consents (user_id, doc, version) values
  (pg_temp.user_id('자녀'), 'terms', '1.0'),
  (pg_temp.user_id('엄마'), 'terms', '1.0');

select throws_ok($$ insert into public.users (id, name, side) values (pg_temp.make_user('빈이름'), '  ', 'child') $$, '23514', null, '빈 이름은 저장 안 됨');
select throws_ok($$ update public.users set notify_time = '10:00' where name = '아영' $$, '23514', null, '알림 시각은 네 가지만');

-- ── 사용자 ──
select pg_temp.login('자녀');
select is((select count(*)::int from public.users), 1, '사용자 표는 내 줄만 보인다');
select is((select name from public.users), '아영', '내 줄이 보인다');
select lives_ok($$ update public.users set name = '아영이', notify_time = '21:00' where id = pg_temp.user_id('자녀') $$, '내 이름 · 알림 시각은 바로 고친다');
select is_empty($$ update public.users set name = '바꿈' where id = pg_temp.user_id('엄마') returning 1 $$, '남의 줄은 못 고친다');
select throws_ok($$ update public.users set side = 'parent' where id = pg_temp.user_id('자녀') $$, '42501', null, '자녀/부모님은 못 바꾼다');
select throws_ok($$ update public.users set memo_draft_on = true where id = pg_temp.user_id('자녀') $$, '42501', null, '초안 켜기는 함수로만');
select throws_ok($$ insert into public.users (id, name, side) values (pg_temp.user_id('자녀'), 'x', 'child') $$, '42501', null, '사용자 줄은 가입 함수로만 만든다');
select throws_ok($$ delete from public.users $$, '42501', null, '사용자 줄은 못 지운다');

-- ── 동의 ──
select is((select count(*)::int from public.consents), 1, '동의 기록은 내 것만 보인다');
select throws_ok($$ insert into public.consents (user_id, doc, version) values (pg_temp.user_id('자녀'), 'ai', '1.0') $$, '42501', null, '동의 기록은 함수로만');

-- ── 기기 ──
select throws_ok($$ select * from public.devices $$, '42501', null, '기기 표는 앱이 못 읽는다');
select lives_ok($$ select public.register_device('기기-1', 'ios', '0.1.0', 'push-a', 'call-a') $$, '기기를 등록한다');
select lives_ok($$ select public.register_device('기기-1', 'ios', '0.1.1') $$, '다시 열면 같은 줄을 고친다');
reset role;
select is((select count(*)::int from public.devices where install_id = '기기-1'), 1, '같은 기기는 한 줄');
select is((select push_token from public.devices where install_id = '기기-1'), 'push-a', '토큰을 빼고 부르면 전 값을 둔다');

-- 엄마가 같은 휴대폰으로 로그인하면 줄이 엄마에게 옮겨 간다
select pg_temp.login('엄마');
select public.register_device('기기-1', 'ios', '0.1.1', 'push-b');
select public.unregister_device('없는-기기');
reset role;
select is((select user_id from public.devices where install_id = '기기-1'), pg_temp.user_id('엄마'), '다른 계정이 쓰면 그 계정으로 옮긴다');

select pg_temp.login('자녀');
select public.unregister_device('기기-1');
reset role;
select is((select count(*)::int from public.devices where install_id = '기기-1'), 1, '내 기기가 아니면 못 지운다');

select pg_temp.logout();
select throws_ok($$ select public.register_device('기기-2', 'android', '0.1.0') $$, '42501', null, '로그인 전에는 못 부른다');
reset role;

select * from finish();
rollback;
