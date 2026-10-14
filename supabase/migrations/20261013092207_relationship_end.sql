-- 4-5 연결 끊기. 새 질문 · 알림 · 통화를 멈추고(다른 함수들이 is_connected로 막음) 기록은 남긴다.
-- 다시 이으면 같은 줄을 되살린다(4-2).

create function public.end_relationship(relationship uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  update public.relationships r
  set status = 'ended', ended_at = now(), ended_by = uid
  where r.id = relationship and r.status = 'connected' and uid in (r.child_id, r.parent_id);
  if not found then
    raise exception 'not_connected';
  end if;
  -- 울리는 중 · 통화 중인 전화는 끝낸다
  update public.calls c
  set status = case when c.status = 'ringing' then 'canceled' else 'dropped' end, ended_at = now()
  where c.relationship_id = relationship and c.status in ('ringing', 'active');
end;
$$;

revoke execute on function public.end_relationship(uuid) from public, anon;
grant execute on function public.end_relationship(uuid) to authenticated;
