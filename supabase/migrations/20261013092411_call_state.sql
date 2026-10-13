-- 5-3 통화 상태: 걸기 · 받기 · 거절 · 취소 · 끝 · 못 받음.
-- 한 연결에 진행 중 통화는 하나. 서로 동시에 걸면 먼저 건 통화로 합친다(내 걸기가 상대 전화를 받는 것이 된다).
-- 받는 순간 두 사람의 '통화 메모 초안' 값을 통화 줄에 적는다. 녹음 시작(7-2)은 이 값을 본다.

create function public.start_call(relationship uuid) returns public.calls
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  r public.relationships;
  live public.calls;
  made public.calls;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  select * into r from public.relationships x where x.id = relationship and x.status = 'connected' and uid in (x.child_id, x.parent_id)
  for update;
  if r.id is null then
    raise exception 'not_connected';
  end if;

  select * into live from public.calls c where c.relationship_id = r.id and c.status in ('ringing', 'active');
  if live.id is not null then
    if live.caller_id = uid then
      return live; -- 이미 내가 건 전화
    end if;
    if live.status = 'ringing' then
      return public.answer_call(live.id); -- 상대가 먼저 걸었다: 그 전화를 받는다
    end if;
    raise exception 'call_in_progress';
  end if;

  insert into public.calls (relationship_id, caller_id, callee_id, in_free_time)
  values (
    r.id,
    uid,
    case when r.child_id = uid then r.parent_id else r.child_id end,
    coalesce((select o.free_now from public.call_time_overlap(r.id) o), false)
  )
  returning * into made;
  update public.calls set room_name = 'call-' || made.id where id = made.id returning * into made;
  return made;
end;
$$;

create function public.answer_call(call uuid) returns public.calls
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.calls;
begin
  update public.calls x
  set status = 'active',
      answered_at = now(),
      caller_draft_on = (select u.memo_draft_on from public.users u where u.id = x.caller_id),
      callee_draft_on = (select u.memo_draft_on from public.users u where u.id = x.callee_id)
  where x.id = call and x.callee_id = auth.uid() and x.status = 'ringing'
  returning * into c;
  if c.id is null then
    raise exception 'call_not_ringing';
  end if;
  return c;
end;
$$;

create function public.decline_call(call uuid) returns public.calls
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.calls;
begin
  update public.calls x set status = 'declined', ended_at = now()
  where x.id = call and x.callee_id = auth.uid() and x.status = 'ringing'
  returning * into c;
  if c.id is null then
    raise exception 'call_not_ringing';
  end if;
  return c;
end;
$$;

-- 거는 쪽: 받기 전에 끊으면 취소, 45초가 지나면 못 받음(missed = true)
create function public.cancel_call(call uuid, missed boolean default false) returns public.calls
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.calls;
begin
  update public.calls x set status = case when missed then 'missed' else 'canceled' end, ended_at = now()
  where x.id = call and x.caller_id = auth.uid() and x.status = 'ringing'
  returning * into c;
  if c.id is null then
    raise exception 'call_not_ringing';
  end if;
  return c;
end;
$$;

-- 통화 중 끝내기(어느 쪽이든). 실제 끝난 시각은 LiveKit 웹훅(5-9)이 다시 맞춘다
create function public.end_call(call uuid) returns public.calls
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.calls;
begin
  update public.calls x set status = 'completed', ended_at = now()
  where x.id = call and x.status = 'active' and auth.uid() in (x.caller_id, x.callee_id)
  returning * into c;
  if c.id is null then
    raise exception 'call_not_active';
  end if;
  return c;
end;
$$;

-- 못 받은 전화를 봤다(홈 카드에서 빠짐)
create function public.see_missed_call(call uuid) returns void
language sql
security definer
set search_path = ''
as $$
  update public.calls set missed_seen_at = now()
  where id = call and callee_id = auth.uid() and status = 'missed' and missed_seen_at is null;
$$;

revoke execute on function public.start_call(uuid) from public, anon;
revoke execute on function public.answer_call(uuid) from public, anon;
revoke execute on function public.decline_call(uuid) from public, anon;
revoke execute on function public.cancel_call(uuid, boolean) from public, anon;
revoke execute on function public.end_call(uuid) from public, anon;
revoke execute on function public.see_missed_call(uuid) from public, anon;
grant execute on function public.start_call(uuid) to authenticated;
grant execute on function public.answer_call(uuid) to authenticated;
grant execute on function public.decline_call(uuid) to authenticated;
grant execute on function public.cancel_call(uuid, boolean) to authenticated;
grant execute on function public.end_call(uuid) to authenticated;
grant execute on function public.see_missed_call(uuid) to authenticated;
