-- 11-4 이용 기록 묶어 보내기. 앱이 모아 둔 기록을 한 번에 받아 events에 적는다.
-- 사람 표시(anon_id)는 서버만 아는 값으로 바꾼 것이라, 사용자 표와 이을 수 없다.
-- 운영 분석에 쓰도록 자녀 · 부모님 구분만 같이 적는다.

-- 앱(API)에 보이지 않는 칸. 서버 함수만 쓴다
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.secrets (
  key text primary key,
  value text not null
);

insert into private.secrets (key, value) values ('events_salt', encode(extensions.gen_random_bytes(32), 'hex'));

-- 사람마다 하루에 몇 개 적었는지 세는 데 쓴다
create index events_anon_idx on public.events (anon_id, created_at);

-- 받는 이름. 여기 없는 이름은 버린다(지난 버전 앱이 보내도 묶음 전체가 실패하지 않게)
--   app_open 앱 열기 · card_tap 홈 카드 누름 · call_tap 전화 걸기 단추 누름(통화로 보지 않음)
--   answer_sent 답 보냄 · question_made 질문 만듦 · news_sent 근황 보냄 · memo_saved 메모 저장
--   invite_issued 초대 코드 만듦 · invite_accepted 코드 넣어 이어짐 · signup_done 가입 끝
--   survey_sent 설문 보냄 · inquiry_sent 문의 보냄
create function public.log_events(items jsonb) returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  who text;
  my_side text;
  room int;
  item jsonb;
  at timestamptz;
  detail jsonb;
  n int := 0;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  if jsonb_typeof(items) is distinct from 'array' then
    raise exception 'invalid_events';
  end if;
  if jsonb_array_length(items) > 50 then
    raise exception 'too_many_events';
  end if;
  select u.side into my_side from public.users u where u.id = uid;
  if my_side is null then
    raise exception 'not_signed_up';
  end if;

  who := left(encode(extensions.hmac(uid::text, (select s.value from private.secrets s where s.key = 'events_salt'), 'sha256'), 'hex'), 32);
  -- 하루 500개까지. 넘으면 조용히 버린다
  room := 500 - (select count(*)::int from public.events e where e.anon_id = who and e.created_at > now() - interval '1 day');

  for item in select value from jsonb_array_elements(items) loop
    exit when n >= room;
    continue when jsonb_typeof(item) is distinct from 'object';
    continue when item ->> 'name' is null or item ->> 'name' not in (
      'app_open', 'card_tap', 'call_tap', 'answer_sent', 'question_made', 'news_sent', 'memo_saved',
      'invite_issued', 'invite_accepted', 'signup_done', 'survey_sent', 'inquiry_sent'
    );
    -- 앱에서 일어난 시각. 못 읽으면 지금, 앞날이면 지금, 7일 넘게 지난 것은 버린다
    begin
      at := least(coalesce((item ->> 'at')::timestamptz, now()), now());
    exception when others then
      at := now();
    end;
    continue when at < now() - interval '7 days';
    detail := case
      when jsonb_typeof(item -> 'detail') = 'object' and char_length((item -> 'detail')::text) <= 200 then item -> 'detail'
      else '{}'::jsonb
    end;
    insert into public.events (anon_id, name, detail, created_at)
    values (who, item ->> 'name', detail || jsonb_build_object('side', my_side), at);
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke execute on function public.log_events(jsonb) from public, anon;
grant execute on function public.log_events(jsonb) to authenticated;
