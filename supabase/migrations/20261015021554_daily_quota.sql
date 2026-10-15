-- 11-2 하루 한도. 버그 하나가 업체 호출을 되풀이하는 사고를 막는다(계획 4장 사고 대비).
--   ai 사람별 AI 호출 횟수 · stt_short 사람별 짧은 말→글 횟수 · recording_minutes 연결별 통화 녹음 분
-- 서버 함수(ai · voice · call)가 업체를 부르기 전에 take_quota로 묻고, 안 되면 부르지 않는다
-- (원문만 저장, 통화 녹음은 시작하지 않고 초안은 '못 만듦'). 날짜는 한국 날짜.
-- 한도 값은 기능 켜고 끄기 표(app_config)의 value에 두어 관리 화면에서 바꾼다:
--   ai.value.per_user_per_day · voice.value.per_user_per_day · call_recording.value.minutes_per_relationship_per_day
-- 짧은 말→글도 끌 수 있게 voice 줄을 더한다(끄면 말로 답하기 · 말로 남기기를 숨기고 글로만).

update public.app_config set value = value || '{"per_user_per_day": 50}'::jsonb where key = 'ai';
update public.app_config set value = value || '{"minutes_per_relationship_per_day": 120}'::jsonb where key = 'call_recording';
insert into public.app_config (key, value, note) values
  ('voice', '{"per_user_per_day": 40}'::jsonb, '짧은 말 → 글 (말로 답하기 · 말로 남기기). 끄면 글로만');

create table private.daily_quota (
  day date not null,
  -- 사람(ai · stt_short) 또는 연결(recording_minutes)
  subject uuid not null,
  kind text not null check (kind in ('ai', 'stt_short', 'recording_minutes')),
  used numeric not null default 0 check (used >= 0),
  primary key (day, subject, kind)
);

-- amount만큼 쓸 수 있으면 더하고 true. 넘으면 더하지 않고 false.
--   amount = 0: 지금 남았는지만 본다(통화 녹음을 시작할 때)
--   force: 확인 없이 더한다(통화가 끝난 뒤 실제로 녹음한 분)
-- 한도 값이 없으면(이름을 틀려도) 막는다. 실수로 한도가 풀리지 않게
create function public.take_quota(kind text, subject uuid, amount numeric default 1, force boolean default false) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := public.seoul_today();
  lim numeric;
  now_used numeric;
  ok boolean;
begin
  if take_quota.kind not in ('ai', 'stt_short', 'recording_minutes') then
    raise exception 'invalid_quota_kind';
  end if;
  if amount is null or amount < 0 then
    raise exception 'invalid_amount';
  end if;
  select case take_quota.kind
      when 'ai' then (select c.value ->> 'per_user_per_day' from public.app_config c where c.key = 'ai')
      when 'stt_short' then (select c.value ->> 'per_user_per_day' from public.app_config c where c.key = 'voice')
      else (select c.value ->> 'minutes_per_relationship_per_day' from public.app_config c where c.key = 'call_recording')
    end::numeric
  into lim;

  if force then
    insert into private.daily_quota as q (day, subject, kind, used) values (today, take_quota.subject, take_quota.kind, amount)
    on conflict on constraint daily_quota_pkey do update set used = q.used + excluded.used;
    return true;
  end if;
  if lim is null then
    return false;
  end if;
  if amount = 0 then
    select q.used into now_used from private.daily_quota q where q.day = today and q.subject = take_quota.subject and q.kind = take_quota.kind;
    return coalesce(now_used, 0) < lim;
  end if;

  insert into private.daily_quota as q (day, subject, kind, used)
  select today, take_quota.subject, take_quota.kind, amount where amount <= lim
  on conflict on constraint daily_quota_pkey do update set used = q.used + excluded.used
    where q.used + excluded.used <= lim
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

revoke execute on function public.take_quota(text, uuid, numeric, boolean) from public, anon, authenticated;
grant execute on function public.take_quota(text, uuid, numeric, boolean) to service_role;

-- 보관 기간 지우기에 지난 한도 기록(이틀 지난 것)을 더한다
create or replace function public.purge_expired(at timestamptz default now()) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  calls_n int;
  events_n int;
  inquiries_n int;
  push_n int;
  errors_n int;
  attempts_n int;
  drafts_n int;
  quota_n int;
begin
  delete from public.calls where started_at < at - interval '30 days';
  get diagnostics calls_n = row_count;
  delete from public.events where created_at < at - interval '6 months';
  get diagnostics events_n = row_count;
  delete from public.inquiries where coalesce(answered_at, created_at) < at - interval '1 year';
  get diagnostics inquiries_n = row_count;
  delete from public.push_log where sent_at < at - interval '30 days';
  get diagnostics push_n = row_count;
  delete from public.client_errors where created_at < at - interval '90 days';
  get diagnostics errors_n = row_count;
  delete from public.code_attempts where attempted_at < at - interval '1 day';
  get diagnostics attempts_n = row_count;
  delete from public.memo_drafts where expires_at < at and status <> 'saved';
  get diagnostics drafts_n = row_count;
  delete from private.daily_quota where day < (at at time zone 'Asia/Seoul')::date - 2;
  get diagnostics quota_n = row_count;
  return jsonb_build_object('calls', calls_n, 'events', events_n, 'inquiries', inquiries_n,
                            'push_log', push_n, 'client_errors', errors_n, 'code_attempts', attempts_n,
                            'memo_drafts', drafts_n, 'daily_quota', quota_n);
end;
$$;
