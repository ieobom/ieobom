-- 4-2 코드 확인(미리 보기) · 연결.
-- 틀린 횟수를 남겨야 해서 오류를 내지 않고 { ok, reason } 으로 돌려준다(오류를 내면 남긴 기록도 되돌려진다).
-- reason: too_many_attempts · code_not_found · code_expired · code_used · code_canceled(취소 또는 새 코드로 바뀜)
--         own_code · side_mismatch · already_connected · already_has_parent · not_signed_up

create function public.invite_lookup(uid uuid, code text, out result jsonb, out hit public.invites)
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
      when pair.status = 'connected' then jsonb_build_object('ok', false, 'reason', 'already_connected')
      when exists (select 1 from public.relationships r
                   where r.child_id = child and r.parent_kind = hit.parent_kind and r.status = 'connected')
        then jsonb_build_object('ok', false, 'reason', 'already_has_parent')
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

-- 코드를 넣으면 먼저 누가 어떤 관계로 초대했는지 보여 준다
create function public.preview_invite(code text) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  looked record;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  select * into looked from public.invite_lookup(uid, preview_invite.code);
  return looked.result;
end;
$$;

-- '연결하기'. 끊겼던 쌍이면 같은 줄을 되살린다(지난 기록이 다시 보임)
create function public.accept_invite(code text) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  looked record;
  inv public.invites;
  wanted_side text;
  child uuid;
  parent uuid;
  rel uuid;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  select * into looked from public.invite_lookup(uid, accept_invite.code);
  if not (looked.result ->> 'ok')::boolean then
    return looked.result;
  end if;
  inv := looked.hit;

  wanted_side := case when inv.invite_as = 'child' then 'child' else 'parent' end;
  update public.users set side = wanted_side where id = uid and side <> wanted_side;
  child := case when wanted_side = 'child' then uid else inv.inviter_id end;
  parent := case when wanted_side = 'child' then inv.inviter_id else uid end;

  update public.relationships r
  set status = 'connected', parent_kind = inv.parent_kind, ended_at = null, ended_by = null
  where r.child_id = child and r.parent_id = parent
  returning r.id into rel;
  if rel is null then
    insert into public.relationships (child_id, parent_id, parent_kind)
    values (child, parent, inv.parent_kind)
    returning id into rel;
  end if;

  insert into public.relationship_settings (relationship_id, user_id)
  values (rel, child), (rel, parent)
  on conflict do nothing;

  update public.invites set status = 'used', joined_by = uid, relationship_id = rel where id = inv.id;

  return jsonb_build_object('ok', true, 'relationship_id', rel);
end;
$$;

revoke execute on function public.invite_lookup(uuid, text) from public, anon, authenticated;
revoke execute on function public.preview_invite(text) from public, anon;
revoke execute on function public.accept_invite(text) from public, anon;
grant execute on function public.preview_invite(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
