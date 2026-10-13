begin;
select plan(22);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('아빠');
select pg_temp.make_user('새엄마');
select pg_temp.make_user('막내');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('아빠'), '이철수', 'parent'),
  (pg_temp.user_id('새엄마'), '박영희', 'parent'),
  (pg_temp.user_id('막내'), '민준', 'child');
insert into public.invites (code, inviter_id, invite_as, parent_kind, status, expires_at) values
  ('482716', pg_temp.user_id('자녀'), 'mom', 'mom', 'waiting', now() + interval '1 day'),
  ('593827', pg_temp.user_id('자녀'), 'dad', 'dad', 'waiting', now() + interval '1 day'),
  ('715284', pg_temp.user_id('엄마'), 'child', 'mom', 'waiting', now() + interval '1 day'),
  ('000000', pg_temp.user_id('자녀'), 'dad', 'dad', 'waiting', now() - interval '1 minute'),
  ('111111', pg_temp.user_id('자녀'), 'dad', 'dad', 'used', now() + interval '1 day'),
  ('222222', pg_temp.user_id('자녀'), 'dad', 'dad', 'replaced', now() + interval '1 day');

-- ── 미리 보기 ──
select pg_temp.login('엄마');
select is(public.preview_invite('482 716') ->> 'invite_as', 'mom', '띄어 써도 코드를 읽는다');
select is(public.preview_invite('482716') ->> 'inviter_name', '아영', '부모님에게는 초대한 자녀 이름이 보인다');
select is(public.preview_invite('999999') ->> 'reason', 'code_not_found', '틀린 코드');
select is(public.preview_invite('000000') ->> 'reason', 'code_expired', '48시간이 지난 코드');
select is(public.preview_invite('111111') ->> 'reason', 'code_used', '이미 쓴 코드');
select is(public.preview_invite('222222') ->> 'reason', 'code_canceled', '취소됐거나 새 코드로 바뀐 코드');
select is(public.preview_invite('715284') ->> 'reason', 'own_code', '내가 만든 코드');

select pg_temp.login('막내');
select is(public.preview_invite('715284') ->> 'inviter_name', null, '자녀에게는 부모님 이름 대신 엄마 · 아빠만');
select is(public.preview_invite('715284') ->> 'parent_kind', 'mom', '엄마의 자녀로');

-- ── 연결 ──
select pg_temp.login('엄마');
select ok((public.accept_invite('482716') ->> 'ok')::boolean, '코드를 넣으면 이어진다');
select is((select status from public.relationships where parent_id = pg_temp.user_id('엄마')), 'connected', '연결 줄이 생긴다');
select is((select count(*)::int from public.relationship_settings), 1, '내 가족별 설정 줄도 생긴다');
select is(public.preview_invite('482716') ->> 'reason', 'code_used', '쓴 코드는 다시 못 쓴다');

select pg_temp.login('새엄마');
select ok((public.accept_invite('593827') ->> 'ok')::boolean, '아빠 코드도 이을 수 있다(엄마 · 아빠는 따로)');
reset role;
-- 다른 엄마 코드를 하나 더 만들어 두고, 이미 엄마가 있으니 막히는지 본다
insert into public.invites (code, inviter_id, invite_as, parent_kind, expires_at) values
  ('333333', pg_temp.user_id('자녀'), 'mom', 'mom', now() + interval '1 day');
select pg_temp.login('아빠');
select is(public.accept_invite('333333') ->> 'reason', 'already_has_parent', '한 자녀에게 엄마는 한 분');

select pg_temp.login('막내');
select is(public.accept_invite('593827') ->> 'reason', 'code_used', '이미 쓴 아빠 코드');
select ok((public.accept_invite('715284') ->> 'ok')::boolean, '자녀로 받은 코드는 자녀로 이어진다');
select is(public.accept_invite('482716') ->> 'reason', 'code_used', '쓴 코드');

-- ── 끊겼던 쌍은 같은 줄을 되살린다 ──
reset role;
update public.relationships set status = 'ended', ended_at = now() where child_id = pg_temp.user_id('자녀') and parent_id = pg_temp.user_id('엄마');
-- 엄마는 위에서 틀린 코드를 5번 넣어 막혀 있으므로 기록을 지우고 시작한다
delete from public.code_attempts where user_id = pg_temp.user_id('엄마');
insert into public.invites (code, inviter_id, invite_as, parent_kind, expires_at) values
  ('444444', pg_temp.user_id('자녀'), 'mom', 'mom', now() + interval '1 day');
select pg_temp.login('엄마');
select public.accept_invite('444444');
reset role;
select is((select count(*)::int from public.relationships where child_id = pg_temp.user_id('자녀') and parent_id = pg_temp.user_id('엄마')), 1,
  '끊겼던 쌍은 새 줄을 만들지 않는다');
select is((select status from public.relationships where child_id = pg_temp.user_id('자녀') and parent_id = pg_temp.user_id('엄마')), 'connected',
  '같은 줄을 되살린다');

-- ── 10분에 5번 틀리면 막는다 ──
select pg_temp.login('아빠');
select public.preview_invite('900001');
select public.preview_invite('900002');
select public.preview_invite('900003');
select public.preview_invite('900004');
select public.preview_invite('900005');
select is(public.preview_invite('593827') ->> 'reason', 'too_many_attempts', '5번 틀리면 맞는 코드도 막는다');
reset role;
update public.code_attempts set attempted_at = attempted_at - interval '11 minutes' where user_id = pg_temp.user_id('아빠');
select pg_temp.login('아빠');
select is(public.preview_invite('593827') ->> 'reason', 'code_used', '10분이 지나면 다시 넣을 수 있다');

select * from finish();
rollback;
