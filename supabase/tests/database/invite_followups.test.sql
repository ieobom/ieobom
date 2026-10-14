begin;
select plan(9);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('다른엄마');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('다른엄마'), '박영희', 'parent');
-- 아영이가 엄마로 코드를 만들어 두었는데, 엄마가 보낸 자녀용 코드로 먼저 이어진다
insert into public.invites (id, code, inviter_id, invite_as, parent_kind, expires_at) values
  ('00000000-0000-0000-0000-000000007001', '374159', pg_temp.user_id('자녀'), 'mom', 'mom', now() + interval '1 day'),
  ('00000000-0000-0000-0000-000000007002', '715284', pg_temp.user_id('엄마'), 'child', 'mom', now() + interval '1 day');

select pg_temp.login('자녀');
select ok((public.accept_invite('715284') ->> 'ok')::boolean, '엄마가 보낸 코드로 이어진다');
reset role;
select is((select status from public.invites where id = '00000000-0000-0000-0000-000000007001'), 'replaced',
  '이어지면 아영이가 엄마로 기다리게 해 둔 코드는 새 코드로 바뀜');

-- 남은 코드가 있었더라도(예: 정리 전 코드) 다른 엄마는 못 들어온다. 문구용 값이 온다
update public.invites set status = 'waiting' where id = '00000000-0000-0000-0000-000000007001';
select pg_temp.login('다른엄마');
create temp table r1 as select public.preview_invite('374159') as r;
select is((select r ->> 'reason' from r1), 'already_has_parent', '그 자녀에게 이미 엄마가 있다');
select is((select r ->> 'child_name' from r1), '아영', '''아영이에게는 이미 엄마가 이어져 있어요''의 이름');
select is((select r ->> 'parent_kind' from r1), 'mom', '엄마인지 아빠인지');

-- 같은 두 사람이 다시 넣으면 '이미 이어져 있어요'
select pg_temp.login('엄마');
select is((select r ->> 'reason' from (select public.preview_invite('374159') as r) x), 'already_connected', '같은 두 사람');
select is((select r ->> 'child_name' from (select public.preview_invite('374159') as r) x), '아영', '부모님에게는 ''아영이와는''');

-- 이미 만든 질문 고치기
select public.create_custom_question((select id from public.relationships where child_id = pg_temp.user_id('자녀')), '처음 쓴 질문');
select is((select text from public.update_custom_question((select id from public.custom_questions where text = '처음 쓴 질문'), ' 고친 질문 ')),
  '고친 질문', '보내기 전에는 고친다');
select pg_temp.login('자녀');
select throws_ok($$ select public.update_custom_question((select id from public.custom_questions where author_id = pg_temp.user_id('엄마')), '남이 고침') $$,
  'P0001', 'question_not_found', '남이 만든 질문은 못 고친다');

select * from finish();
rollback;
