-- 2-10 시험용 가짜 데이터. 로컬 DB(supabase db start · db reset)와 CI에서만 넣는다. 개발 · 운영 DB에는 넣지 않는다.
-- 가족 3쌍: 아영-엄마(이어짐) · 민준-아빠(이어짐) · 서연-엄마(엄마가 탈퇴해 끊김)
-- 질문 20개는 시험용 문장이다. 실제 질문 목록은 팀이 검토해서 넣는다(계획 8-1).
-- 고유 번호는 5eed로 시작해 DB 검사(supabase/tests)의 시험용 줄과 겹치지 않는다.

-- ── 사용자 ─────────────────────────────────────
insert into auth.users (id, aud, role, email) values
  ('5eed0000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'seed-ayoung@test.ieobom'),
  ('5eed0000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'seed-ayoung-mom@test.ieobom'),
  ('5eed0000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'seed-minjun@test.ieobom'),
  ('5eed0000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'seed-minjun-dad@test.ieobom'),
  ('5eed0000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'seed-seoyeon@test.ieobom');

insert into public.users (id, name, side, large_text, notify_time, memo_draft_on) values
  ('5eed0000-0000-0000-0000-000000000001', '아영', 'child', false, '19:00', true),
  ('5eed0000-0000-0000-0000-000000000002', '김순자', 'parent', true, '08:00', true),
  ('5eed0000-0000-0000-0000-000000000003', '민준', 'child', false, '21:00', true),
  ('5eed0000-0000-0000-0000-000000000004', '박영호', 'parent', true, '12:00', false),
  ('5eed0000-0000-0000-0000-000000000005', '서연', 'child', false, '19:00', false);

insert into public.consents (user_id, doc, version)
select u.id, d.doc, '1.0'
from public.users u
cross join (values ('age14'), ('terms'), ('privacy'), ('ai')) as d (doc)
where u.id::text like '5eed%';

insert into public.consents (user_id, doc, version)
select id, 'memo_draft', '1.0' from public.users where id::text like '5eed%' and memo_draft_on;

-- ── 가족 연결 · 설정 ─────────────────────────────
insert into public.relationships (id, child_id, parent_id, parent_kind, status, connected_at) values
  ('5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000001', '5eed0000-0000-0000-0000-000000000002', 'mom', 'connected', now() - interval '42 days'),
  ('5eed0000-0000-0000-0000-0000000000a2', '5eed0000-0000-0000-0000-000000000003', '5eed0000-0000-0000-0000-000000000004', 'dad', 'connected', now() - interval '10 days');
insert into public.relationships (id, child_id, parent_id, parent_kind, status, connected_at, ended_at) values
  ('5eed0000-0000-0000-0000-0000000000a3', '5eed0000-0000-0000-0000-000000000005', null, 'mom', 'left', now() - interval '30 days', now() - interval '3 days');

insert into public.relationship_settings (relationship_id, user_id, question_freq, avoid_topics, curious_topics) values
  ('5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000001', 2, '{결혼·연애}', '{건강,먹은 것}'),
  ('5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000002', 1, '{}', '{일·학교}'),
  ('5eed0000-0000-0000-0000-0000000000a2', '5eed0000-0000-0000-0000-000000000003', 1, '{취업·직장}', '{}'),
  ('5eed0000-0000-0000-0000-0000000000a2', '5eed0000-0000-0000-0000-000000000004', 3, '{}', '{취미·운동}'),
  ('5eed0000-0000-0000-0000-0000000000a3', '5eed0000-0000-0000-0000-000000000005', 1, '{}', '{}');

insert into public.call_times (user_id, days, start_hour, end_hour) values
  ('5eed0000-0000-0000-0000-000000000001', 'weekdays', 19, 21),
  ('5eed0000-0000-0000-0000-000000000001', 'sun', 10, 12),
  ('5eed0000-0000-0000-0000-000000000002', 'everyday', 18, 21),
  ('5eed0000-0000-0000-0000-000000000003', 'weekdays', 21, 23),
  ('5eed0000-0000-0000-0000-000000000004', 'sat', 9, 11);

-- ── 질문 목록 (시험용 20개) ──────────────────────
insert into public.question_bank (id, text, topic, reviewed, is_example) values
  ('5eed0000-0000-0000-0000-0000000b0001', '어릴 때 가장 좋아했던 반찬은 뭐예요?', null, true, true),
  ('5eed0000-0000-0000-0000-0000000b0002', '요즘 가장 자주 듣는 노래는 뭐예요?', null, true, true),
  ('5eed0000-0000-0000-0000-0000000b0003', '요즘 새로 배워 보고 싶은 게 있어요?', null, true, true),
  ('5eed0000-0000-0000-0000-0000000b0004', '요즘 제일 재밌게 보는 방송은 뭐예요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0005', '가장 기억에 남는 여행지는 어디예요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0006', '어릴 때 꿈은 뭐였어요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0007', '요즘 하루 중 가장 좋아하는 시간은 언제예요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0008', '처음 받은 월급으로 뭘 했어요?', '취업·직장', true, false),
  ('5eed0000-0000-0000-0000-0000000b0009', '가장 좋아하는 계절은 언제예요? 왜요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0010', '요즘 자주 가는 곳이 있어요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0011', '학교 다닐 때 가장 좋아했던 과목은 뭐예요?', '학업', true, false),
  ('5eed0000-0000-0000-0000-0000000b0012', '최근에 웃었던 일은 뭐예요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0013', '오래 간직하고 있는 물건이 있어요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0014', '요즘 즐겨 먹는 음식은 뭐예요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0015', '다시 가 보고 싶은 동네가 있어요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0016', '어릴 때 자주 하던 놀이는 뭐예요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0017', '요즘 몸은 어디 불편한 데 없어요?', '건강', true, false),
  ('5eed0000-0000-0000-0000-0000000b0018', '좋아하는 영화나 책 하나만 알려 줄래요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0019', '주말에는 주로 뭐 하면서 지내요?', null, true, false),
  ('5eed0000-0000-0000-0000-0000000b0020', '올해 꼭 해 보고 싶은 일이 있어요?', null, true, false);

-- ── 교환 질문 · 답 (아영-엄마) ────────────────────
insert into public.exchange_questions (id, relationship_id, seq_no, sent_on, bank_question_id, text, status, opened_at, closed_at) values
  ('5eed0000-0000-0000-0000-0000000e0001', '5eed0000-0000-0000-0000-0000000000a1', 1, current_date - 7, '5eed0000-0000-0000-0000-0000000b0001',
   '어릴 때 가장 좋아했던 반찬은 뭐예요?', 'closed', now() - interval '6 days', now() - interval '3 days'),
  ('5eed0000-0000-0000-0000-0000000e0002', '5eed0000-0000-0000-0000-0000000000a1', 2, current_date - 3, '5eed0000-0000-0000-0000-0000000b0002',
   '요즘 가장 자주 듣는 노래는 뭐예요?', 'opened', now() - interval '2 days', null),
  ('5eed0000-0000-0000-0000-0000000e0003', '5eed0000-0000-0000-0000-0000000000a1', 3, current_date, '5eed0000-0000-0000-0000-0000000b0003',
   '요즘 새로 배워 보고 싶은 게 있어요?', 'waiting', null, null);

insert into public.answers (exchange_question_id, relationship_id, user_id, text, visible_to_partner) values
  ('5eed0000-0000-0000-0000-0000000e0001', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000001', '엄마가 해 준 계란말이요', true),
  ('5eed0000-0000-0000-0000-0000000e0001', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000002', '나는 어릴 때 고구마 줄기 볶음', true),
  ('5eed0000-0000-0000-0000-0000000e0002', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000001', '요즘은 출근길에 옛날 가요를 들어요', true),
  ('5eed0000-0000-0000-0000-0000000e0002', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000002', '라디오에서 나오는 트로트', true),
  ('5eed0000-0000-0000-0000-0000000e0003', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000001', '수영을 배워 보고 싶어요', false);

insert into public.custom_questions (relationship_id, author_id, text, send_on) values
  ('5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000002', '아영이는 요즘 회사 점심 뭐 먹어?', current_date + 4);

-- ── 통화 · 메모 · 초안 (아영-엄마) ────────────────
insert into public.calls (id, relationship_id, caller_id, callee_id, status, started_at, answered_at, ended_at, caller_draft_on, callee_draft_on, recording) values
  ('5eed0000-0000-0000-0000-0000000c0001', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000001', '5eed0000-0000-0000-0000-000000000002',
   'completed', now() - interval '2 days', now() - interval '2 days' + interval '10 seconds', now() - interval '2 days' + interval '14 minutes', true, true, 'done'),
  ('5eed0000-0000-0000-0000-0000000c0002', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000002', '5eed0000-0000-0000-0000-000000000001',
   'missed', now() - interval '3 hours', null, now() - interval '3 hours' + interval '45 seconds', true, true, 'none'),
  ('5eed0000-0000-0000-0000-0000000c0003', '5eed0000-0000-0000-0000-0000000000a2', '5eed0000-0000-0000-0000-000000000003', '5eed0000-0000-0000-0000-000000000004',
   'completed', now() - interval '1 day', now() - interval '1 day' + interval '8 seconds', now() - interval '1 day' + interval '6 minutes', true, false, 'skipped');

insert into public.memos (id, user_id, relationship_id, call_id, mood, text, suggest_status) values
  ('5eed0000-0000-0000-0000-0000000d0001', '5eed0000-0000-0000-0000-000000000001', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-0000000c0001',
   'good', '엄마가 이번 주에 병원에 다녀오셨다. 결과는 다음 주에 나온다고 하셨다.', 'done');

insert into public.memo_drafts (user_id, relationship_id, call_id, status, text, memo_id, created_at, expires_at) values
  ('5eed0000-0000-0000-0000-000000000001', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-0000000c0001', 'saved',
   '엄마가 이번 주에 병원에 다녀오셨대요.', '5eed0000-0000-0000-0000-0000000d0001', now() - interval '2 days', now() + interval '1 day'),
  ('5eed0000-0000-0000-0000-000000000002', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-0000000c0001', 'ready',
   '아영이가 회사 일이 바쁘다고 했어요. 주말에 집에 올 수도 있대요.', null, now() - interval '2 days', now() + interval '1 day'),
  ('5eed0000-0000-0000-0000-000000000003', '5eed0000-0000-0000-0000-0000000000a2', '5eed0000-0000-0000-0000-0000000c0003', 'off_partner',
   null, null, now() - interval '1 day', now() + interval '2 days'),
  ('5eed0000-0000-0000-0000-000000000004', '5eed0000-0000-0000-0000-0000000000a2', '5eed0000-0000-0000-0000-0000000c0003', 'off_self',
   null, null, now() - interval '1 day', now() + interval '2 days');

insert into public.talk_suggestions (owner_id, relationship_id, source, memo_id, text, status) values
  ('5eed0000-0000-0000-0000-000000000001', '5eed0000-0000-0000-0000-0000000000a1', 'memo', '5eed0000-0000-0000-0000-0000000d0001', '검사 결과는 나왔어요?', 'picked'),
  ('5eed0000-0000-0000-0000-000000000001', '5eed0000-0000-0000-0000-0000000000a1', 'memo', '5eed0000-0000-0000-0000-0000000d0001', '병원은 혼자 다녀오셨어요?', 'skipped');

-- ── 근황 ───────────────────────────────────────
insert into public.news (id, relationship_id, author_id, text, topic, topic_by, created_at, seen_at) values
  ('5eed0000-0000-0000-0000-0000000f0001', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000002',
   '뒷산에 단풍이 들기 시작했어', '다녀온 곳', 'chip', now() - interval '1 day', null),
  ('5eed0000-0000-0000-0000-0000000f0002', '5eed0000-0000-0000-0000-0000000000a1', '5eed0000-0000-0000-0000-000000000001',
   '이번 달에 이사해요', '이사', 'custom', now() - interval '4 days', now() - interval '3 days'),
  ('5eed0000-0000-0000-0000-0000000f0003', '5eed0000-0000-0000-0000-0000000000a2', '5eed0000-0000-0000-0000-000000000004',
   '오늘 등산 다녀왔다', '취미·운동', 'rule', now() - interval '5 hours', null);

insert into public.talk_suggestions (owner_id, relationship_id, source, news_id, text, status) values
  ('5eed0000-0000-0000-0000-000000000001', '5eed0000-0000-0000-0000-0000000000a1', 'news', '5eed0000-0000-0000-0000-0000000f0001', '단풍 구경 가셨어요?', 'picked');

-- ── 운영 ───────────────────────────────────────
insert into public.survey_questions (round, sort, text) values
  (0, 1, '이어봄을 쓰기 전, 가족과 얼마나 자주 이야기했나요?'),
  (0, 2, '가족에게 하고 싶은 말을 편하게 하는 편인가요?');
