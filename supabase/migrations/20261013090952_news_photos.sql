-- 2-8 근황 · 근황 사진 · 사진 저장소(news-photos).
-- 근황 만들기 · 지우기는 DB 함수(9-2)가 한다. 사진 파일은 앱이 저장소에 바로 올리고, 남는 파일은 9-6이 지운다.

-- 글자를 uuid로. 아니면 null (저장소 경로의 연결 ID 확인용)
create function public.try_uuid(value text) returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

-- ── 근황 ───────────────────────────────────────
create table public.news (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  -- 쓴 사람이 탈퇴하면 그 근황도 지운다(남은 사람에게는 자기 기록만 남음, 39차)
  author_id uuid not null references public.users (id) on delete cascade,
  -- 한 줄. 사진만 보내도 됨(함수가 글 · 사진 중 하나는 있는지 본다)
  text text not null default '' check (char_length(text) <= 300),
  -- 주제: 칩(일·학교 …) 또는 직접 쓰기(12자까지)
  topic text check (char_length(btrim(topic)) between 1 and 12),
  -- chip 칩을 고름 · custom 직접 씀 · rule 낱말 규칙 · ai AI가 고름
  topic_by text check (topic_by in ('chip', 'custom', 'rule', 'ai')),
  method text not null default 'text' check (method in ('text', 'voice')),
  created_at timestamptz not null default now(),
  -- 상대가 본 때('확인했어요'). 보면 홈 '새 근황' 카드가 빠진다
  seen_at timestamptz,
  check ((topic is null) = (topic_by is null)),
  unique (id, relationship_id)
);

comment on table public.news is '근황 (계획 2-8). 두 사람이 읽는다. 쓰기 · 지우기는 함수로만.';

create index news_relationship_idx on public.news (relationship_id, created_at desc);
create index news_author_idx on public.news (author_id);

alter table public.news enable row level security;
revoke all on public.news from anon, authenticated;
grant select on public.news to authenticated;
create policy "두 사람이 읽기" on public.news for select to authenticated using (public.is_member(relationship_id));

-- ── 근황 사진 ───────────────────────────────────
create table public.news_photos (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null,
  -- 규칙이 근황 표를 뒤지지 않게 연결을 같이 적는다(근황의 연결과 같아야 함)
  relationship_id uuid not null,
  -- 저장소 경로: 연결ID/근황ID/번호.jpg, 작은 그림은 연결ID/근황ID/번호_s.jpg. 위치 정보를 지우고 올린다
  file_path text not null unique,
  thumb_path text not null unique,
  sort int not null check (sort between 1 and 3),
  unique (news_id, sort),
  foreign key (news_id, relationship_id) references public.news (id, relationship_id) on delete cascade
);

comment on table public.news_photos is '근황 사진 (계획 2-8). 근황 하나에 3장까지. 두 사람이 읽는다.';

alter table public.news_photos enable row level security;
revoke all on public.news_photos from anon, authenticated;
grant select on public.news_photos to authenticated;
create policy "두 사람이 읽기" on public.news_photos for select to authenticated using (public.is_member(relationship_id));

-- 여쭤볼 이야기 → 받은 근황 (2-7에서 칸만 만들어 둔 것)
alter table public.talk_suggestions
  add constraint talk_suggestions_news_id_fkey foreign key (news_id) references public.news (id) on delete cascade;

-- ── 사진 저장소 ─────────────────────────────────
-- 비공개. 휴대폰에서 줄여 올리므로(약 0.2MB) 한 장 2MB까지, JPEG만
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-photos', 'news-photos', false, 2097152, array['image/jpeg']);

-- 경로의 첫 칸(연결 ID)으로 권한을 본다. 받기는 끊긴 연결도 되고, 올리기는 이어진 연결만
create policy "근황 사진 받기" on storage.objects for select to authenticated
  using (bucket_id = 'news-photos' and public.is_member(public.try_uuid((storage.foldername(name))[1])));
create policy "근황 사진 올리기" on storage.objects for insert to authenticated
  with check (bucket_id = 'news-photos' and public.is_connected(public.try_uuid((storage.foldername(name))[1])));
