-- 4-1 초대 코드 만들기 · 새 코드 · 취소.
-- 39차 '누구와 이어볼까요': 엄마 · 아빠 · 자녀 중 고른다. 엄마 · 아빠를 고르면 나는 자녀, 자녀를 고르면 나는 부모님이다.
-- 부모님이 자녀를 초대할 때는 내가 엄마인지 아빠인지(my_kind)도 받는다(받는 자녀 화면에 '엄마의 자녀로' 보이게).

-- 이 코드로 이어지면 만들어질 연결의 엄마 · 아빠
alter table public.invites add column parent_kind text check (parent_kind in ('mom', 'dad'));
update public.invites set parent_kind = invite_as where invite_as in ('mom', 'dad');
alter table public.invites alter column parent_kind set not null;
alter table public.invites add check (invite_as = 'child' or parent_kind = invite_as);

-- 아직 아무와도 이어진 적이 없으면 고른 관계에 맞게 자녀/부모님을 바꾼다(가입 중 관계를 다시 고를 때)
create function public.align_side(uid uuid, wanted text) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select u.side from public.users u where u.id = uid) = wanted then
    return;
  end if;
  if exists (select 1 from public.relationships r where uid in (r.child_id, r.parent_id)) then
    raise exception 'side_mismatch';
  end if;
  update public.users set side = wanted where id = uid;
end;
$$;

-- 6자리 숫자. 기다리는 코드와 겹치면 다시 뽑는다(invites_waiting_code_idx)
create function public.random_code() returns text
language sql
volatile
set search_path = ''
as $$
  select lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint % 1000000))::text, 6, '0')
$$;

create function public.create_invite(invite_as text, my_kind text default null) returns public.invites
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  kind text;
  made public.invites;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  if not exists (select 1 from public.users u where u.id = uid) then
    raise exception 'not_signed_up';
  end if;
  if create_invite.invite_as not in ('mom', 'dad', 'child') then
    raise exception 'invalid_invite_as';
  end if;

  if create_invite.invite_as = 'child' then
    perform public.align_side(uid, 'parent');
    if my_kind is null or my_kind not in ('mom', 'dad') then
      raise exception 'parent_kind_required';
    end if;
    kind := my_kind;
  else
    perform public.align_side(uid, 'child');
    kind := create_invite.invite_as;
    -- 한 자녀에게 엄마 · 아빠는 각 한 분
    if exists (select 1 from public.relationships r where r.child_id = uid and r.parent_kind = kind and r.status = 'connected') then
      raise exception 'already_has_parent';
    end if;
  end if;

  -- 같은 관계로 기다리던 내 코드는 '새 코드로 바뀜'
  update public.invites i set status = 'replaced'
  where i.inviter_id = uid and i.invite_as = create_invite.invite_as and i.status = 'waiting';

  for attempt in 1..20 loop
    begin
      insert into public.invites (code, inviter_id, invite_as, parent_kind)
      values (public.random_code(), uid, create_invite.invite_as, kind)
      returning * into made;
      return made;
    exception when unique_violation then
      -- 기다리는 코드와 겹침: 다시 뽑는다
    end;
  end loop;
  raise exception 'code_generation_failed';
end;
$$;

create function public.cancel_invite(invite uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.invites i set status = 'canceled'
  where i.id = invite and i.inviter_id = auth.uid() and i.status = 'waiting';
  if not found then
    raise exception 'invite_not_found';
  end if;
end;
$$;

revoke execute on function public.align_side(uuid, text) from public, anon, authenticated;
revoke execute on function public.random_code() from public, anon, authenticated;
revoke execute on function public.create_invite(text, text) from public, anon;
revoke execute on function public.cancel_invite(uuid) from public, anon;
grant execute on function public.create_invite(text, text) to authenticated;
grant execute on function public.cancel_invite(uuid) to authenticated;
