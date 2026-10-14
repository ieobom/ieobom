begin;
select plan(5);

select pg_temp.make_user('자녀');
insert into public.users (id, name, side) values (pg_temp.user_id('자녀'), '아영', 'child');
insert into storage.objects (bucket_id, name) values ('call-audio', '00000000-0000-0000-0000-0000000c0001/' || pg_temp.user_id('자녀') || '.ogg');

select is((select public from storage.buckets where id = 'call-audio'), false, '비공개 저장소');

select pg_temp.login('자녀');
select is((select count(*)::int from storage.objects where bucket_id = 'call-audio'), 0, '앱은 녹음 파일을 못 본다(내 목소리도)');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('call-audio', 'x/y.ogg') $$, '42501', null, '앱은 녹음을 못 올린다');
select throws_ok($$ delete from storage.objects where bucket_id = 'call-audio' $$, '42501', null, '앱은 녹음을 못 지운다(파일 지우기는 서버가 Storage API로)');
select pg_temp.logout();
select is((select count(*)::int from storage.objects where bucket_id = 'call-audio'), 0, '로그인 전에도 못 본다');
reset role;

select * from finish();
rollback;
