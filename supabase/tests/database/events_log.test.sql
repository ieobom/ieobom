begin;
select plan(12);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('가입 전');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent');

-- ── 로그인 전 · 가입 전 ──
select pg_temp.logout();
select throws_ok($$ select public.log_events('[{"name": "app_open"}]') $$, '42501', null, '로그인 전에는 못 부른다');
select pg_temp.login('가입 전');
select throws_ok($$ select public.log_events('[{"name": "app_open"}]') $$, 'P0001', 'not_signed_up', '가입 전에는 적지 않는다');

-- ── 묶어 보내기 ──
select pg_temp.login('자녀');
select is(public.log_events(jsonb_build_array(
  jsonb_build_object('name', 'app_open', 'at', now() - interval '10 minutes'),
  jsonb_build_object('name', 'answer_sent', 'detail', '{"mode": "text"}'::jsonb),
  jsonb_build_object('name', 'no_such_event'),
  jsonb_build_object('name', 'memo_saved', 'at', 'not a time'),
  jsonb_build_object('name', 'app_open', 'at', now() - interval '8 days'),
  '"not an object"'::jsonb
)), 3, '받는 이름만, 7일 안의 것만 적는다');
select throws_ok($$ select public.log_events('{"name": "app_open"}') $$, 'P0001', 'invalid_events', '목록이 아니면 거절');
select throws_ok($$ select public.log_events((select jsonb_agg(jsonb_build_object('name', 'app_open')) from generate_series(1, 51))) $$,
  'P0001', 'too_many_events', '한 번에 50개까지');
select pg_temp.login('엄마');
select is(public.log_events('[{"name": "card_tap", "detail": {"kind": "question"}}]'), 1, '부모님도 적는다');
reset role;

select is((select count(distinct anon_id)::int from public.events where created_at > now() - interval '1 hour'), 2, '사람마다 다른 표시');
select ok((select bool_and(anon_id <> pg_temp.user_id('자녀')::text and anon_id <> pg_temp.user_id('엄마')::text and char_length(anon_id) = 32)
  from public.events where created_at > now() - interval '1 hour'), '표시는 사용자 번호가 아니다');
select is((select detail from public.events where name = 'answer_sent' and created_at > now() - interval '1 hour'),
  '{"mode": "text", "side": "child"}'::jsonb, '자녀 · 부모님 구분을 같이 적는다');
select ok((select created_at < now() - interval '9 minutes' from public.events where name = 'app_open' and created_at > now() - interval '1 hour'),
  '앱에서 일어난 시각으로 적는다');

-- 하루 500개를 넘으면 버린다
insert into public.events (anon_id, name, created_at)
select (select anon_id from public.events where name = 'card_tap' and created_at > now() - interval '1 hour'), 'app_open', now() - interval '1 hour'
from generate_series(1, 498);
select pg_temp.login('엄마');
select is(public.log_events('[{"name": "app_open"}, {"name": "app_open"}, {"name": "app_open"}]'), 1, '하루 500개까지만');
select throws_ok($$ select * from private.secrets $$, '42501', null, '숨긴 값은 앱에서 못 읽는다');
reset role;

select * from finish();
rollback;
