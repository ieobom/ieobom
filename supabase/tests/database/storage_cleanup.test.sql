begin;
select plan(12);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
insert into public.calls (id, relationship_id, caller_id, callee_id, status, started_at) values
  ('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'completed', now() - interval '4 days');

-- 녹음: 2시간 전 것은 지우고, 방금 것은 아직 글로 바꾸는 중이라 둔다
insert into storage.objects (bucket_id, name, created_at) values
  ('call-audio', '00000000-0000-0000-0000-0000000c0001/old.ogg', now() - interval '2 hours'),
  ('call-audio', '00000000-0000-0000-0000-0000000c0001/new.ogg', now() - interval '10 minutes');

-- 사진: 근황이 있는 것 · 근황 없이 이틀 된 것(올리다 만 것) · 근황 없이 방금 올린 것(보내는 중)
insert into public.news (id, relationship_id, author_id, text) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '단풍');
insert into public.news_photos (news_id, relationship_id, file_path, thumb_path, sort) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', 'a001/f0001/1.jpg', 'a001/f0001/1_s.jpg', 1);
insert into storage.objects (bucket_id, name, created_at) values
  ('news-photos', 'a001/f0001/1.jpg', now() - interval '3 days'),
  ('news-photos', 'a001/f0001/1_s.jpg', now() - interval '3 days'),
  ('news-photos', 'a001/f0009/1.jpg', now() - interval '2 days'),
  ('news-photos', 'a001/f0010/1.jpg', now() - interval '5 minutes');

-- 초안: 3일 지난 것 · 저장한 것 · 아직 기한 안 된 것
insert into public.calls (id, relationship_id, caller_id, callee_id, status, started_at) values
  ('00000000-0000-0000-0000-0000000c0002', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'completed', now() - interval '1 day');
insert into public.memo_drafts (id, user_id, relationship_id, call_id, status, text, expires_at) values
  ('00000000-0000-0000-0000-0000000d0001', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000c0001', 'ready', '지난 초안', now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000d0002', pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000c0001', 'saved', null, now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000d0003', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000c0002', 'ready', '새 초안', now() + interval '2 days');

create temp table t1 as select public.storage_cleanup_targets() as t;
select is((select t -> 'call_audio' from t1), '["00000000-0000-0000-0000-0000000c0001/old.ogg"]'::jsonb, '1시간 넘게 남은 녹음만');
select is((select t -> 'news_photos' from t1), '["a001/f0009/1.jpg"]'::jsonb, '근황 없이 하루 넘게 남은 사진만');

-- 근황을 지우면 그 사진이 바로 지울 목록에 오른다
select pg_temp.login('엄마');
select public.delete_news('00000000-0000-0000-0000-0000000f0001');
reset role;
select is((select jsonb_agg(x order by x collate "C") from jsonb_array_elements_text(public.storage_cleanup_targets() -> 'news_photos') x),
  '["a001/f0001/1.jpg", "a001/f0001/1_s.jpg", "a001/f0009/1.jpg"]'::jsonb, '지운 근황의 사진(작은 그림 포함)');
select is(public.storage_cleanup_done('news-photos', array['a001/f0001/1.jpg', 'a001/f0001/1_s.jpg']), 2, '지운 뒤 목록에서 뺀다');
select is((select count(*)::int from private.storage_trash), 0, '지울 목록이 빈다');

-- 앱은 부르지 못한다
select pg_temp.login('자녀');
select throws_ok($$ select public.storage_cleanup_targets() $$, '42501', null, '앱은 지울 목록을 못 본다');
select throws_ok($$ select public.storage_cleanup_done('news-photos', '{}') $$, '42501', null, '앱은 목록을 못 비운다');
reset role;

-- 정해진 시간 작업
select is((select count(*)::int from cron.job where jobname = 'storage-cleanup' and schedule = '30 19 * * *'), 1, '새벽 4시 30분(한국) 작업이 있다');
select is(private.call_function('jobs', '{"job": "storage_cleanup"}') is not null,
  (select count(*) = 2 from vault.decrypted_secrets where name in ('project_url', 'cron_key')), '금고에 주소 · 열쇠가 있을 때만 부른다');

select public.purge_expired();
select is((select count(*)::int from public.memo_drafts where id = '00000000-0000-0000-0000-0000000d0001'), 0, '3일 지난 초안은 지운다');
select is((select count(*)::int from public.memo_drafts where id = '00000000-0000-0000-0000-0000000d0002'), 1, '저장한 초안 줄은 남긴다');
select is((select count(*)::int from public.memo_drafts where id = '00000000-0000-0000-0000-0000000d0003'), 1, '기한 안 된 초안은 남긴다');

select * from finish();
rollback;
