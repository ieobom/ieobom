-- 1-9 기능 켜고 끄기 표. 앱을 다시 내지 않고 기능을 끄고 켠다.
-- 기본값은 모두 켬(시범 운영 첫날부터 모든 기능). 사고 때 Supabase 관리 화면에서 enabled를 끈다.
-- 앱(로그인 전 포함)은 읽기만 하고, 바꾸는 것은 관리 화면 · 서버(비밀 키)만 한다.

create table public.app_config (
  key text primary key,
  enabled boolean not null default true,
  -- 한도 같은 값 (예: 하루 횟수). 쓰는 곳에서 정한다
  value jsonb not null default '{}'::jsonb,
  note text not null default '',
  updated_at timestamptz not null default now()
);

comment on table public.app_config is '기능 켜고 끄기 (계획 1-9). 앱은 읽기만 한다.';

alter table public.app_config enable row level security;

create policy "누구나 읽기" on public.app_config for select to anon, authenticated using (true);

revoke insert, update, delete, truncate on public.app_config from anon, authenticated;

insert into public.app_config (key, note) values
  ('ai', 'AI 호출 전체 (통화 메모 초안 · 여쭤볼 이야기 · 근황 주제)'),
  ('call_recording', '통화 녹음 → 통화 메모 초안. 끄면 새 통화를 녹음하지 않음'),
  ('news_photos', '근황 사진 올리기');

-- 서버(DB 함수 · 정해진 시간 작업)에서 쓰는 확인 함수. 없는 이름은 꺼진 것으로 본다
create function public.feature_enabled(feature text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select c.enabled from public.app_config c where c.key = feature), false)
$$;
