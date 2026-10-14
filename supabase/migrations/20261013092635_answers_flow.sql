-- 8-4 답 보내기 · 답 열기, 8-5 먼저 보내기 · 나만 보고 끝내기 · 확인했어요.
-- 둘 다 답하면 '열림'(동시에 답해도 질문 줄을 잠가서 한 번만). 열리기 전에는 상대 답이 보이지 않는다.

create function public.submit_answer(question uuid, text text, method text default 'text') returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  q public.exchange_questions;
  partner_answered boolean;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  select * into q from public.exchange_questions x where x.id = question for update;
  if q.id is null or not public.is_connected(q.relationship_id) then
    raise exception 'not_connected';
  end if;
  -- 다음 질문이 오기 전까지 답할 수 있다
  if q.status = 'closed' then
    raise exception 'question_closed';
  end if;

  begin
    insert into public.answers (exchange_question_id, relationship_id, user_id, text, method)
    values (q.id, q.relationship_id, uid, btrim(submit_answer.text), submit_answer.method);
  exception when unique_violation then
    raise exception 'already_answered';
  end;

  select exists (select 1 from public.answers a where a.exchange_question_id = q.id and a.user_id <> uid) into partner_answered;
  if partner_answered then
    update public.answers set visible_to_partner = true where exchange_question_id = q.id;
    update public.exchange_questions set status = 'opened', opened_at = now() where id = q.id;
  end if;
  return jsonb_build_object('opened', partner_answered);
end;
$$;

-- '먼저 보낼까요'를 물었다(답한 지 3일 또는 다음 질문 날, 홈 카드가 정한다). 한 번만 묻는다
create function public.mark_early_asked(question uuid) returns void
language sql
security definer
set search_path = ''
as $$
  update public.answers set early_asked_at = now()
  where exchange_question_id = question and user_id = auth.uid() and early_asked_at is null;
$$;

-- 먼저 보내기(send) · 나만 보고 끝내기(keep). keep은 상대에게 알리지 않는다
create function public.choose_early(question uuid, choice text) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.exchange_questions;
begin
  if choice not in ('send', 'keep') then
    raise exception 'invalid_choice';
  end if;
  select * into q from public.exchange_questions x where x.id = question for update;
  if q.id is null or not public.is_member(q.relationship_id) then
    raise exception 'not_member';
  end if;
  if q.status = 'opened' then
    raise exception 'already_opened';
  end if;
  update public.answers a
  set early_choice = choice, early_chosen_at = now(), visible_to_partner = (choice = 'send')
  where a.exchange_question_id = question and a.user_id = auth.uid() and a.early_choice is null;
  if not found then
    raise exception 'answer_not_found';
  end if;
end;
$$;

-- 열린 답 · 먼저 온 답에 '확인했어요'
create function public.see_question(question uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.relationships;
begin
  select rel.* into r from public.exchange_questions q
  join public.relationships rel on rel.id = q.relationship_id
  where q.id = question;
  if r.id is null or auth.uid() not in (r.child_id, r.parent_id) then
    raise exception 'not_member';
  end if;
  if auth.uid() = r.child_id then
    update public.exchange_questions set child_seen_at = coalesce(child_seen_at, now()) where id = question;
  else
    update public.exchange_questions set parent_seen_at = coalesce(parent_seen_at, now()) where id = question;
  end if;
end;
$$;

revoke execute on function public.submit_answer(uuid, text, text) from public, anon;
revoke execute on function public.mark_early_asked(uuid) from public, anon;
revoke execute on function public.choose_early(uuid, text) from public, anon;
revoke execute on function public.see_question(uuid) from public, anon;
grant execute on function public.submit_answer(uuid, text, text) to authenticated;
grant execute on function public.mark_early_asked(uuid) to authenticated;
grant execute on function public.choose_early(uuid, text) to authenticated;
grant execute on function public.see_question(uuid) to authenticated;
