-- 7-7 통화 뒤 메모 저장 · 초안 지우기 · 되돌리기 · 메모 고치기 · 지우기.
-- 39차: 메모 쓰기 · 메모장은 없고, 통화 뒤에 초안을 고쳐 저장하거나(초안이 없으면) 글로 직접 쓴다. 기분만 있어도 저장된다.

-- 지운 초안도 되돌리기(토스트) 동안 글을 둔다. 초안 없을 때 4가지와 만드는 중에만 글이 없다
alter table public.memo_drafts drop constraint memo_drafts_check;
alter table public.memo_drafts add constraint memo_drafts_text_check check (
  case status
    when 'ready' then text is not null
    when 'saved' then true
    when 'discarded' then true
    else text is null
  end
);

-- 통화 뒤 메모 저장. 내 초안이 있으면 '저장함'으로 바꾸고 메모를 가리킨다. 한 통화에 내 메모는 하나
create function public.save_call_memo(call uuid, mood text default null, text text default '') returns public.memos
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  c public.calls;
  body text := btrim(coalesce(save_call_memo.text, ''));
  m public.memos;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  select * into c from public.calls x where x.id = call and uid in (x.caller_id, x.callee_id);
  if c.id is null then
    raise exception 'call_not_found';
  end if;
  if c.status <> 'completed' then
    raise exception 'call_not_completed';
  end if;
  if exists (select 1 from public.memos x where x.call_id = c.id and x.user_id = uid) then
    raise exception 'already_saved';
  end if;
  if save_call_memo.mood is null and body = '' then
    raise exception 'empty_memo';
  end if;

  insert into public.memos (user_id, relationship_id, call_id, mood, text, suggest_status)
  values (uid, c.relationship_id, c.id, save_call_memo.mood, body, case when body = '' then 'mood_only' else 'none' end)
  returning * into m;

  update public.memo_drafts d set status = 'saved', memo_id = m.id
  where d.call_id = c.id and d.user_id = uid;
  return m;
end;
$$;

-- 초안 지우기(되돌리기 토스트가 뜬다)
create function public.discard_draft(draft uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.memo_drafts set status = 'discarded'
  where id = draft and user_id = auth.uid() and status = 'ready';
  if not found then
    raise exception 'draft_not_found';
  end if;
end;
$$;

create function public.restore_draft(draft uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.memo_drafts set status = 'ready'
  where id = draft and user_id = auth.uid() and status = 'discarded' and text is not null and expires_at > now();
  if not found then
    raise exception 'draft_not_found';
  end if;
end;
$$;

-- 메모 고치기. 버전을 올리고, 아직 고르지 않은 이야기 후보는 지운다(다시 만듦, 7-9)
create function public.update_memo(memo uuid, mood text, text text) returns public.memos
language plpgsql
security definer
set search_path = ''
as $$
declare
  body text := btrim(coalesce(update_memo.text, ''));
  m public.memos;
begin
  if update_memo.mood is null and body = '' then
    raise exception 'empty_memo';
  end if;
  update public.memos x
  set mood = update_memo.mood,
      text = body,
      version = x.version + 1,
      suggest_status = case when body = '' then 'mood_only' else 'none' end,
      updated_at = now()
  where x.id = memo and x.user_id = auth.uid()
  returning * into m;
  if m.id is null then
    raise exception 'memo_not_found';
  end if;
  delete from public.talk_suggestions s where s.memo_id = m.id and s.status = 'candidate';
  return m;
end;
$$;

-- 메모 지우기. 그 메모로 만든 여쭤볼 이야기도 함께 지운다(외래 키)
create function public.delete_memo(memo uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.memos where id = memo and user_id = auth.uid();
  if not found then
    raise exception 'memo_not_found';
  end if;
end;
$$;

revoke execute on function public.save_call_memo(uuid, text, text) from public, anon;
revoke execute on function public.discard_draft(uuid) from public, anon;
revoke execute on function public.restore_draft(uuid) from public, anon;
revoke execute on function public.update_memo(uuid, text, text) from public, anon;
revoke execute on function public.delete_memo(uuid) from public, anon;
grant execute on function public.save_call_memo(uuid, text, text) to authenticated;
grant execute on function public.discard_draft(uuid) to authenticated;
grant execute on function public.restore_draft(uuid) to authenticated;
grant execute on function public.update_memo(uuid, text, text) to authenticated;
grant execute on function public.delete_memo(uuid) to authenticated;
