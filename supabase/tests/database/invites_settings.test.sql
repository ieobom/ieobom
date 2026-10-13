begin;
select plan(14);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('아빠');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('아빠'), '이철수', 'parent');
insert into public.relationships (id, child_id, parent_id, parent_kind, status) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom', 'connected'),
  ('00000000-0000-0000-0000-00000000a002', pg_temp.user_id('자녀'), pg_temp.user_id('아빠'), 'dad', 'ended');
insert into public.relationship_settings (relationship_id, user_id) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀')),
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마')),
  ('00000000-0000-0000-0000-00000000a002', pg_temp.user_id('자녀'));
insert into public.invites (code, inviter_id, invite_as, status) values
  ('482716', pg_temp.user_id('자녀'), 'mom', 'used'),
  ('482716', pg_temp.user_id('자녀'), 'dad', 'waiting'),
  ('593827', pg_temp.user_id('엄마'), 'child', 'waiting');

-- ── 초대 코드 ──
select throws_ok($$ insert into public.invites (code, inviter_id, invite_as) values ('482716', pg_temp.user_id('엄마'), 'child') $$,
  '23505', null, '기다리는 코드끼리는 겹치지 않는다');
select throws_ok($$ insert into public.invites (code, inviter_id, invite_as) values ('12a456', pg_temp.user_id('엄마'), 'child') $$,
  '23514', null, '코드는 숫자 6자리');
select is((select expires_at - created_at from public.invites where code = '593827'), interval '48 hours', '코드는 48시간');

select pg_temp.login('자녀');
select is((select count(*)::int from public.invites), 2, '내가 만든 코드만 보인다');
select throws_ok($$ insert into public.invites (code, inviter_id, invite_as) values ('111111', pg_temp.user_id('자녀'), 'mom') $$,
  '42501', null, '코드는 함수로만 만든다');
select throws_ok($$ select * from public.code_attempts $$, '42501', null, '틀린 횟수는 앱이 못 읽는다');

-- ── 가족별 내 설정 ──
select is((select count(*)::int from public.relationship_settings), 2, '내 설정만 보인다');
select lives_ok($$ update public.relationship_settings set avoid_topics = '{건강,종교}', curious_topics = '{먹은 것}'
  where relationship_id = '00000000-0000-0000-0000-00000000a001' and user_id = pg_temp.user_id('자녀') $$, '주제는 바로 고친다');
select throws_ok($$ update public.relationship_settings set avoid_topics = '{아무거나}' where user_id = pg_temp.user_id('자녀') $$,
  '23514', null, '목록에 없는 주제는 거절');
select throws_ok($$ update public.relationship_settings set question_freq = 3 where user_id = pg_temp.user_id('자녀') $$,
  '42501', null, '질문 횟수는 함수로만 바꾼다');
select is_empty($$ update public.relationship_settings set avoid_topics = '{}' where user_id = pg_temp.user_id('엄마') returning 1 $$,
  '상대 설정은 못 고친다');
select is_empty($$ update public.relationship_settings set avoid_topics = '{건강}' where relationship_id = '00000000-0000-0000-0000-00000000a002' returning 1 $$,
  '끊긴 가족의 설정은 못 고친다');

select pg_temp.login('엄마');
select is((select avoid_topics from public.relationship_settings), '{}'::text[], '상대가 고른 주제는 내 쪽에 안 보인다');
select is((select count(*)::int from public.invites), 1, '엄마도 자기 코드만 본다');

select * from finish();
rollback;
