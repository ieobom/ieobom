-- 3-3 가입 마무리 · 통화 메모 초안 켜고 끄기.
-- 앱은 카카오(또는 Apple) 로그인 뒤 이름 · 자녀/부모님 · 동의를 받아 signup_complete를 한 번 부른다.

-- 동의 문서 버전. 시안의 약관 · 처리방침 · AI 안내는 1.0이다. 문서를 고치면 앱이 보낸 버전으로 남는다
create function public.signup_complete(
  name text,
  side text,
  agreed text[],
  doc_version text default '1.0'
) returns public.users
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  me public.users;
  required text[] := array['age14', 'terms', 'privacy', 'ai'];
  draft boolean := 'memo_draft' = any (agreed);
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  if exists (select 1 from public.users u where u.id = uid) then
    raise exception 'already_signed_up';
  end if;
  -- [필수] 만 14세 이상 · 이용약관 · 개인정보 · AI 사용 안내
  if not (required <@ agreed) then
    raise exception 'consent_required';
  end if;
  if not (agreed <@ (required || array['memo_draft'])) then
    raise exception 'unknown_consent';
  end if;

  -- 부모님은 처음부터 글자 크게 보기
  insert into public.users (id, name, side, large_text, memo_draft_on)
  values (uid, btrim(signup_complete.name), signup_complete.side, signup_complete.side = 'parent', draft)
  returning * into me;

  insert into public.consents (user_id, doc, version)
  select uid, d, doc_version from unnest(agreed) as d;

  return me;
end;
$$;

-- 마이에서 '통화 메모 초안'을 켜고 끈다. 끄면 동의 철회로 남기고, 켜면 새로 동의한다.
-- 받는 순간의 값을 통화 줄에 적으므로(5-3) 바꾸면 다음 통화부터 적용된다
create function public.set_memo_draft(turn_on boolean, doc_version text default '1.0') returns void
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
  update public.users set memo_draft_on = turn_on where id = uid;
  if not found then
    raise exception 'not_signed_up';
  end if;
  if turn_on then
    if not exists (select 1 from public.consents c where c.user_id = uid and c.doc = 'memo_draft' and c.withdrawn_at is null) then
      insert into public.consents (user_id, doc, version) values (uid, 'memo_draft', doc_version);
    end if;
  else
    update public.consents set withdrawn_at = now()
    where user_id = uid and doc = 'memo_draft' and withdrawn_at is null;
  end if;
end;
$$;

revoke execute on function public.signup_complete(text, text, text[], text) from public, anon;
revoke execute on function public.set_memo_draft(boolean, text) from public, anon;
grant execute on function public.signup_complete(text, text, text[], text) to authenticated;
grant execute on function public.set_memo_draft(boolean, text) to authenticated;
