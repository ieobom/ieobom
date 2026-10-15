-- 8-8 질문 만들기 화면의 '11월 13일 금요일에 두 사람이 함께 받아요'. 지금 만들면 내 질문이 갈 날을 미리 알려 준다.
-- 만들 때(create_custom_question)와 같은 규칙: 오늘 질문이 이미 왔으면 다음 차례부터, 먼저 기다리는 질문이 있으면 그 뒤.

create function public.custom_question_next(relationship uuid) returns date
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := public.seoul_today();
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;
  if not public.is_connected(relationship) then
    raise exception 'not_connected';
  end if;
  return public.custom_question_slot(
    relationship,
    case when exists (select 1 from public.exchange_questions q where q.relationship_id = relationship and q.sent_on = today)
      then today + 1 else today end
  );
end;
$$;

revoke execute on function public.custom_question_next(uuid) from public, anon;
grant execute on function public.custom_question_next(uuid) to authenticated;
