begin;
select plan(12);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
insert into public.relationship_settings (relationship_id, user_id, question_freq) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), 3),
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), 2);

select is(public.question_days(1), array[4], '주 1번은 목요일');
select is(public.question_days(3), array[1, 3, 5], '주 3번은 월 · 수 · 금');
select is(public.relationship_freq('00000000-0000-0000-0000-00000000a001', '2026-10-14'), 2, '두 사람 중 적은 쪽(3과 2 → 2)');
-- 2026-10-14는 수요일. 주 2번(월 · 목)이면 다음은 목 10-15
select is(public.next_question_day('00000000-0000-0000-0000-00000000a001', '2026-10-14'), '2026-10-15'::date, '수요일 다음 질문은 목요일');
select is(public.next_question_day('00000000-0000-0000-0000-00000000a001', '2026-10-15'), '2026-10-15'::date, '그날이 질문 날이면 그날');
select is(public.next_question_day('00000000-0000-0000-0000-00000000a001', '2026-10-16'), '2026-10-19'::date, '금요일 다음은 월요일');

-- 엄마가 주 1번으로 바꾸면 다음 주 월요일부터
select pg_temp.login('엄마');
select is((select next_freq from public.set_question_freq('00000000-0000-0000-0000-00000000a001', 1)), 1, '바꾼 횟수는 따로 둔다');
reset role;
select is((select next_freq_from from public.relationship_settings where user_id = pg_temp.user_id('엄마')),
  date_trunc('week', public.seoul_today())::date + 7, '다음 주 월요일부터');
update public.relationship_settings set next_freq_from = '2026-10-19' where user_id = pg_temp.user_id('엄마');
select is(public.relationship_freq('00000000-0000-0000-0000-00000000a001', '2026-10-15'), 2, '적용일 전에는 전 횟수');
select is(public.next_question_day('00000000-0000-0000-0000-00000000a001', '2026-10-16'), '2026-10-22'::date, '적용일부터 주 1번(목)');

select pg_temp.login('엄마');
select is((select next_freq from public.set_question_freq('00000000-0000-0000-0000-00000000a001', 2)), null, '원래 횟수로 되돌리면 바꾼 횟수는 비운다');
select throws_ok($$ select public.set_question_freq('00000000-0000-0000-0000-00000000a001', 4) $$, 'P0001', 'invalid_freq', '1~3번만');

select * from finish();
rollback;
