begin;
select plan(15);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('남');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('남'), '남', 'child');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
insert into public.relationships (id, child_id, parent_id, parent_kind, status) values
  ('00000000-0000-0000-0000-00000000a003', pg_temp.user_id('남'), null, 'mom', 'left');
insert into public.question_bank (id, text, reviewed, is_example) values
  ('00000000-0000-0000-0000-0000000b0001', '어릴 때 가장 좋아했던 반찬은 뭐예요?', true, false),
  ('00000000-0000-0000-0000-0000000b0002', '요즘 가장 자주 듣는 노래는 뭐예요?', true, true),
  ('00000000-0000-0000-0000-0000000b0003', '검토 전 질문', false, true);
insert into public.exchange_questions (id, relationship_id, seq_no, sent_on, bank_question_id, text) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', 1, '2026-10-15',
   '00000000-0000-0000-0000-0000000b0001', '어릴 때 가장 좋아했던 반찬은 뭐예요?');
insert into public.answers (exchange_question_id, relationship_id, user_id, text) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '계란말이요');
insert into public.custom_questions (relationship_id, author_id, text, send_on) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '엄마 첫 직장은 어디였어요?', '2026-10-22');

select throws_ok($$ insert into public.exchange_questions (relationship_id, seq_no, sent_on, text) values ('00000000-0000-0000-0000-00000000a001', 1, '2026-10-22', 'x') $$,
  '23505', null, '한 연결 안에서 #번호는 겹치지 않는다');
select throws_ok($$ insert into public.answers (exchange_question_id, relationship_id, user_id, text) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a003', pg_temp.user_id('남'), '끼어들기') $$,
  '23503', null, '답의 연결은 질문의 연결과 같아야 한다');
select throws_ok($$ insert into public.custom_questions (relationship_id, author_id, text, send_on) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '두 번째', '2026-10-29') $$,
  '23505', null, '기다리는 직접 만든 질문은 한 사람에 하나');

-- ── 답이 열리기 전 ──
select pg_temp.login('엄마');
select is((select count(*)::int from public.exchange_questions), 1, '두 사람은 질문을 본다');
select is((select count(*)::int from public.answers), 0, '열리기 전에는 상대 답이 0줄');
select is((select count(*)::int from public.custom_questions), 0, '상대가 만든 질문은 내용이 안 보인다');
select is((select count(*)::int from public.question_bank where id::text like '00000000-0000-0000-0000-0000000b000%'), 1, '질문 목록은 검토한 예시만 보인다');
select throws_ok($$ insert into public.answers (exchange_question_id, relationship_id, user_id, text) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '나도') $$,
  '42501', null, '답은 함수로만 보낸다');
select throws_ok($$ update public.exchange_questions set status = 'opened' $$, '42501', null, '질문 상태는 함수로만 바꾼다');

select pg_temp.login('자녀');
select is((select text from public.answers), '계란말이요', '내 답은 보인다');
select is((select count(*)::int from public.custom_questions), 1, '내가 만든 질문은 보인다');

select pg_temp.login('남');
select is((select count(*)::int from public.exchange_questions), 0, '남은 질문을 못 본다');

-- ── 둘 다 답했거나 먼저 보냄 → 보이게 됨 ──
reset role;
update public.answers set visible_to_partner = true where exchange_question_id = '00000000-0000-0000-0000-0000000e0001';
select pg_temp.login('엄마');
select is((select count(*)::int from public.answers), 1, '보이게 된 상대 답은 읽는다');
select pg_temp.login('남');
select is((select count(*)::int from public.answers), 0, '보이게 된 답도 남은 못 읽는다');

reset role;
delete from auth.users where id = pg_temp.user_id('자녀');
select is((select count(*)::int from public.answers where exchange_question_id = '00000000-0000-0000-0000-0000000e0001'), 0, '탈퇴하면 그 사람 답은 바로 지운다');

select * from finish();
rollback;
