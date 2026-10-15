begin;
select plan(21);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('아빠');
select pg_temp.make_user('가입 전');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('아빠'), '박철수', 'parent');
insert into public.relationships (id, child_id, parent_id, parent_kind, status, connected_at) values
  ('00000000-0000-0000-0000-00000000b001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom', 'connected', '2026-09-01'),
  ('00000000-0000-0000-0000-00000000b002', pg_temp.user_id('자녀'), pg_temp.user_id('아빠'), 'dad', 'ended', '2026-09-02');
insert into public.relationship_settings (relationship_id, user_id, question_freq, avoid_topics) values
  ('00000000-0000-0000-0000-00000000b001', pg_temp.user_id('자녀'), 3, '{건강}'),
  ('00000000-0000-0000-0000-00000000b001', pg_temp.user_id('엄마'), 2, '{}');
insert into public.consents (user_id, doc, version, agreed_at) values
  (pg_temp.user_id('자녀'), 'terms', '1.0', '2026-10-01 10:00+09'),
  (pg_temp.user_id('자녀'), 'privacy', '1.0', '2026-10-01 10:00+09'),
  (pg_temp.user_id('자녀'), 'ai', '1.0', '2026-10-01 10:00+09');
insert into public.invites (code, inviter_id, invite_as, parent_kind, status) values
  ('987650', pg_temp.user_id('자녀'), 'dad', 'dad', 'waiting'),
  ('987651', pg_temp.user_id('자녀'), 'dad', 'dad', 'canceled'),
  ('987652', pg_temp.user_id('엄마'), 'child', 'mom', 'waiting');
insert into public.call_times (user_id, days, start_hour, end_hour) values
  (pg_temp.user_id('자녀'), 'sat', 10, 12),
  (pg_temp.user_id('자녀'), 'weekdays', 19, 21),
  (pg_temp.user_id('엄마'), 'sun', 14, 16);

select pg_temp.logout();
select throws_ok($$ select public.my_page() $$, '42501', null, '로그인하지 않으면 못 부른다');
select throws_ok($$ select public.set_call_times('[]') $$, '42501', null, '로그인하지 않으면 시간을 못 바꾼다');

select pg_temp.login('가입 전');
select throws_ok($$ select public.my_page() $$, 'P0001', 'not_signed_up', '가입을 마치지 않았으면 안 된다');

select pg_temp.login('자녀');
create temp table p on commit drop as select public.my_page() as v;
select is((select v -> 'me' ->> 'name' from p), '아영', '내 이름');
select is((select v -> 'me' ->> 'notify_time' from p), '19:00', '알림 시각은 시:분');
select is((select (v -> 'me' ->> 'agreed_at')::timestamptz from p), '2026-10-01 10:00+09'::timestamptz, '필수 문서에 동의한 때');
select is((select jsonb_array_length(v -> 'families') from p), 1, '끊은 가족은 빼고 이어진 가족만');
select is((select v -> 'families' -> 0 ->> 'partner_name' from p), null, '자녀 화면에는 부모님 이름을 주지 않는다');
select is((select (v -> 'families' -> 0 ->> 'freq')::int from p), 3, '내가 고른 횟수');
select is((select (v -> 'families' -> 0 ->> 'applied')::int from p), 2, '실제로 받는 횟수는 두 사람 중 적은 쪽');
select is((select v -> 'families' -> 0 -> 'avoid_topics' from p), '["건강"]'::jsonb, '피하고 싶은 주제');
select is((select v -> 'invites' from p) #>> '{0,code}', '987650', '기다리는 내 초대만(취소한 것 · 남의 것은 빼고)');
select is((select v -> 'call_times' -> 0 ->> 'days' from p), 'weekdays', '통화 편한 시간은 평일부터');

select pg_temp.login('엄마');
select is((select public.my_page() -> 'families' -> 0 ->> 'partner_name'), '아영', '부모님 화면에는 자녀 이름');
select public.set_question_freq('00000000-0000-0000-0000-00000000b001', 1);

select pg_temp.login('자녀');
select is((select (public.my_page() -> 'families' -> 0 ->> 'applied')::int), 1, '엄마가 횟수를 줄이면 적은 쪽도 줄어든다');

select is(
  (select count(*)::int from public.set_call_times('[{"days":"everyday","start_hour":8,"end_hour":9},{"days":"sun","start_hour":14,"end_hour":16},{"days":"weekdays","start_hour":20,"end_hour":22}]')),
  3, '고른 시간으로 통째로 바꾼다');
select is(
  (select jsonb_agg(t ->> 'days') from jsonb_array_elements(public.my_page() -> 'call_times') t),
  '["weekdays", "sun", "everyday"]'::jsonb, '저장한 시간으로 바뀌었다');
select throws_ok(
  $$ select public.set_call_times('[{"days":"sat","start_hour":10,"end_hour":12},{"days":"sat","start_hour":10,"end_hour":12}]') $$,
  'P0001', 'duplicate_call_time', '같은 시간을 두 번 넣지 않는다');
select throws_ok(
  $$ select public.set_call_times('[{"days":"sat","start_hour":10,"end_hour":12},{"days":"sun","start_hour":10,"end_hour":12},{"days":"weekdays","start_hour":19,"end_hour":21},{"days":"everyday","start_hour":7,"end_hour":8}]') $$,
  'P0001', 'too_many_call_times', '3개까지');
select is((select count(*)::int from public.set_call_times('[]')), 0, '빈 배열이면 모두 지운다');

reset role;
select is((select count(*)::int from public.call_times where user_id = pg_temp.user_id('엄마')), 1, '엄마 시간은 그대로');

select * from finish();
rollback;
