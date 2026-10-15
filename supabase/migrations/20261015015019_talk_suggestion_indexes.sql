-- 10-4 많은 데이터로 속도 점검에서 찾은 것. 기록 목록(records)이 메모 · 근황마다 그것으로 만든 여쭤볼 이야기를 찾을 때
-- talk_suggestions를 처음부터 끝까지 훑었다(가족 1만 쌍에서 3만 3천 줄). 메모 · 근황을 지울 때 따라 지우는 것도 이 칸으로 찾는다.
create index talk_suggestions_memo_idx on public.talk_suggestions (memo_id) where memo_id is not null;
create index talk_suggestions_news_idx on public.talk_suggestions (news_id) where news_id is not null;
