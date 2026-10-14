begin;
select plan(18);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('남');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('남'), '남', 'child');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
insert into public.exchange_questions (id, relationship_id, seq_no, sent_on, text, status) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', 1, '2026-10-15', '좋아했던 반찬은?', 'waiting'),
  ('00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000a001', 2, '2026-10-19', '요즘 듣는 노래는?', 'waiting'),
  ('00000000-0000-0000-0000-0000000e0003', '00000000-0000-0000-0000-00000000a001', 3, '2026-10-22', '지난 질문', 'closed');

-- ── 답 보내기 · 열기 ──
select pg_temp.login('자녀');
select is(public.submit_answer('00000000-0000-0000-0000-0000000e0001', '  계란말이요 ') ->> 'opened', 'false', '혼자 답하면 아직 안 열림');
select is((select text from public.answers), '계란말이요', '앞뒤 빈칸을 지우고 저장');
select throws_ok($$ select public.submit_answer('00000000-0000-0000-0000-0000000e0001', '또') $$, 'P0001', 'already_answered', '한 질문에 답은 하나');
select throws_ok($$ select public.submit_answer('00000000-0000-0000-0000-0000000e0003', '늦은 답') $$, 'P0001', 'question_closed', '끝난 질문에는 답하지 못한다');

select pg_temp.login('엄마');
select is((select count(*)::int from public.answers), 0, '열리기 전에는 상대 답 0줄');
select is(public.submit_answer('00000000-0000-0000-0000-0000000e0001', '고구마 줄기', 'voice') ->> 'opened', 'true', '둘 다 답하면 열림');
select is((select count(*)::int from public.answers), 2, '열리면 상대 답이 보인다');
select is((select status from public.exchange_questions where id = '00000000-0000-0000-0000-0000000e0001'), 'opened', '질문은 답 열림');

select pg_temp.login('남');
select throws_ok($$ select public.submit_answer('00000000-0000-0000-0000-0000000e0002', '끼어들기') $$, 'P0001', 'not_connected', '남은 답하지 못한다');

-- ── 먼저 보내기 · 나만 보고 끝내기 ──
select pg_temp.login('자녀');
select public.submit_answer('00000000-0000-0000-0000-0000000e0002', '옛날 가요');
select public.mark_early_asked('00000000-0000-0000-0000-0000000e0002');
select public.choose_early('00000000-0000-0000-0000-0000000e0002', 'keep');
select pg_temp.login('엄마');
select is((select count(*)::int from public.answers where exchange_question_id = '00000000-0000-0000-0000-0000000e0002'), 0,
  '나만 보고 끝내면 상대는 모른다');
select pg_temp.login('자녀');
select throws_ok($$ select public.choose_early('00000000-0000-0000-0000-0000000e0002', 'send') $$, 'P0001', 'answer_not_found', '한 번 고르면 다시 못 고른다');
reset role;
update public.answers set early_choice = null, early_chosen_at = null where exchange_question_id = '00000000-0000-0000-0000-0000000e0002';
select pg_temp.login('자녀');
select public.choose_early('00000000-0000-0000-0000-0000000e0002', 'send');
reset role;
select isnt((select early_asked_at from public.answers where exchange_question_id = '00000000-0000-0000-0000-0000000e0002'), null, '물은 때를 남긴다');
select pg_temp.login('엄마');
select is((select text from public.answers where exchange_question_id = '00000000-0000-0000-0000-0000000e0002'), '옛날 가요', '먼저 보내면 상대가 본다');
select throws_ok($$ select public.choose_early('00000000-0000-0000-0000-0000000e0002', 'send') $$, 'P0001', 'answer_not_found', '답하지 않은 사람은 먼저 보낼 것이 없다');
select is(public.submit_answer('00000000-0000-0000-0000-0000000e0002', '트로트') ->> 'opened', 'true', '먼저 온 답에 답하면 열림');
select throws_ok($$ select public.choose_early('00000000-0000-0000-0000-0000000e0002', 'keep') $$, 'P0001', 'already_opened', '열린 뒤에는 고르지 않는다');

-- ── 확인했어요 ──
select public.see_question('00000000-0000-0000-0000-0000000e0001');
reset role;
select ok((select parent_seen_at is not null and child_seen_at is null from public.exchange_questions where id = '00000000-0000-0000-0000-0000000e0001'),
  '확인한 사람 쪽만 적는다');
select pg_temp.login('남');
select throws_ok($$ select public.see_question('00000000-0000-0000-0000-0000000e0001') $$, 'P0001', 'not_member', '남은 확인하지 못한다');

select * from finish();
rollback;
