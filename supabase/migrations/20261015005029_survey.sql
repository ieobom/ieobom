-- 10-10 이용 설문 (0 · 3 · 6주).
-- 1) 39차 시안의 세 문항을 차수마다 넣는다. 문항은 운영팀이 관리 화면에서 고칠 수 있다(앱은 이 표를 읽는다).
-- 2) 마이 함수에 '지금 받을 설문'을 더한다(마이 이름 바로 아래 설문 카드).

insert into public.survey_questions (round, sort, text)
select r.round, q.sort, q.text
from (values (0), (3), (6)) as r (round)
cross join (values
  (1, '이번 주 가족과 연락하는 게 편했나요?'),
  (2, '이어봄 질문 덕분에 이야깃거리가 생겼나요?'),
  (3, '이어봄 알림이 부담스러웠나요?')
) as q (sort, text)
on conflict (round, sort) do nothing;

create or replace function public.my_page() returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  me public.users;
  -- 바꾼 횟수는 다음 주 월요일부터라, 그날 기준으로 적은 쪽을 보여 준다
  monday date := date_trunc('week', public.seoul_today())::date + 7;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  select * into me from public.users u where u.id = uid;
  if me.id is null then
    raise exception 'not_signed_up';
  end if;
  return jsonb_build_object(
    'me', jsonb_build_object(
      'name', me.name,
      'side', me.side,
      'large_text', me.large_text,
      'notify_on', me.notify_on,
      'notify_time', to_char(me.notify_time, 'HH24:MI'),
      'memo_draft_on', me.memo_draft_on,
      -- 로그인한 방법(kakao · apple). 마이의 '카카오 계정으로 로그인'
      'provider', (select a.raw_app_meta_data ->> 'provider' from auth.users a where a.id = uid),
      -- 필수 문서(약관 · 개인정보 · AI 안내)에 동의한 날과 버전
      'agreed_at', (
        select max(c.agreed_at) from public.consents c
        where c.user_id = uid and c.doc in ('terms', 'privacy', 'ai') and c.withdrawn_at is null
      ),
      'doc_version', (
        select max(c.version) from public.consents c
        where c.user_id = uid and c.doc in ('terms', 'privacy', 'ai') and c.withdrawn_at is null
      )
    ),
    -- 이어진 가족만. 끊었거나 상대가 탈퇴한 가족은 마이에 보이지 않는다
    'families', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'relationship_id', r.id,
        'my_side', case when r.child_id = uid then 'child' else 'parent' end,
        'parent_kind', r.parent_kind,
        -- 자녀 이름은 부모님에게만(자녀 화면에는 엄마 · 아빠로 보인다)
        'partner_name', case when r.parent_id = uid then c.name end,
        'connected_at', r.connected_at,
        -- 내가 고른 횟수(바꿨으면 바꾼 횟수)와 그 적용일
        'freq', coalesce(s.next_freq, s.question_freq),
        'freq_from', s.next_freq_from,
        -- 다음 주부터 실제로 받을 횟수: 두 사람 중 적은 쪽
        'applied', (
          select min(public.freq_on(x, monday)) from public.relationship_settings x where x.relationship_id = r.id
        ),
        'avoid_topics', to_jsonb(s.avoid_topics),
        'curious_topics', to_jsonb(s.curious_topics)
      ) order by r.connected_at), '[]'::jsonb)
      from public.relationships r
      left join public.users c on c.id = r.child_id
      left join public.relationship_settings s on s.relationship_id = r.id and s.user_id = uid
      where uid in (r.child_id, r.parent_id) and r.status = 'connected'
    ),
    -- 지금 받을 이용 설문: 이어진 날부터 0 · 3 · 6주차. 가족마다 따로 받고(ERD 7-5), 먼저 이어진 가족부터 하나씩
    'survey', (
      select jsonb_build_object('relationship_id', x.id, 'round', x.round)
      from (
        select r.id, r.connected_at,
          case when d.weeks >= 6 then 6 when d.weeks >= 3 then 3 else 0 end as round
        from public.relationships r
        cross join lateral (
          select (public.seoul_today() - (r.connected_at at time zone 'Asia/Seoul')::date) / 7 as weeks
        ) d
        where uid in (r.child_id, r.parent_id) and r.status = 'connected'
      ) x
      where not exists (
        select 1 from public.survey_responses s
        where s.user_id = uid and s.relationship_id = x.id and s.round = x.round
      )
      order by x.connected_at
      limit 1
    ),
    -- 보내 두고 기다리는 초대. 기한 지난 것도 '초대 코드 기한이 지났어요'를 보이려고 담는다
    'invites', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id, 'invite_as', i.invite_as, 'parent_kind', i.parent_kind, 'code', i.code, 'expires_at', i.expires_at
      ) order by i.created_at), '[]'::jsonb)
      from public.invites i where i.inviter_id = uid and i.status = 'waiting'
    ),
    -- 내 통화 편한 시간. 평일 · 토 · 일 · 매일 순, 이른 시각 먼저
    'call_times', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', t.id, 'days', t.days, 'start_hour', t.start_hour, 'end_hour', t.end_hour
      ) order by array_position(array['weekdays', 'sat', 'sun', 'everyday'], t.days), t.start_hour, t.end_hour), '[]'::jsonb)
      from public.call_times t where t.user_id = uid
    )
  );
end;
$$;
