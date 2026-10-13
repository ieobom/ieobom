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
-- 엄마가 사진 2장(+작은 그림)을 올려 둔 상태
insert into storage.objects (bucket_id, name) values
  ('news-photos', '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-0000000f0001/1.jpg'),
  ('news-photos', '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-0000000f0001/1_s.jpg'),
  ('news-photos', '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-0000000f0001/2.jpg'),
  ('news-photos', '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-0000000f0001/2_s.jpg');

select pg_temp.login('엄마');
select throws_ok($$ select public.create_news('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', '', null, null, 'text', 2) $$,
  'P0001', 'topic_required', '사진만 보낼 때는 주제를 고른다');
select throws_ok($$ select public.create_news('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', '단풍', null, null, 'text', 3) $$,
  'P0001', 'photos_not_uploaded', '올리지 않은 사진은 거절');
select throws_ok($$ select public.create_news('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', '단풍', '등산', 'chip') $$,
  'P0001', 'invalid_topic', '칩 주제는 목록에서만');
select throws_ok($$ select public.create_news('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001') $$,
  'P0001', 'empty_news', '글도 사진도 없으면 거절');
create temp table n1 as select * from public.create_news('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001',
  ' 뒷산에 단풍이 들었어 ', '다녀온 곳', 'chip', 'voice', 2);
select is((select text from n1), '뒷산에 단풍이 들었어', '근황을 남긴다');
select is((select count(*)::int from public.news_photos), 2, '사진 줄도 남긴다');
select is((select thumb_path from public.news_photos where sort = 2),
  '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-0000000f0001/2_s.jpg', '작은 그림 경로');
select lives_ok($$ select public.create_news(gen_random_uuid(), '00000000-0000-0000-0000-00000000a001', '이사해요', '이사', 'custom') $$,
  '직접 쓴 주제');

-- 사진 기능을 끄면 사진은 못 보낸다
reset role;
update public.app_config set enabled = false where key = 'news_photos';
select pg_temp.login('엄마');
select throws_ok($$ select public.create_news(gen_random_uuid(), '00000000-0000-0000-0000-00000000a001', '사진', null, null, 'text', 1) $$,
  'P0001', 'photos_disabled', '사진 기능이 꺼지면 사진은 거절');

-- 확인했어요 · 지우기
select pg_temp.login('자녀');
select public.see_news((select id from n1));
reset role;
select isnt((select seen_at from public.news where id = (select id from n1)), null, '받은 사람이 확인했어요');
select pg_temp.login('자녀');
select throws_ok($$ select public.delete_news((select id from n1)) $$, 'P0001', 'news_not_found', '받은 사람은 못 지운다');
select pg_temp.login('엄마');
select public.delete_news((select id from n1));
select is((select count(*)::int from public.news where id = (select id from n1)), 0, '쓴 사람이 지우면 두 화면에서 사라진다');
select is((select count(*)::int from public.news_photos), 0, '사진 줄도 함께 지운다');
reset role;
select is((select count(*)::int from storage.objects where name like '00000000-0000-0000-0000-00000000a001/%'), 4, '파일은 정리 작업(9-6)이 지운다');

select pg_temp.login('남');
select throws_ok($$ select public.create_news(gen_random_uuid(), '00000000-0000-0000-0000-00000000a001', '끼어들기') $$, 'P0001', 'not_connected', '남은 못 남긴다');

select * from finish();
rollback;
