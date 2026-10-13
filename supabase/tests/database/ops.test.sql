begin;
select plan(18);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
insert into public.notices (id, title, body, show_from, show_until) values
  ('00000000-0000-0000-0000-000000001001', '점검 안내', '새벽 2시에 점검해요', now() - interval '1 hour', now() + interval '1 day'),
  ('00000000-0000-0000-0000-000000001002', '지난 공지', '끝남', now() - interval '3 days', now() - interval '1 day');
insert into public.inquiries (id, user_id, body) values
  ('00000000-0000-0000-0000-000000002001', pg_temp.user_id('엄마'), '글자가 작아요');
insert into public.survey_questions (id, round, sort, text) values ('00000000-0000-0000-0000-000000003001', 6, 99, '시험용 문항');
insert into public.push_log (user_id, kind) values (pg_temp.user_id('자녀'), 'daily');

-- ── 로그인 전 ──
select pg_temp.logout();
select is((select count(*)::int from public.notices where id::text like '00000000-0000-0000-0000-00000000100%'), 1, '보일 때인 공지만 읽는다');
select lives_ok($$ insert into public.client_errors (kind, screen, app_version, platform) values ('render', 'home', '0.1.0', 'ios') $$,
  '앱 오류는 로그인 전에도 적는다');
select throws_ok($$ select * from public.client_errors $$, '42501', null, '앱 오류는 읽지 못한다');

-- ── 로그인 ──
select pg_temp.login('자녀');
select lives_ok($$ insert into public.notice_reads (notice_id, user_id) values ('00000000-0000-0000-0000-000000001001', pg_temp.user_id('자녀')) $$,
  '공지에 확인했어요');
select throws_ok($$ insert into public.notice_reads (notice_id, user_id) values ('00000000-0000-0000-0000-000000001001', pg_temp.user_id('엄마')) $$,
  '42501', null, '남의 이름으로 확인하지 못한다');
select lives_ok($$ insert into public.inquiries (user_id, help_item, body) values (pg_temp.user_id('자녀'), 'call', '전화가 안 울려요') $$, '문의를 보낸다');
select is((select count(*)::int from public.inquiries), 1, '내 문의만 보인다');
select throws_ok($$ insert into public.inquiries (user_id, body, answer) values (pg_temp.user_id('자녀'), '답까지', '스스로 답') $$,
  '42501', null, '답은 운영팀만 쓴다');
select throws_ok($$ update public.inquiries set answer = '바꿈' $$, '42501', null, '답을 고치지 못한다');
select is((select count(*)::int from public.survey_questions where id = '00000000-0000-0000-0000-000000003001'), 1, '설문 문항을 읽는다');
select lives_ok($$ insert into public.survey_responses (user_id, relationship_id, round, scores) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 0, '{"q1": 3}') $$, '0주차 설문을 보낸다');
select throws_ok($$ insert into public.survey_responses (user_id, relationship_id, round) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 0) $$, '23505', null, '차수마다 한 번');
select throws_ok($$ insert into public.survey_responses (user_id, relationship_id, round) values
  (pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001', 3) $$, '42501', null, '남의 이름으로 설문을 못 보낸다');
select throws_ok($$ select * from public.push_log $$, '42501', null, '알림 기록은 못 읽는다');
select throws_ok($$ select * from public.events $$, '42501', null, '이용 기록은 못 읽는다');
select throws_ok($$ select * from public.usage $$, '42501', null, '사용량은 못 읽는다');

select pg_temp.login('엄마');
select lives_ok($$ update public.inquiries set answer_seen_at = now() where id = '00000000-0000-0000-0000-000000002001' $$, '답 본 때를 적는다');
reset role;

delete from auth.users where id = pg_temp.user_id('엄마');
select is((select user_id from public.inquiries where id = '00000000-0000-0000-0000-000000002001'), null, '탈퇴하면 문의는 남고 보낸 사람 칸만 빈다');

select * from finish();
rollback;
