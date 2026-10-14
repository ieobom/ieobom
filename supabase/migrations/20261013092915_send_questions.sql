-- 8-3 질문 보내기. 매일 새벽 5시(한국 시간)에 오늘 차례인 연결 전체를 SQL 한 번으로 처리한다.
-- 직접 만든 질문을 먼저 보내고, 없으면 두 사람의 피하고 싶은 주제를 뺀 안 보낸 질문을 보낸다.
-- 이전 질문은 닫고(다음 질문이 오기 전까지 답할 수 있음) #번호를 이어 매긴다.

create extension if not exists pg_cron with schema pg_catalog;

create function public.send_due_questions(day date default public.seoul_today()) returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  sent int;
begin
  -- 바꾼 횟수가 적용되는 날이 지났으면 본 횟수로 옮긴다
  update public.relationship_settings s
  set question_freq = s.next_freq, next_freq = null, next_freq_from = null
  where s.next_freq is not null and s.next_freq_from <= day;

  create temp table due on commit drop as
  select r.id as relationship_id
  from public.relationships r
  where r.status = 'connected'
    and extract(isodow from day)::int = any (public.question_days(public.relationship_freq(r.id, day)))
    and not exists (select 1 from public.exchange_questions q where q.relationship_id = r.id and q.sent_on = day);

  -- 보낼 질문 고르기: 직접 만든 질문(차례가 된 것 중 먼저 만든 것) → 질문 목록(검토함 · 안 보냄 · 피하는 주제 아님)
  create temp table picked on commit drop as
  select due.relationship_id, c.id as custom_id, null::uuid as bank_id, c.text
  from due
  join lateral (
    select x.* from public.custom_questions x
    where x.relationship_id = due.relationship_id and x.status = 'waiting' and x.send_on <= day
    order by x.send_on, x.created_at
    limit 1
  ) c on true;

  insert into picked
  select due.relationship_id, null, b.id, b.text
  from due
  join lateral (
    select x.* from public.question_bank x
    where x.reviewed
      and not exists (select 1 from public.exchange_questions q where q.relationship_id = due.relationship_id and q.bank_question_id = x.id)
      and (x.topic is null or not exists (
        select 1 from public.relationship_settings s
        where s.relationship_id = due.relationship_id and x.topic = any (s.avoid_topics)))
    order by x.created_at, x.id
    limit 1
  ) b on true
  where not exists (select 1 from picked p where p.relationship_id = due.relationship_id);

  update public.exchange_questions q set status = 'closed', closed_at = now()
  from picked p
  where q.relationship_id = p.relationship_id and q.status <> 'closed';

  insert into public.exchange_questions (relationship_id, seq_no, sent_on, bank_question_id, custom_question_id, text)
  select
    p.relationship_id,
    coalesce((select max(q.seq_no) from public.exchange_questions q where q.relationship_id = p.relationship_id), 0) + 1,
    day,
    p.bank_id,
    p.custom_id,
    p.text
  from picked p;
  get diagnostics sent = row_count;

  update public.custom_questions c set status = 'sent'
  from picked p where c.id = p.custom_id;

  drop table due;
  drop table picked;
  return sent;
end;
$$;

revoke execute on function public.send_due_questions(date) from public, anon, authenticated;

-- 매일 새벽 5시(한국) = 20시(UTC)
select cron.schedule('send-questions', '0 20 * * *', $$ select public.send_due_questions() $$);
