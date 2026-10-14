-- 39차 4회에 맞춘 초대 코드 보완.
-- 1) 코드 확인 결과에 문구용 값(엄마 · 아빠, 자녀 이름)을 더한다: '아영이에게는 이미 엄마가 이어져 있어요' · '엄마와는 이미 이어져 있어요'
--    자녀 이름은 부모님에게만 준다(자녀 화면에는 부모님 이름이 보이지 않으므로, 자녀에게 줄 이름은 자기 이름뿐이다).
-- 2) 이어지면 그 자녀가 같은 관계로 기다리게 해 둔 코드는 '새 코드로 바뀜'(남은 코드로 다른 사람이 들어오지 않게)
-- 3) 이미 만든 질문 고치기(시안 '이미 만든 질문을 고칠 때', 계획 8-6)

create or replace function public.invite_lookup(uid uuid, code text, out result jsonb, out hit public.invites)
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := regexp_replace(coalesce(invite_lookup.code, ''), '\D', '', 'g');
  me public.users;
  wanted_side text;
  child uuid;
  parent uuid;
  pair public.relationships;
  failures int;
begin
  select * into me from public.users u where u.id = uid;
  if me.id is null then
    result := jsonb_build_object('ok', false, 'reason', 'not_signed_up');
    return;
  end if;

  -- 10분 안에 5번 틀리면 막는다
  select count(*) into failures from public.code_attempts a
  where a.user_id = uid and not a.ok and a.attempted_at > now() - interval '10 minutes';
  if failures >= 5 then
    result := jsonb_build_object('ok', false, 'reason', 'too_many_attempts');
    return;
  end if;

  -- 같은 코드가 여러 번 쓰였으면(기다림은 하나뿐) 기다리는 것 → 가장 최근 것
  select * into hit from public.invites i
  where i.code = clean
  order by (i.status = 'waiting') desc, i.created_at desc
  limit 1;

  result := case
    when hit.id is null then jsonb_build_object('ok', false, 'reason', 'code_not_found')
    when hit.status = 'used' then jsonb_build_object('ok', false, 'reason', 'code_used')
    when hit.status in ('canceled', 'replaced') then jsonb_build_object('ok', false, 'reason', 'code_canceled')
    when hit.expires_at <= now() then jsonb_build_object('ok', false, 'reason', 'code_expired')
    when hit.inviter_id = uid then jsonb_build_object('ok', false, 'reason', 'own_code')
  end;

  if result is null then
    wanted_side := case when hit.invite_as = 'child' then 'child' else 'parent' end;
    child := case when wanted_side = 'child' then uid else hit.inviter_id end;
    parent := case when wanted_side = 'child' then hit.inviter_id else uid end;
    select * into pair from public.relationships r where r.child_id = child and r.parent_id = parent;

    result := case
      when me.side <> wanted_side and exists (select 1 from public.relationships r where uid in (r.child_id, r.parent_id))
        then jsonb_build_object('ok', false, 'reason', 'side_mismatch', 'invite_as', hit.invite_as)
      -- '엄마와는 이미 이어져 있어요' · '아영이와는 이미 이어져 있어요'
      when pair.status = 'connected' then jsonb_build_object('ok', false, 'reason', 'already_connected',
        'parent_kind', hit.parent_kind, 'child_name', case when wanted_side = 'parent' then (select u.name from public.users u where u.id = child) end)
      -- '아영이에게는 이미 엄마가 이어져 있어요'(같은 두 사람이 아닌데 그 자녀에게 엄마(아빠)가 있음)
      when exists (select 1 from public.relationships r
                   where r.child_id = child and r.parent_kind = hit.parent_kind and r.status = 'connected')
        then jsonb_build_object('ok', false, 'reason', 'already_has_parent',
          'parent_kind', hit.parent_kind, 'child_name', (select u.name from public.users u where u.id = child))
      else jsonb_build_object(
        'ok', true,
        'invite_as', hit.invite_as,
        'parent_kind', hit.parent_kind,
        -- 부모님에게는 자녀 이름이 보이고, 자녀에게는 엄마 · 아빠만 보인다
        'inviter_name', case when wanted_side = 'parent' then (select u.name from public.users u where u.id = hit.inviter_id) end
      )
    end;
  end if;

  -- 틀림 · 지남 · 이미 씀 · 취소는 틀린 횟수에 넣는다(관계가 안 맞는 것은 코드가 맞으므로 넣지 않는다)
  insert into public.code_attempts (user_id, ok)
  values (uid, (result ->> 'ok')::boolean
    or coalesce((result ->> 'reason') in ('side_mismatch', 'already_connected', 'already_has_parent', 'own_code'), false));
end;
$$;

create function public.relationships_retire_codes() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'connected' and (tg_op = 'INSERT' or old.status <> 'connected') then
    update public.invites i set status = 'replaced'
    where i.inviter_id = new.child_id and i.invite_as = new.parent_kind and i.status = 'waiting';
  end if;
  return new;
end;
$$;

create trigger relationships_retire_codes after insert or update of status on public.relationships
  for each row execute function public.relationships_retire_codes();

revoke execute on function public.relationships_retire_codes() from public, anon, authenticated;

-- 보내기 전까지 고칠 수 있다. 보낼 날은 그대로
create function public.update_custom_question(question uuid, text text) returns public.custom_questions
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.custom_questions;
begin
  update public.custom_questions x set text = btrim(update_custom_question.text)
  where x.id = question and x.author_id = auth.uid() and x.status = 'waiting'
  returning * into c;
  if c.id is null then
    raise exception 'question_not_found';
  end if;
  return c;
end;
$$;

revoke execute on function public.update_custom_question(uuid, text) from public, anon;
grant execute on function public.update_custom_question(uuid, text) to authenticated;
