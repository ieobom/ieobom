begin;
select plan(14);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('아빠');
select pg_temp.make_user('남');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('아빠'), '이철수', 'parent'),
  (pg_temp.user_id('남'), '남', 'child');
insert into public.relationships (id, child_id, parent_id, parent_kind, status) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom', 'connected'),
  ('00000000-0000-0000-0000-00000000a002', pg_temp.user_id('자녀'), pg_temp.user_id('아빠'), 'dad', 'ended');
insert into public.news (id, relationship_id, author_id, text, topic, topic_by) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '뒷산에 단풍이 들었어', '다녀온 곳', 'chip');
insert into public.news_photos (news_id, relationship_id, file_path, thumb_path, sort) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001',
   '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-0000000f0001/1.jpg',
   '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-0000000f0001/1_s.jpg', 1);
insert into public.talk_suggestions (owner_id, relationship_id, source, news_id, text, status) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'news', '00000000-0000-0000-0000-0000000f0001', '단풍 구경 가셨어요?', 'picked');
insert into storage.objects (bucket_id, name) values
  ('news-photos', '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-0000000f0001/1.jpg');

select throws_ok($$ insert into public.news (relationship_id, author_id, topic, topic_by) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '열세 글자가 넘는 주제 이름입니다', 'custom') $$, '23514', null, '직접 쓴 주제는 12자까지');
select throws_ok($$ insert into public.news_photos (news_id, relationship_id, file_path, thumb_path, sort) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', 'a/b/4.jpg', 'a/b/4_s.jpg', 4) $$, '23514', null, '사진은 3장까지');
select throws_ok($$ insert into public.news_photos (news_id, relationship_id, file_path, thumb_path, sort) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a002', 'a/b/2.jpg', 'a/b/2_s.jpg', 2) $$, '23503', null, '사진의 연결은 근황의 연결과 같아야 한다');

select pg_temp.login('자녀');
select is((select count(*)::int from public.news), 1, '두 사람은 근황을 본다');
select is((select count(*)::int from public.news_photos), 1, '두 사람은 사진 줄을 본다');
select is((select count(*)::int from storage.objects where bucket_id = 'news-photos'), 1, '두 사람은 사진 파일을 받는다');
select throws_ok($$ insert into public.news (relationship_id, author_id, text) values ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '바로 쓰기') $$,
  '42501', null, '근황은 함수로만 쓴다');
select lives_ok($$ insert into storage.objects (bucket_id, name) values
  ('news-photos', '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-0000000f0002/1.jpg') $$, '이어진 연결 경로에는 올린다');
select throws_ok($$ insert into storage.objects (bucket_id, name) values
  ('news-photos', '00000000-0000-0000-0000-00000000a002/00000000-0000-0000-0000-0000000f0003/1.jpg') $$, '42501', null, '끊긴 연결 경로에는 못 올린다');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('news-photos', '아무거나/1.jpg') $$, '42501', null, '연결 ID가 아닌 경로는 거절');

select pg_temp.login('남');
select is((select count(*)::int from public.news), 0, '남은 근황을 못 본다');
select is((select count(*)::int from storage.objects where bucket_id = 'news-photos'), 0, '남은 사진 파일을 못 받는다');
select throws_ok($$ insert into storage.objects (bucket_id, name) values
  ('news-photos', '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-0000000f0004/1.jpg') $$, '42501', null, '남의 연결 경로에는 못 올린다');
reset role;

delete from public.news where id = '00000000-0000-0000-0000-0000000f0001';
select is((select count(*)::int from public.talk_suggestions where relationship_id = '00000000-0000-0000-0000-00000000a001')
  + (select count(*)::int from public.news_photos where relationship_id = '00000000-0000-0000-0000-00000000a001'), 0,
  '근황을 지우면 사진 줄과 그 근황으로 만든 이야기도 지운다');

select * from finish();
rollback;
