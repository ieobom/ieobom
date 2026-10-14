-- 11-1 사용량 주간 보기. 쌍(가족 연결)마다 한 주(월요일 시작, 한국 날짜) 동안의 사용량을 종류별로 더한다.
-- usage 표처럼 앱은 못 본다(security_invoker라 부른 사람의 권한을 따름). 운영팀이 관리 화면에서 본다.

create view public.usage_weekly with (security_invoker = on) as
select
  date_trunc('week', (u.created_at at time zone 'Asia/Seoul'))::date as week,
  u.relationship_id,
  sum(u.amount) filter (where u.kind = 'ai_tokens') as ai_tokens,
  sum(u.amount) filter (where u.kind = 'stt_short_seconds') as stt_short_seconds,
  sum(u.amount) filter (where u.kind = 'stt_call_seconds') as stt_call_seconds,
  sum(u.amount) filter (where u.kind = 'call_minutes') as call_minutes,
  sum(u.amount) filter (where u.kind = 'recording_minutes') as recording_minutes,
  sum(u.amount) filter (where u.kind = 'photo_mb') as photo_mb
from public.usage u
group by 1, 2;

comment on view public.usage_weekly is '쌍당 주간 사용량 (계획 11-1). 운영팀만 본다.';

revoke all on public.usage_weekly from anon, authenticated;
