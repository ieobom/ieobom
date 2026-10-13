begin;
select plan(17);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('남');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('남'), '남', 'child');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
insert into public.calls (id, relationship_id, caller_id, callee_id, status) values
  ('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'completed'),
  ('00000000-0000-0000-0000-0000000c0002', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'declined');
insert into public.memo_drafts (id, user_id, relationship_id, call_id, status, text) values
  ('00000000-0000-0000-0000-0000000d0001', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001',
   '00000000-0000-0000-0000-0000000c0001', 'ready', '엄마가 병원에 다녀오셨대요.'),
  ('00000000-0000-0000-0000-0000000d0002', pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001',
   '00000000-0000-0000-0000-0000000c0001', 'failed', null);

select pg_temp.login('자녀');
-- 초안 지우기 · 되돌리기
select public.discard_draft('00000000-0000-0000-0000-0000000d0001');
select is((select status from public.memo_drafts), 'discarded', '초안을 지운다');
select public.restore_draft('00000000-0000-0000-0000-0000000d0001');
select is((select status from public.memo_drafts), 'ready', '되돌리면 초안이 돌아온다');
select throws_ok($$ select public.discard_draft('00000000-0000-0000-0000-0000000d0002') $$, 'P0001', 'draft_not_found', '남의 초안은 못 지운다');

-- 초안을 고쳐 저장
create temp table m1 as select * from public.save_call_memo('00000000-0000-0000-0000-0000000c0001', 'good', ' 엄마가 병원에 다녀오셨다. ');
select is((select text from m1), '엄마가 병원에 다녀오셨다.', '고친 글로 메모가 된다');
select is((select status from public.memo_drafts), 'saved', '초안은 저장함');
select is((select memo_id from public.memo_drafts), (select id from m1), '초안이 메모를 가리킨다');
select throws_ok($$ select public.save_call_memo('00000000-0000-0000-0000-0000000c0001', 'good', '또') $$, 'P0001', 'already_saved', '한 통화에 내 메모는 하나');
select throws_ok($$ select public.save_call_memo('00000000-0000-0000-0000-0000000c0002', 'good', '거절된 통화') $$, 'P0001', 'call_not_completed',
  '실제로 연결된 통화 뒤에만');

-- 초안이 없을 때(못 만듦): 기분만 남기기
select pg_temp.login('엄마');
select is((select suggest_status from public.save_call_memo('00000000-0000-0000-0000-0000000c0001', 'okay')), 'mood_only', '기분만 있어도 저장된다');
select throws_ok($$ select public.update_memo((select id from public.memos), null, '  ') $$, 'P0001', 'empty_memo', '기분도 글도 없으면 거절');

-- 고치기 · 지우기
select pg_temp.login('자녀');
reset role;
insert into public.talk_suggestions (owner_id, relationship_id, source, memo_id, text, status) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'memo', (select id from m1), '검사 결과는?', 'candidate'),
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'memo', (select id from m1), '혼자 가셨어요?', 'picked');
select pg_temp.login('자녀');
create temp table m2 as select * from public.update_memo((select id from m1), 'good', '병원 결과는 다음 주에 나온다');
select is((select version from m2), 2, '고치면 버전을 올린다');
select is((select suggest_status from m2), 'none', '이야기 후보를 다시 만들게 둔다');
select is((select count(*)::int from public.talk_suggestions), 1, '고르지 않은 후보는 지우고 고른 이야기는 남긴다');
select pg_temp.login('남');
select throws_ok($$ select public.update_memo((select id from m1), 'good', '남이 고침') $$, 'P0001', 'memo_not_found', '남의 메모는 못 고친다');
select throws_ok($$ select public.save_call_memo('00000000-0000-0000-0000-0000000c0001', 'good', '끼어들기') $$, 'P0001', 'call_not_found', '남의 통화에는 못 쓴다');
select pg_temp.login('자녀');
select public.delete_memo((select id from m1));
select is((select count(*)::int from public.memos), 0, '메모를 지운다');
select is((select count(*)::int from public.talk_suggestions), 0, '그 메모로 만든 이야기도 지운다');

select * from finish();
rollback;
