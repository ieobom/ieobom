begin;
select plan(14);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('남');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('남'), '남', 'child');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
-- 주 3번(월 · 수 · 금)
insert into public.relationship_settings (relationship_id, user_id, question_freq) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), 3),
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), 3);

-- 기대값은 관리자 권한으로 미리 계산해 둔다(계산 함수는 앱이 직접 부르지 못함)
create temp table expected as
select public.next_question_day('00000000-0000-0000-0000-00000000a001', public.seoul_today()) as first_slot;
alter table expected add column second_slot date;
update expected set second_slot = public.next_question_day('00000000-0000-0000-0000-00000000a001', first_slot + 1);
grant select on expected to public;

select pg_temp.login('자녀');
select is(public.custom_question_next('00000000-0000-0000-0000-00000000a001'), (select first_slot from expected), '만들기 전에 갈 날을 미리 본다');
create temp table mine as select * from public.create_custom_question('00000000-0000-0000-0000-00000000a001', ' 엄마 첫 직장은 어디였어요? ');
select is((select text from mine), '엄마 첫 직장은 어디였어요?', '쓴 그대로(앞뒤 빈칸만 지움)');
select is((select send_on from mine), (select first_slot from expected), '다음 질문 차례에 간다');
select throws_ok($$ select public.create_custom_question('00000000-0000-0000-0000-00000000a001', '두 번째') $$, 'P0001', 'already_waiting',
  '기다리는 질문은 한 사람에 하나');

select pg_temp.login('엄마');
select is(public.custom_question_next('00000000-0000-0000-0000-00000000a001'), (select second_slot from expected), '먼저 기다리는 질문 다음 날을 미리 본다');
select is((select send_on from public.partner_custom_question('00000000-0000-0000-0000-00000000a001')), (select send_on from mine),
  '상대가 만든 질문은 날짜만 보인다');
create temp table hers as select * from public.create_custom_question('00000000-0000-0000-0000-00000000a001', '아영이 요즘 점심 뭐 먹어?');
select is((select send_on from hers), (select second_slot from expected), '먼저 만든 질문 다음 차례로');
select is((select count(*)::int from public.custom_questions), 1, '상대 질문 내용은 안 보인다');

-- 앞 질문을 지우면 뒤 질문이 한 차례 당겨진다
select pg_temp.login('자녀');
select throws_ok($$ select public.delete_custom_question((select id from hers)) $$, 'P0001', 'question_not_found', '남이 만든 질문은 못 지운다');
select public.delete_custom_question((select id from mine));
reset role;
select is((select send_on from public.custom_questions where id = (select id from hers)), (select send_on from mine), '뒤 질문이 앞당겨진다');
select is((select status from public.custom_questions where id = (select id from mine)), 'deleted', '지운 질문은 지움');

-- 오늘 질문이 이미 왔으면 다음 차례부터
insert into public.exchange_questions (relationship_id, seq_no, sent_on, text) values
  ('00000000-0000-0000-0000-00000000a001', 1, public.seoul_today(), '오늘 온 질문');
select pg_temp.login('자녀');
select ok((select send_on from public.create_custom_question('00000000-0000-0000-0000-00000000a001', '새 질문')) > public.seoul_today(),
  '오늘 질문이 이미 왔으면 오늘은 건너뛴다');

select pg_temp.login('남');
select throws_ok($$ select public.create_custom_question('00000000-0000-0000-0000-00000000a001', '끼어들기') $$, 'P0001', 'not_connected', '남은 못 만든다');

select pg_temp.login('남');
select throws_ok($$ select public.custom_question_next('00000000-0000-0000-0000-00000000a001') $$, 'P0001', 'not_connected', '남의 가족은 못 본다');
select * from finish();
rollback;
