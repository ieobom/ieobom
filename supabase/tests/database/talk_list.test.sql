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
insert into public.relationship_settings (relationship_id, user_id, avoid_topics, curious_topics) values
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '{}', '{먹은 것}'),
  ('00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '{건강}', '{}');
insert into public.memos (id, user_id, relationship_id, text, created_at) values
  ('00000000-0000-0000-0000-0000000d0001', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', '병원', now() - interval '1 day');
insert into public.news (id, relationship_id, author_id, text, topic, topic_by, created_at) values
  ('00000000-0000-0000-0000-0000000f0001', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '등산', '취미·운동', 'chip', now() - interval '3 hours'),
  ('00000000-0000-0000-0000-0000000f0002', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('엄마'), '김장', '먹은 것', 'chip', now() - interval '5 hours'),
  ('00000000-0000-0000-0000-0000000f0003', '00000000-0000-0000-0000-00000000a001', pg_temp.user_id('자녀'), '야근', '건강', 'chip', now());
insert into public.talk_suggestions (id, owner_id, relationship_id, source, memo_id, news_id, text, status) values
  ('00000000-0000-0000-0000-000000005001', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'memo', '00000000-0000-0000-0000-0000000d0001', null, '검사 결과는 나왔어요?', 'picked'),
  ('00000000-0000-0000-0000-000000005002', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'news', null, '00000000-0000-0000-0000-0000000f0001', '거기는 어땠어요?', 'picked'),
  ('00000000-0000-0000-0000-000000005003', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'news', null, '00000000-0000-0000-0000-0000000f0002', '김장 맛있었어요?', 'picked'),
  ('00000000-0000-0000-0000-000000005004', pg_temp.user_id('자녀'), '00000000-0000-0000-0000-00000000a001', 'memo', '00000000-0000-0000-0000-0000000d0001', null, '안 고른 후보', 'candidate'),
  ('00000000-0000-0000-0000-000000005005', pg_temp.user_id('엄마'), '00000000-0000-0000-0000-00000000a001', 'news', null, '00000000-0000-0000-0000-0000000f0003', '야근 많이 해?', 'picked');

create temp table expected as select to_parent from public.weather_lines where season = public.season_of(public.seoul_today());
grant select on expected to public;

select pg_temp.login('자녀');
select is((select array_agg(i ->> 'text') from jsonb_array_elements(public.talk_list('00000000-0000-0000-0000-00000000a001')) i),
  array['김장 맛있었어요?', '검사 결과는 나왔어요?', '거기는 어땠어요?'], '요즘 궁금한 것 근황 → 메모 → 다른 근황, 3개까지');
select is((select (public.talk_list('00000000-0000-0000-0000-00000000a001') -> 0 -> 'note' ->> 'news_text')), '김장', '어디서 나온 이야기인지');
select public.mark_asked('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000005003');
select is((select array_agg(i ->> 'source') from jsonb_array_elements(public.talk_list('00000000-0000-0000-0000-00000000a001')) i),
  array['memo', 'news', 'weather'], '여쭤보면 빠지고 날씨가 채운다');
select is((select i ->> 'text' from jsonb_array_elements(public.talk_list('00000000-0000-0000-0000-00000000a001')) i where i ->> 'source' = 'weather'),
  (select to_parent from expected), '자녀는 부모님께 존댓말 문장');
select public.unmark_asked('00000000-0000-0000-0000-000000005003');
select is(jsonb_array_length(public.talk_list('00000000-0000-0000-0000-00000000a001')), 3, '되돌리면 다시 올라온다');

-- 날씨를 여쭤보면 이번 계절에는 다시 안 나온다
select public.mark_asked('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000005001');
select public.mark_asked('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000005002');
select public.mark_asked('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000005003');
create temp table w as select public.mark_asked('00000000-0000-0000-0000-00000000a001') as id;
select is(jsonb_array_length(public.talk_list('00000000-0000-0000-0000-00000000a001')), 0, '날씨도 여쭤보면 목록이 빈다');
select public.unmark_asked((select id from w));
select is((select array_agg(i ->> 'source') from jsonb_array_elements(public.talk_list('00000000-0000-0000-0000-00000000a001')) i), array['weather'],
  '날씨를 되돌리면 다시 나온다');

-- 엄마: 건강을 피하므로 '야근(건강)' 근황 이야기와 날씨(건강)는 빠진다
select pg_temp.login('엄마');
select is(jsonb_array_length(public.talk_list('00000000-0000-0000-0000-00000000a001')), 0, '피하고 싶은 주제는 빠진다');
select throws_ok($$ select public.mark_asked('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000005001') $$,
  'P0001', 'suggestion_not_found', '남의 이야기는 표시하지 못한다');

select pg_temp.login('남');
select throws_ok($$ select public.talk_list('00000000-0000-0000-0000-00000000a001') $$, 'P0001', 'not_member', '남은 못 본다');
select throws_ok($$ select * from public.weather_lines $$, '42501', null, '날씨 문장 표는 앱이 바로 읽지 않는다');

select * from finish();
rollback;
