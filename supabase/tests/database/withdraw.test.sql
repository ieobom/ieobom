begin;
select plan(10);

-- 3-6 탈퇴: 계정(auth.users)을 지우면 DB가 내 줄을 지우고 연결 줄은 내 칸만 비운다
select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
insert into public.exchange_questions (id, relationship_id, seq_no, sent_on, text, status, opened_at) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', 1, '2026-10-01', '좋아하는 노래는?', 'opened', now());
insert into public.answers (exchange_question_id, relationship_id, user_id, text, visible_to_partner) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '옛날 가요', true),
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '트로트', true);
insert into public.memos (user_id, relationship_id, mood, text) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'good', '자녀 메모'),
  (pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001', 'good', '엄마 메모');
insert into public.news (id, relationship_id, author_id, text) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '단풍');
insert into public.news_photos (news_id, relationship_id, file_path, thumb_path, sort) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', 'a001/f0001/1.jpg', 'a001/f0001/1_s.jpg', 1);
insert into public.inquiries (id, user_id, body) values ('00000000-0000-0000-0000-000000002001', pg_temp.user_id('자녀'), '전화가 안 울려요');

delete from auth.users where id = pg_temp.user_id('자녀');

select is((select count(*)::int from public.users where id = pg_temp.user_id('자녀')), 0, '내 사용자 줄이 지워진다');
select is((select status from public.relationships where id = '00000000-0000-0000-0000-00000000a001'), 'left', '연결은 상대 탈퇴로 남는다');
select is((select child_id from public.relationships where id = '00000000-0000-0000-0000-00000000a001'), null, '연결 줄의 내 칸만 빈다');
select is((select count(*)::int from public.memos where text = '자녀 메모'), 0, '내 메모는 지워진다');
select is((select count(*)::int from public.memos where text = '엄마 메모'), 1, '상대 메모는 남는다');
select is((select count(*)::int from public.answers where user_id is not distinct from pg_temp.user_id('자녀')), 0, '내 답은 지워진다');
select is((select count(*)::int from public.answers where text = '트로트'), 1, '상대 답은 남는다');
select is((select count(*)::int from public.news where id = '00000000-0000-0000-0000-0000000f0001'), 0, '내 근황은 지워진다');
select is((select count(*)::int from private.storage_trash where name in ('a001/f0001/1.jpg', 'a001/f0001/1_s.jpg')), 2,
  '근황 사진 파일은 지울 목록에 오른다(서버 함수가 먼저 지우고, 남으면 새벽 작업이)');
select is((select user_id from public.inquiries where id = '00000000-0000-0000-0000-000000002001'), null, '문의는 1년 보관하고 보낸 사람 칸만 빈다');

select * from finish();
rollback;
