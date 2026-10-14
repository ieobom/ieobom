-- 홈 질문 카드에 '먼저 온 답'(received)을 더한다(39차 '지난 질문 · 먼저 온 답').
-- 상대가 먼저 보냈는데 내가 답하기 전에 다음 질문이 와서 끝난 질문. 답할 수 없고 '확인했어요'를 누르면 빠진다.

-- at: 이 때 기준으로 계산(검사용, 기본은 지금)
create or replace function public.home(at timestamptz default now()) returns jsonb
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
        cards := cards || jsonb_build_object('kind', 'free_now', 'from', ov.next_starts_at, 'until', ov.next_ends_at);
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
            todo := jsonb_build_object('kind', 'question', 'state', 'ask_early', 'question_id', prev.id, 'seq_no', prev.seq_no, 'text', prev.text,
              'my_answer', mine.text);
          end if;
        end if;
        -- 먼저 온 답: 상대가 먼저 보냈는데 내가 답하기 전에 질문이 끝남. '확인했어요'(see_question)까지
        if todo is null and prev.id is not null and prev.status = 'closed' and prev.opened_at is null
           and (case when fam.i_am_child then prev.child_seen_at else prev.parent_seen_at end) is null
           and not exists (select 1 from public.answers a where a.exchange_question_id = prev.id and a.user_id = uid) then
          select * into theirs from public.answers a where a.exchange_question_id = prev.id and a.user_id <> uid and a.visible_to_partner;
          if theirs.id is not null then
            todo := jsonb_build_object('kind', 'question', 'state', 'received', 'question_id', prev.id, 'seq_no', prev.seq_no, 'text', prev.text,
              'partner_answer', theirs.text);
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
          todo := jsonb_build_object('kind', 'question', 'state', todo_state, 'question_id', q.id, 'seq_no', q.seq_no, 'text', q.text,
            'source', case when q.custom_question_id is not null then 'custom' else 'bank' end,
            'my_answer', mine.text, 'partner_answer', theirs.text);
        end if;
      end if;
      if todo is not null then
        cards := cards || todo;
      end if;

      -- 4 새 근황: 상대가 보낸 것 중 아직 '확인했어요' 안 한 것, 최근 것부터
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', n.id, 'text', n.text, 'topic', n.topic, 'at', n.created_at,
        'thumbs', coalesce((select jsonb_agg(p.thumb_path order by p.sort) from public.news_photos p where p.news_id = n.id), '[]'::jsonb),
        -- 이 근황으로 만든 여쭤볼 이야기(아직 안 여쭤본 것)
        'talk', (select s.text from public.talk_suggestions s where s.news_id = n.id and s.owner_id = uid and s.asked_on is null limit 1)
      ) order by n.created_at desc), '[]'::jsonb) into news_ids
      from public.news n where n.relationship_id = fam.id and n.author_id = partner and n.seen_at is null;
      if jsonb_array_length(news_ids) > 0 then
        cards := cards || jsonb_build_object('kind', 'news', 'news_ids', (select jsonb_agg(x -> 'id') from jsonb_array_elements(news_ids) x), 'items', news_ids);
      end if;

      -- 5 통화 메모 초안: 저장하지 않은 초안, 3일 안
      select count(*) into draft_count from public.memo_drafts d
      where d.relationship_id = fam.id and d.user_id = uid and d.status = 'ready' and d.expires_at > at;
      if draft_count > 0 then
        select * into latest_draft from public.memo_drafts d
        where d.relationship_id = fam.id and d.user_id = uid and d.status = 'ready' and d.expires_at > at
        order by d.created_at desc limit 1;
        cards := cards || jsonb_build_object('kind', 'memo_draft', 'draft_id', latest_draft.id, 'call_id', latest_draft.call_id, 'count', draft_count,
          'text', latest_draft.text, 'at', latest_draft.created_at);
      end if;

      -- 6 할 일이 없으면 기다림 카드를 맨 뒤에(질문 카드는 늘 있음)
      sent_today := exists (select 1 from public.exchange_questions x where x.relationship_id = fam.id and x.sent_on = today);
      if todo is null then
        if q.id is not null and q.status = 'waiting' then
          cards := cards || jsonb_build_object('kind', 'question', 'state', 'waiting', 'question_id', q.id, 'seq_no', q.seq_no, 'text', q.text,
            'my_answer', (select a.text from public.answers a where a.exchange_question_id = q.id and a.user_id = uid));
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
      -- 질문 카드 '다음 질문'의 이어온 기록: 함께 답한 질문 · 남긴 메모
      'answered_together', (select count(*) from public.exchange_questions x where x.relationship_id = fam.id and x.opened_at is not null),
      'memo_count', (select count(*) from public.memos m where m.relationship_id = fam.id and m.user_id = uid),
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

