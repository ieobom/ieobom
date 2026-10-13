begin;
select plan(11);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('남');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('남'), '남', 'child');
insert into public.relationships (id, child_id, parent_id, parent_kind) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom');
insert into public.memos (id, user_id, relationship_id, mood, text, created_at) values
  ('00000000-0000-0000-0000-0000000d0001', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'good', '내 메모', '2026-10-12 21:00+09'),
  ('00000000-0000-0000-0000-0000000d0002', pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001', 'good', '엄마 메모', '2026-10-13 21:00+09');
insert into public.exchange_questions (id, relationship_id, seq_no, sent_on, text, status) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', 1, '2026-10-08', '지난 질문', 'closed'),
  ('00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000a001', 2, '2026-10-12', '요즘 듣는 노래는?', 'waiting');
insert into public.answers (exchange_question_id, relationship_id, user_id, text, visible_to_partner) values
  ('00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '트로트', false);
insert into public.news (id, relationship_id, author_id, text, created_at) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '단풍', '2026-10-10 15:00+09');
insert into public.news_photos (news_id, relationship_id, file_path, thumb_path, sort) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', 'r/n/1.jpg', 'r/n/1_s.jpg', 1);

select pg_temp.login('자녀');
create temp table all_items as select jsonb_array_elements(public.records('00000000-0000-0000-0000-00000000a001')) as i;
select is((select array_agg(i ->> 'kind') from all_items), array['memo', 'question', 'news', 'question'], '날짜순(최근 것부터), 상대 메모는 없다');
select is((select i ->> 'partner_answer' from all_items where i ->> 'id' = '00000000-0000-0000-0000-0000000e0002'), null, '열리기 전 상대 답은 안 담는다');
select is((select i -> 'photos' -> 0 ->> 'thumb' from all_items where i ->> 'kind' = 'news'), 'r/n/1_s.jpg', '근황은 작은 그림 경로를 담는다');
select is((select (i ->> 'mine')::boolean from all_items where i ->> 'kind' = 'news'), false, '누가 쓴 근황인지');

-- 종류 거르기 · 이어 불러오기
select is(jsonb_array_length(public.records('00000000-0000-0000-0000-00000000a001', 'question')), 2, '질문만 거른다(지난 질문 보기)');
create temp table page1 as select public.records('00000000-0000-0000-0000-00000000a001', null, null, null, 2) as p;
select is(jsonb_array_length((select p from page1)), 2, '한 번에 정한 수만큼');
select is(
  (select array_agg(i ->> 'kind') from jsonb_array_elements(public.records('00000000-0000-0000-0000-00000000a001', null,
    ((select p from page1) -> 1 ->> 'at')::timestamptz, ((select p from page1) -> 1 ->> 'id')::uuid, 2)) as i),
  array['news', 'question'], '마지막 항목 다음부터 이어 불러온다');

-- 달력
select is(public.record_calendar('00000000-0000-0000-0000-00000000a001', '2026-10-01') -> '2026-10-12',
  '["memo", "question"]'::jsonb, '그날 있는 종류');
select is(public.record_calendar('00000000-0000-0000-0000-00000000a001', '2026-10-01') -> '2026-10-13', null, '상대 메모는 달력에도 없다');
select is(public.record_calendar('00000000-0000-0000-0000-00000000a001', '2026-11-01'), '{}'::jsonb, '다른 달은 비어 있다');

select pg_temp.login('남');
select throws_ok($$ select public.records('00000000-0000-0000-0000-00000000a001') $$, 'P0001', 'not_member', '남은 못 본다');

select * from finish();
rollback;
