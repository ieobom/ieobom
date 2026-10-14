begin;
select plan(17);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');
select pg_temp.make_user('남');
insert into public.users (id, name, side) values
  (pg_temp.user_id('자녀'), '아영', 'child'),
  (pg_temp.user_id('엄마'), '김순자', 'parent'),
  (pg_temp.user_id('남'), '남', 'child');
insert into public.relationships (id, child_id, parent_id, parent_kind, connected_at) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), pg_temp.user_id('엄마'), 'mom', '2026-09-20 10:00+09');
insert into public.relationship_settings (relationship_id, user_id, curious_topics) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '{다녀온 곳}');
insert into public.memos (id, user_id, relationship_id, mood, text, created_at) values
  ('00000000-0000-0000-0000-0000000d0001', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'good', '내 메모', '2026-10-12 21:00+09'),
  ('00000000-0000-0000-0000-0000000d0002', pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001', 'good', '엄마 메모', '2026-10-13 21:00+09');
insert into public.custom_questions (id, relationship_id, author_id, text, send_on, status) values
  ('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '엄마가 만든 질문', '2026-10-01', 'sent');
insert into public.exchange_questions (id, relationship_id, seq_no, sent_on, text, status, opened_at, custom_question_id) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', 1, '2026-10-01', '엄마가 만든 질문', 'closed', '2026-10-02 10:00+09', '00000000-0000-0000-0000-0000000c0001'),
  ('00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000a001', 2, '2026-10-05', '내 답만 남은 질문', 'closed', null, null),
  ('00000000-0000-0000-0000-0000000e0003', '00000000-0000-0000-0000-00000000a001', 3, '2026-10-08', '먼저 온 답', 'closed', null, null),
  ('00000000-0000-0000-0000-0000000e0004', '00000000-0000-0000-0000-00000000a001', 4, '2026-10-12', '지금 질문', 'waiting', null, null),
  ('00000000-0000-0000-0000-0000000e0005', '00000000-0000-0000-0000-00000000a001', 5, '2026-09-28', '아무도 안 답함', 'closed', null, null);
insert into public.answers (exchange_question_id, relationship_id, user_id, text, visible_to_partner, early_choice) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '내 답 1', true, null),
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '엄마 답 1', true, null),
  ('00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '내 답 2', false, 'keep'),
  ('00000000-0000-0000-0000-0000000e0003', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '엄마 먼저', true, 'send'),
  ('00000000-0000-0000-0000-0000000e0004', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '진행 중 답', false, null);
insert into public.news (id, relationship_id, author_id, text, topic, topic_by, created_at) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '단풍', '다녀온 곳', 'chip', '2026-10-10 15:00+09');
insert into public.news_photos (news_id, relationship_id, file_path, thumb_path, sort) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', 'r/n/1.jpg', 'r/n/1_s.jpg', 1);
insert into public.talk_suggestions (owner_id, relationship_id, source, memo_id, text, status, asked_on) values
  (pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'memo', '00000000-0000-0000-0000-0000000d0001', '검사 결과는요?', 'picked', '2026-10-13');

select pg_temp.login('자녀');
create temp table all_items as select jsonb_array_elements(public.records('00000000-0000-0000-0000-00000000a001')) as i;
select is((select array_agg(i ->> 'kind' || ':' || coalesce(i ->> 'status', '')) from all_items),
  array['memo:', 'news:', 'question:their_first', 'question:mine_only', 'question:both'], '끝났거나 둘 다 답한 질문만, 최근 것부터(진행 중 · 아무도 안 답한 질문은 없음)');
select is((select i ->> 'made_by' from all_items where i ->> 'id' = '00000000-0000-0000-0000-0000000e0001'), 'partner', '엄마가 만든 질문');
select is((select i ->> 'partner_answer' from all_items where i ->> 'id' = '00000000-0000-0000-0000-0000000e0003'), '엄마 먼저', '먼저 온 답은 상대 답이 보인다');
select is((select i ->> 'partner_answer' from all_items where i ->> 'id' = '00000000-0000-0000-0000-0000000e0002'), null, '내 답만 남은 질문에 상대 답은 없다');
select is((select i -> 'talk' ->> 'asked_on' from all_items where i ->> 'kind' = 'memo'), '2026-10-13', '메모로 만든 여쭤볼 이야기와 여쭤본 날');
select ok((select (i ->> 'curious')::boolean from all_items where i ->> 'kind' = 'news'), '내가 궁금해한 주제의 근황');
select is((select i -> 'photos' -> 0 ->> 'thumb' from all_items where i ->> 'kind' = 'news'), 'r/n/1_s.jpg', '근황은 작은 그림 경로를 담는다');

select is(jsonb_array_length(public.records('00000000-0000-0000-0000-00000000a001', 'question')), 3, '질문만 거른다(지난 질문 보기)');
select is((select array_agg(i ->> 'kind') from jsonb_array_elements(public.records('00000000-0000-0000-0000-00000000a001', null, null, null, 20, '2026-10-12')) i),
  array['memo'], '그날 기록만(달력에서 고른 날)');
create temp table page1 as select public.records('00000000-0000-0000-0000-00000000a001', null, null, null, 2) as p;
select is(
  (select array_agg(i ->> 'kind') from jsonb_array_elements(public.records('00000000-0000-0000-0000-00000000a001', null,
    ((select p from page1) -> 1 ->> 'at')::timestamptz, ((select p from page1) -> 1 ->> 'id')::uuid, 2)) as i),
  array['question', 'question'], '마지막 항목 다음부터 이어 불러온다');

-- 달력
create temp table cal as select public.record_calendar('00000000-0000-0000-0000-00000000a001', '2026-10-01') as c;
select is((select c -> 'days' -> '2026-10-12' from cal), '["memo"]'::jsonb, '진행 중 질문은 달력에 표시하지 않는다');
select is((select c -> 'days' -> '2026-10-01' from cal), '["question"]'::jsonb, '함께 답한 질문은 표시한다');
select is((select c -> 'days' -> '2026-10-05' from cal), null, '둘 다 답하지 않은 질문은 달력에 없다');
select is((select c -> 'counts' from cal), '{"memo_days": 1, "questions": 1, "news": 1}'::jsonb, '그달 메모 남긴 날 · 함께 답한 질문 · 주고받은 근황');
select is((select c ->> 'since' from cal), '2026-09-20', '이전 달로 갈 수 있는 첫 날(이어진 날)');
select is((select c -> 'days' from (select public.record_calendar('00000000-0000-0000-0000-00000000a001', '2026-11-01') as c) x), '{}'::jsonb, '다른 달은 비어 있다');

select pg_temp.login('남');
select throws_ok($$ select public.records('00000000-0000-0000-0000-00000000a001') $$, 'P0001', 'not_member', '남은 못 본다');

select * from finish();
rollback;
