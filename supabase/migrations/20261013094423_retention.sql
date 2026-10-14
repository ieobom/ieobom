-- 11-5 보관 기간 지우기. 매일 새벽 4시(한국) = 19시(UTC).
-- 통화 30일(통화 글 · 초안도 함께) · 이용 기록 6개월 · 문의 1년(답한 날부터, 답 없으면 보낸 날부터) · 알림 기록 30일
-- 정리용: 앱 오류 90일 · 틀린 코드 기록 하루(10분만 보면 됨)

create function public.purge_expired(at timestamptz default now()) returns jsonb
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
  return jsonb_build_object('calls', calls_n, 'events', events_n, 'inquiries', inquiries_n,
                            'push_log', push_n, 'client_errors', errors_n, 'code_attempts', attempts_n);
end;
$$;

revoke execute on function public.purge_expired(timestamptz) from public, anon, authenticated;

select cron.schedule('purge-expired', '0 19 * * *', $$ select public.purge_expired() $$);
