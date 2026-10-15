begin;
select plan(9);

select has_table('public', 'app_config', '기능 켜고 끄기 표가 있다');
select is((select count(*)::int from public.app_config), 4, '기본 기능은 4개');
select ok((select bool_and(enabled) from public.app_config), '기본값은 모두 켬');
select is(public.feature_enabled('ai'), true, '켜진 기능은 true');
select is(public.feature_enabled('없는_기능'), false, '없는 이름은 꺼진 것으로 봄');

-- 로그인 전(anon)
select pg_temp.logout();
select is((select count(*)::int from public.app_config), 4, '로그인 전에도 읽는다');
select throws_ok($$ update public.app_config set enabled = false $$, '42501', null, '로그인 전에는 못 바꾼다');
reset role;

-- 로그인한 사람
select pg_temp.make_user('자녀');
select pg_temp.login('자녀');
select throws_ok($$ insert into public.app_config (key) values ('새_기능') $$, '42501', null, '앱 사용자는 못 더한다');
select throws_ok($$ delete from public.app_config $$, '42501', null, '앱 사용자는 못 지운다');
reset role;

select * from finish();
rollback;
