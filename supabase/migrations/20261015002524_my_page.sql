-- 10-8 마이 한 번에 불러오기 · 통화 편한 시간 한 번에 저장.
-- 마이 첫 화면과 그 아래 화면(연결된 가족 · 가족별 설정 · 통화 편한 시간 · 알림 받는 시각)이 그리는 값을 한 번에 준다.
-- 가족별 설정은 나만 읽어서 상대가 고른 횟수를 앱이 모른다. 그래서 실제로 받을 횟수(두 사람 중 적은 쪽)를 여기서 계산한다.

create function public.my_page() returns jsonb
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

-- 마이 > 통화 편한 시간 '저장': 고른 시간(3개까지)으로 통째로 바꾼다. 빈 배열이면 모두 지운다(알림이 안 옴)
-- 하나씩 지우고 더하면 중간에 끊겼을 때 반만 바뀌어서 한 번에 한다
create function public.set_call_times(times jsonb) returns setof public.call_times
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  if jsonb_typeof(times) is distinct from 'array' then
    raise exception 'invalid_call_times';
  end if;
  if jsonb_array_length(times) > 3 then
    raise exception 'too_many_call_times';
  end if;
  if (
    select count(distinct (t ->> 'days', t ->> 'start_hour', t ->> 'end_hour')) from jsonb_array_elements(times) t
  ) < jsonb_array_length(times) then
    raise exception 'duplicate_call_time';
  end if;
  delete from public.call_times c where c.user_id = uid;
  return query
    insert into public.call_times (user_id, days, start_hour, end_hour)
    select uid, t ->> 'days', (t ->> 'start_hour')::int, (t ->> 'end_hour')::int
    from jsonb_array_elements(times) t
    returning *;
end;
$$;

revoke execute on function public.my_page() from public, anon;
revoke execute on function public.set_call_times(jsonb) from public, anon;
grant execute on function public.my_page() to authenticated;
grant execute on function public.set_call_times(jsonb) to authenticated;
