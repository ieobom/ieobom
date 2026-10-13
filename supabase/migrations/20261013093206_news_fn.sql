-- 9-2 근황 만들기 · 지우기 · 확인했어요.
-- 앱이 근황 번호(news_id)를 먼저 정하고 사진을 news-photos/연결ID/근황ID/번호.jpg(작은 그림 번호_s.jpg)에 올린 뒤 부른다.
-- 여기서는 경로가 그 연결 · 그 근황의 것인지와 파일이 실제로 올라갔는지 본다. 지우면 줄만 지우고 파일은 9-6이 지운다.

create function public.create_news(
  news_id uuid,
  relationship uuid,
  text text default '',
  topic text default null,
  topic_by text default null,
  method text default 'text',
  photo_count int default 0
) returns public.news
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  body text := btrim(coalesce(create_news.text, ''));
  prefix text := relationship::text || '/' || news_id::text || '/';
  n public.news;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  if not public.is_connected(relationship) then
    raise exception 'not_connected';
  end if;
  if photo_count not between 0 and 3 then
    raise exception 'too_many_photos';
  end if;
  if photo_count > 0 and not public.feature_enabled('news_photos') then
    raise exception 'photos_disabled';
  end if;
  if body = '' and photo_count = 0 then
    raise exception 'empty_news';
  end if;
  -- 사진만 보낼 때는 주제를 고른다(사진은 AI가 보지 않음)
  if body = '' and topic is null then
    raise exception 'topic_required';
  end if;
  if topic is not null and (topic_by is null or topic_by not in ('chip', 'custom')) then
    raise exception 'invalid_topic_by';
  end if;
  if topic_by = 'chip' and topic not in ('일·학교', '건강', '취미·운동', '먹은 것', '다녀온 곳', '가족·친구') then
    raise exception 'invalid_topic';
  end if;
  -- 올린 파일이 모두 있어야 한다
  if photo_count > 0 and (
    select count(*) from storage.objects o
    where o.bucket_id = 'news-photos'
      and o.name in (
        select prefix || i || suffix from generate_series(1, photo_count) as i cross join (values ('.jpg'), ('_s.jpg')) as s (suffix)
      )
  ) <> photo_count * 2 then
    raise exception 'photos_not_uploaded';
  end if;

  insert into public.news (id, relationship_id, author_id, text, topic, topic_by, method)
  values (news_id, relationship, uid, body, btrim(topic), topic_by, create_news.method)
  returning * into n;

  insert into public.news_photos (news_id, relationship_id, file_path, thumb_path, sort)
  select news_id, relationship, prefix || i || '.jpg', prefix || i || '_s.jpg', i
  from generate_series(1, photo_count) as i;
  return n;
end;
$$;

create function public.delete_news(news_id uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.news n where n.id = delete_news.news_id and n.author_id = auth.uid();
  if not found then
    raise exception 'news_not_found';
  end if;
end;
$$;

-- 받은 근황에 '확인했어요'(홈 '새 근황' 카드가 빠진다)
create function public.see_news(news_id uuid) returns void
language sql
security definer
set search_path = ''
as $$
  update public.news n set seen_at = now()
  where n.id = see_news.news_id and n.author_id <> auth.uid() and n.seen_at is null and public.is_member(n.relationship_id);
$$;

revoke execute on function public.create_news(uuid, uuid, text, text, text, text, int) from public, anon;
revoke execute on function public.delete_news(uuid) from public, anon;
revoke execute on function public.see_news(uuid) from public, anon;
grant execute on function public.create_news(uuid, uuid, text, text, text, text, int) to authenticated;
grant execute on function public.delete_news(uuid) to authenticated;
grant execute on function public.see_news(uuid) to authenticated;
