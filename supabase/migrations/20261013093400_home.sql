-- 10-1 홈 한 번에 불러오기 (10-2 홈 카드 빼기 규칙 포함).
-- 39차 시안 #20의 기준표: 가족마다 카드 줄을 '급한 것부터' 돌려준다. 같은 종류는 한 장이고 질문 카드는 늘 있다.
--   1 missed_call   못 받은 전화        다시 걸거나 '확인했어요'(see_missed_call), 아니면 다음 날 빠짐
--   2 free_now      지금 둘 다 편한 시간  그 시간이 끝나거나 그 시간에 통화하면 빠짐
--   3 question      질문 · 할 일        state: new(새 질문) · partner_sent_first(상대가 먼저 보냄) · opened(둘 다 답함) · ask_early(먼저 보낼까요)
--   4 news          새 근황            '확인했어요'(see_news)
--   5 memo_draft    통화 메모 초안       저장하거나 지우면, 아니면 3일 뒤
--   6 question      질문 · 기다림       state: waiting(답 기다림) · next(다음 질문 날짜). 할 일이 없을 때 맨 뒤에
-- 상대가 탈퇴한 연결은 partner_left 카드 하나. 끊은 연결은 홈에 나오지 않는다.

-- at: 이 때 기준으로 계산(검사용, 기본은 지금)
create function public.home(at timestamptz default now()) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  today date := (at at time zone 'Asia/Seoul')::date;
  fam record;
  partner uuid;
  cards jsonb;
  families jsonb := '[]'::jsonb;
  missed public.calls;
  ov record;
  q public.exchange_questions;
  prev public.exchange_questions;
  mine public.answers;
  theirs public.answers;
  my_seen timestamptz;
  todo jsonb;
  todo_state text;
  news_ids jsonb;
  draft_count int;
  latest_draft public.memo_drafts;
  sent_today boolean;
  my_custom public.custom_questions;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;

  for fam in
    select r.*, r.child_id = uid as i_am_child
    from public.relationships r
    where uid in (r.child_id, r.parent_id) and r.status in ('connected', 'left')
    order by r.connected_at
  loop
    partner := case when fam.i_am_child then fam.parent_id else fam.child_id end;
    cards := '[]'::jsonb;

    if fam.status = 'left' then
      cards := jsonb_build_array(jsonb_build_object('kind', 'partner_left'));
    else
      -- 1 못 받은 전화: 오늘(한국) 온 것, 그 뒤로 통화가 없을 때(다시 걸면 빠짐)
      select c.* into missed from public.calls c
      where c.relationship_id = fam.id and c.callee_id = uid and c.status = 'missed' and c.missed_seen_at is null
        and (c.started_at at time zone 'Asia/Seoul')::date = today
        and not exists (select 1 from public.calls x where x.relationship_id = fam.id and x.started_at > c.started_at)
      order by c.started_at desc limit 1;
      if missed.id is not null then
        cards := cards || jsonb_build_object('kind', 'missed_call', 'call_id', missed.id, 'at', missed.started_at);
      end if;

      -- 2 지금 둘 다 편한 시간: 그 시간에 통화했으면 빠짐
      select * into ov from public.call_time_overlap(fam.id, at);
      if ov.free_now and not exists (
        select 1 from public.calls x where x.relationship_id = fam.id and x.status = 'completed' and x.started_at >= ov.next_starts_at
      ) then
        cards := cards || jsonb_build_object('kind', 'free_now', 'until', ov.next_ends_at);
      end if;

      -- 3 질문 · 할 일 / 6 질문 · 기다림
      todo := null;
      select * into q from public.exchange_questions x where x.relationship_id = fam.id order by x.seq_no desc limit 1;
      -- 새 질문이 온 날, 지난 질문에 혼자 답해 두었으면 새 질문보다 먼저 그날 한 번 '먼저 보낼까요'
      if q.id is not null then
        select * into prev from public.exchange_questions x where x.relationship_id = fam.id and x.seq_no = q.seq_no - 1;
        if prev.id is not null and prev.status = 'closed' and prev.opened_at is null
           and (prev.closed_at at time zone 'Asia/Seoul')::date = today then
          select * into mine from public.answers a where a.exchange_question_id = prev.id and a.user_id = uid;
          if mine.id is not null and mine.early_choice is null
             and not exists (select 1 from public.answers a where a.exchange_question_id = prev.id and a.user_id <> uid) then
            todo := jsonb_build_object('kind', 'question', 'state', 'ask_early', 'question_id', prev.id, 'seq_no', prev.seq_no, 'text', prev.text);
          end if;
        end if;
      end if;
      if todo is null and q.id is not null and q.status <> 'closed' then
        mine := null;
        theirs := null;
        select * into mine from public.answers a where a.exchange_question_id = q.id and a.user_id = uid;
        select * into theirs from public.answers a where a.exchange_question_id = q.id and a.user_id <> uid and a.visible_to_partner;
        my_seen := case when fam.i_am_child then q.child_seen_at else q.parent_seen_at end;
        todo_state := case
          when mine.id is null and theirs.id is not null then 'partner_sent_first'
          when mine.id is null then 'new'
          when q.status = 'opened' and my_seen is null then 'opened'
          when q.status = 'waiting' and mine.early_choice is null and mine.answered_at <= at - interval '3 days' then 'ask_early'
        end;
        if todo_state is not null then
          todo := jsonb_build_object('kind', 'question', 'state', todo_state, 'question_id', q.id, 'seq_no', q.seq_no, 'text', q.text);
        end if;
      end if;
      if todo is not null then
        cards := cards || todo;
      end if;

      -- 4 새 근황: 상대가 보낸 것 중 아직 '확인했어요' 안 한 것, 최근 것부터
      select coalesce(jsonb_agg(n.id order by n.created_at desc), '[]'::jsonb) into news_ids
      from public.news n where n.relationship_id = fam.id and n.author_id = partner and n.seen_at is null;
      if jsonb_array_length(news_ids) > 0 then
        cards := cards || jsonb_build_object('kind', 'news', 'news_ids', news_ids);
      end if;

      -- 5 통화 메모 초안: 저장하지 않은 초안, 3일 안
      select count(*) into draft_count from public.memo_drafts d
      where d.relationship_id = fam.id and d.user_id = uid and d.status = 'ready' and d.expires_at > at;
      if draft_count > 0 then
        select * into latest_draft from public.memo_drafts d
        where d.relationship_id = fam.id and d.user_id = uid and d.status = 'ready' and d.expires_at > at
        order by d.created_at desc limit 1;
        cards := cards || jsonb_build_object('kind', 'memo_draft', 'draft_id', latest_draft.id, 'call_id', latest_draft.call_id, 'count', draft_count);
      end if;

      -- 6 할 일이 없으면 기다림 카드를 맨 뒤에(질문 카드는 늘 있음)
      sent_today := exists (select 1 from public.exchange_questions x where x.relationship_id = fam.id and x.sent_on = today);
      if todo is null then
        if q.id is not null and q.status = 'waiting' then
          cards := cards || jsonb_build_object('kind', 'question', 'state', 'waiting', 'question_id', q.id, 'seq_no', q.seq_no, 'text', q.text);
        else
          cards := cards || jsonb_build_object('kind', 'question', 'state', 'next',
            'next_on', public.next_question_day(fam.id, case when sent_today then today + 1 else today end));
        end if;
      end if;
    end if;

    select * into my_custom from public.custom_questions c
    where c.relationship_id = fam.id and c.author_id = uid and c.status = 'waiting';

    families := families || jsonb_build_object(
      'relationship_id', fam.id,
      'status', fam.status,
      'my_side', case when fam.i_am_child then 'child' else 'parent' end,
      'parent_kind', fam.parent_kind,
      -- 자녀 화면에는 부모님 이름 대신 엄마 · 아빠
      'partner_name', case when not fam.i_am_child then (select u.name from public.users u where u.id = fam.child_id) end,
      'days_together', today - (fam.connected_at at time zone 'Asia/Seoul')::date + 1,
      'next_question_on', public.next_question_day(fam.id, case when sent_today then today + 1 else today end),
      'my_custom_question', case when my_custom.id is not null then jsonb_build_object('id', my_custom.id, 'text', my_custom.text, 'send_on', my_custom.send_on) end,
      'partner_custom_question_on', (select c.send_on from public.custom_questions c
                                     where c.relationship_id = fam.id and c.author_id = partner and c.status = 'waiting'),
      'cards', cards
    );
  end loop;

  return jsonb_build_object(
    'families', families,
    -- 공지는 카드 줄이 아니라 제자리(39차). 보일 때이고 내가 '확인했어요' 안 한 것 하나
    'notice', (
      select jsonb_build_object('id', n.id, 'kind', n.kind, 'title', n.title, 'body', n.body, 'note', n.note)
      from public.notices n
      where at >= n.show_from and at < n.show_until
        and not exists (select 1 from public.notice_reads r where r.notice_id = n.id and r.user_id = uid)
      order by n.show_from desc limit 1
    )
  );
end;
$$;

revoke execute on function public.home(timestamptz) from public, anon;
grant execute on function public.home(timestamptz) to authenticated;
