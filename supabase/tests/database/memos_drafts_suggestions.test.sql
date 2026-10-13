begin;
select plan(13);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
insert into public.calls (id, relationship_id, caller_id, callee_id, status) values
  ('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'completed');
insert into public.memos (id, user_id, relationship_id, call_id, mood, text) values
  ('00000000-0000-0000-0000-0000000d0001', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001',
   '00000000-0000-0000-0000-0000000c0001', 'good', '엄마가 병원에 다녀오셨다');
insert into public.memo_drafts (user_id, relationship_id, call_id, status, text) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000c0001', 'ready', '엄마가 병원에 다녀오셨대요.'),
  (pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000c0001', 'off_partner', null);
insert into public.talk_suggestions (owner_id, relationship_id, source, memo_id, text, status) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'memo', '00000000-0000-0000-0000-0000000d0001', '검사 결과는 나왔어요?', 'picked');

select lives_ok($$ insert into public.memos (user_id, relationship_id, mood) values (pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001', 'okay') $$,
  '기분만 있어도 저장된다');
select throws_ok($$ insert into public.memos (user_id, relationship_id, text) values (pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001', '  ') $$,
  '23514', null, '기분도 글도 없으면 거절');
select throws_ok($$ insert into public.memo_drafts (user_id, relationship_id, call_id) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000c0001') $$,
  '23505', null, '한 통화에 한 사람 초안은 하나');
select throws_ok($$ insert into public.talk_suggestions (owner_id, relationship_id, source, text) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'memo', '나온 곳 없음') $$,
  '23514', null, '나온 곳과 가리키는 줄이 맞아야 한다');
select is((select expires_at - created_at from public.memo_drafts where status = 'ready'), interval '3 days', '초안은 3일 보관');

select pg_temp.login('엄마');
select is((select count(*)::int from public.memos), 1, '메모는 내 것만 (상대 메모 0줄)');
select is((select status from public.memo_drafts), 'off_partner', '초안도 내 것만');
select is((select count(*)::int from public.talk_suggestions), 0, '상대의 여쭤볼 이야기는 못 본다');
select throws_ok($$ insert into public.memos (user_id, relationship_id, mood) values (pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001', 'good') $$,
  '42501', null, '메모는 함수로만 쓴다');

select pg_temp.login('자녀');
select is((select count(*)::int from public.memos), 1, '내 메모는 보인다');
select is((select text from public.memo_drafts), '엄마가 병원에 다녀오셨대요.', '내 초안은 보인다');
reset role;

delete from public.memos where id = '00000000-0000-0000-0000-0000000d0001';
select is((select count(*)::int from public.talk_suggestions), 0, '메모를 지우면 그 메모로 만든 이야기도 지운다');
delete from public.calls where id = '00000000-0000-0000-0000-0000000c0001';
select is((select count(*)::int from public.memo_drafts), 0, '통화 기록을 지우면 초안도 지운다');

select * from finish();
rollback;
