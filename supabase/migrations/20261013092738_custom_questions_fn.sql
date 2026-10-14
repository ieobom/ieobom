-- 8-6 질문 만들기 · 지우기 · 상대가 만든 질문 보기(날짜만).
-- 한 사람이 한 가족에게 기다리게 할 수 있는 질문은 하나. 먼저 만든 질문이 먼저 간다.
-- send_on은 '다음 질문 차례' 날이다. 오늘 질문이 이미 왔으면 다음 차례부터 센다.

create function public.custom_question_slot(relationship uuid, after date) returns date
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d date := public.next_question_day(relationship, after);
begin
  while exists (
    select 1 from public.custom_questions c
    where c.relationship_id = relationship and c.status = 'waiting' and c.send_on = d
  ) loop
    d := public.next_question_day(relationship, d + 1);
  end loop;
  return d;
end;
$$;

create function public.create_custom_question(relationship uuid, text text) returns public.custom_questions
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  today date := public.seoul_today();
  made public.custom_questions;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  perform 1 from public.relationships r where r.id = relationship for update;
  if not public.is_connected(relationship) then
    raise exception 'not_connected';
  end if;
  if exists (select 1 from public.custom_questions c where c.relationship_id = relationship and c.author_id = uid and c.status = 'waiting') then
    raise exception 'already_waiting';
  end if;
  insert into public.custom_questions (relationship_id, author_id, text, send_on)
  values (
    relationship,
    uid,
    btrim(create_custom_question.text),
    public.custom_question_slot(
      relationship,
      case when exists (select 1 from public.exchange_questions q where q.relationship_id = relationship and q.sent_on = today)
        then today + 1 else today end
    )
  )
  returning * into made;
  return made;
end;
$$;

-- 지우면 그 차례에는 다음 질문(뒤에 기다리던 질문이 있으면 그것)이 간다
create function public.delete_custom_question(question uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.custom_questions;
  later public.custom_questions;
begin
  update public.custom_questions x set status = 'deleted'
  where x.id = question and x.author_id = auth.uid() and x.status = 'waiting'
  returning * into c;
  if c.id is null then
    raise exception 'question_not_found';
  end if;
  -- 뒤에 기다리던 질문을 한 차례 앞당긴다
  select * into later from public.custom_questions x
  where x.relationship_id = c.relationship_id and x.status = 'waiting' and x.send_on > c.send_on
  order by x.send_on limit 1;
  if later.id is not null then
    update public.custom_questions set send_on = c.send_on where id = later.id;
  end if;
end;
$$;

-- 상대가 만든 질문: 보내는 날 전까지는 '있다'와 날짜만
create function public.partner_custom_question(relationship uuid) returns table (send_on date)
language sql
stable
security definer
set search_path = ''
as $$
  select c.send_on from public.custom_questions c
  where c.relationship_id = relationship
    and c.status = 'waiting'
    and c.author_id <> (select auth.uid())
    and public.is_member(relationship)
$$;

revoke execute on function public.custom_question_slot(uuid, date) from public, anon, authenticated;
revoke execute on function public.create_custom_question(uuid, text) from public, anon;
revoke execute on function public.delete_custom_question(uuid) from public, anon;
revoke execute on function public.partner_custom_question(uuid) from public, anon;
grant execute on function public.create_custom_question(uuid, text) to authenticated;
grant execute on function public.delete_custom_question(uuid) to authenticated;
grant execute on function public.partner_custom_question(uuid) to authenticated;
