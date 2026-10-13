begin;
select plan(10);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('남');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('남'), '남', 'child');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
-- 자녀: 평일 19~22시, 토 10~12시 / 엄마: 매일 20~23시, 토 9~11시
insert into public.call_times (user_id, days, start_hour, end_hour) values
  (pg_temp.user_id('자녀'), 'weekdays', 19, 22),
  (pg_temp.user_id('자녀'), 'sat', 10, 12),
  (pg_temp.user_id('엄마'), 'everyday', 20, 23),
  (pg_temp.user_id('엄마'), 'sat', 9, 11);

select is(public.call_days('weekdays'), array[1, 2, 3, 4, 5], '평일은 월~금');

select pg_temp.login('자녀');
-- 2026-10-14(수) 20:30 한국 시간: 둘 다 편함(20~22시)
select ok((select free_now from public.call_time_overlap('00000000-0000-0000-0000-00000000a001', '2026-10-14 20:30+09')), '평일 저녁 겹침');
select is((select next_ends_at from public.call_time_overlap('00000000-0000-0000-0000-00000000a001', '2026-10-14 20:30+09')),
  '2026-10-14 22:00+09'::timestamptz, '지금 겹치는 시간이 끝나는 때');
-- 수 19:30: 엄마가 아직 아님, 다음은 20시
select ok(not (select free_now from public.call_time_overlap('00000000-0000-0000-0000-00000000a001', '2026-10-14 19:30+09')), '한 사람만 편하면 아님');
select is((select next_starts_at from public.call_time_overlap('00000000-0000-0000-0000-00000000a001', '2026-10-14 19:30+09')),
  '2026-10-14 20:00+09'::timestamptz, '다음 겹치는 시간은 오늘 20시');
-- 수 23:30(자정 넘김): 다음은 목 20시
select is((select next_starts_at from public.call_time_overlap('00000000-0000-0000-0000-00000000a001', '2026-10-14 23:30+09')),
  '2026-10-15 20:00+09'::timestamptz, '밤늦게는 다음 날로 넘어간다');
-- 금 22:30(요일 경계): 토 10~11시(자녀 토 10~12 · 엄마 토 9~11)
select is((select next_starts_at from public.call_time_overlap('00000000-0000-0000-0000-00000000a001', '2026-10-16 22:30+09')),
  '2026-10-17 10:00+09'::timestamptz, '금요일 밤 다음은 토요일 오전');
-- 토 13시: 토 저녁은 자녀가 평일만이라 안 겹침 → 다음은 월 20시
select is((select next_starts_at from public.call_time_overlap('00000000-0000-0000-0000-00000000a001', '2026-10-17 13:00+09')),
  '2026-10-19 20:00+09'::timestamptz, '주말을 건너 월요일');

reset role;
delete from public.call_times where user_id = pg_temp.user_id('엄마');
select pg_temp.login('자녀');
select is((select next_starts_at from public.call_time_overlap('00000000-0000-0000-0000-00000000a001', '2026-10-14 20:30+09')),
  null, '한 사람이라도 시간이 없으면 겹치는 시간 없음');

select pg_temp.login('남');
select throws_ok($$ select * from public.call_time_overlap('00000000-0000-0000-0000-00000000a001') $$, 'P0001', 'not_member', '남은 못 본다');

select * from finish();
rollback;
