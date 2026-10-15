begin;
select plan(13);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');

-- 시험하기 쉽게 한도를 줄인다
update public.app_config set value = '{"per_user_per_day": 2}' where key = 'ai';
update public.app_config set value = '{"minutes_per_relationship_per_day": 10}' where key = 'call_recording';

select is(public.take_quota('ai', pg_temp.user_id('자녀')), true, '첫 번째 AI 호출');
select is(public.take_quota('ai', pg_temp.user_id('자녀')), true, '두 번째');
select is(public.take_quota('ai', pg_temp.user_id('자녀')), false, '하루 2번을 넘으면 거절');
select is(public.take_quota('ai', pg_temp.user_id('엄마')), true, '사람마다 따로 센다');
select is(public.take_quota('stt_short', pg_temp.user_id('자녀'), 41), false, '짧은 말→글 기본 한도는 하루 40번');

-- 통화 녹음: 시작할 때 남았는지만 보고, 끝나면 실제 분을 더한다
select is(public.take_quota('recording_minutes', '00000000-0000-0000-0000-00000000a001', 0), true, '녹음을 시작해도 된다');
select is(public.take_quota('recording_minutes', '00000000-0000-0000-0000-00000000a001', 12, true), true, '끝난 뒤 실제 분은 넘어도 더한다');
select is(public.take_quota('recording_minutes', '00000000-0000-0000-0000-00000000a001', 0), false, '다 쓴 날은 녹음을 시작하지 않는다');

-- 한도 값이 없으면 막는다
update public.app_config set value = '{"per_user": 2}' where key = 'ai';
select is(public.take_quota('ai', pg_temp.user_id('엄마')), false, '한도 이름이 틀리면 막는다');
select throws_ok($$ select public.take_quota('photos', gen_random_uuid()) $$, 'P0001', 'invalid_quota_kind', '모르는 종류는 거절');

-- 앱은 부르지 못한다
select pg_temp.login('자녀');
select throws_ok($$ select public.take_quota('ai', pg_temp.user_id('자녀')) $$, '42501', null, '앱은 한도를 못 쓴다');
reset role;

-- 이틀 지난 기록은 지운다
insert into private.daily_quota (day, subject, kind, used) values (public.seoul_today() - 3, pg_temp.user_id('자녀'), 'ai', 5);
select public.purge_expired();
select is((select count(*)::int from private.daily_quota where day < public.seoul_today() - 2), 0, '지난 한도 기록은 지운다');
select is((select count(*)::int from private.daily_quota where day = public.seoul_today()), 3, '오늘 기록은 남는다');

select * from finish();
rollback;
