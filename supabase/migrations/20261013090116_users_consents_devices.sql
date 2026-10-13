-- 2-2 사용자 · 동의 · 기기. 칸의 뜻은 19 ERD, 누가 읽고 쓰나는 docs/data-model.md.
-- DB 함수의 오류는 message에 영어 code를 담는다(앱이 ko.ts에서 문구를 고른다).

-- ── 사용자 ─────────────────────────────────────
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  -- 가족에게 보일 이름. 빈 이름은 저장 안 됨. 카카오 닉네임 최대 길이(20자)에 맞춤
  name text not null check (char_length(btrim(name)) between 1 and 20),
  side text not null check (side in ('child', 'parent')),
  large_text boolean not null default false,
  notify_on boolean not null default true,
  -- 하루 한 번 알림 시각: 아침 8시 · 낮 12시 · 저녁 7시(기본) · 밤 9시
  notify_time time not null default '19:00' check (notify_time in ('08:00', '12:00', '19:00', '21:00')),
  -- 통화 메모 초안 켬(가입 때 [선택] 동의, 마이에서 끄기). 바꾸기는 set_memo_draft()로만
  memo_draft_on boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.users is '사용자 (계획 2-2). 나만 읽는다. 가족 이름은 DB 함수로.';

alter table public.users enable row level security;
revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;
-- 앱이 바로 바꿀 수 있는 칸만 연다. 가입 · 초안 켜기 · 자녀/부모님은 함수로만
grant update (name, large_text, notify_on, notify_time) on public.users to authenticated;

create policy "나만 읽기" on public.users for select to authenticated using (id = (select auth.uid()));
create policy "나만 고치기" on public.users for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ── 동의 기록 ───────────────────────────────────
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  -- 만 14세 · 이용약관 · 개인정보 · AI 사용 안내(필수) · 통화 메모 초안(선택)
  doc text not null check (doc in ('age14', 'terms', 'privacy', 'ai', 'memo_draft')),
  version text not null,
  agreed_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index consents_user_idx on public.consents (user_id);

alter table public.consents enable row level security;
revoke all on public.consents from anon, authenticated;
grant select on public.consents to authenticated;
create policy "나만 읽기" on public.consents for select to authenticated using (user_id = (select auth.uid()));

-- ── 기기 ───────────────────────────────────────
-- 앱은 읽지 못하고 register_device · unregister_device로만 바꾼다. 전화는 last_active_at이 가장 최근인 기기 하나로 울린다
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  -- 앱을 처음 열 때 만들어 보안 저장소에 두는 기기 번호. 같은 휴대폰에서 다시 로그인해도 줄이 늘지 않는다
  install_id text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  app_version text not null default '',
  push_token text,
  call_token text,
  last_active_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index devices_user_idx on public.devices (user_id, last_active_at desc);

alter table public.devices enable row level security;
revoke all on public.devices from anon, authenticated;

-- 앱을 열 때마다 부른다. 다른 계정이 쓰던 휴대폰이면 이 계정으로 옮긴다. 토큰을 빼고 부르면 전 값을 둔다
create function public.register_device(
  install_id text,
  platform text,
  app_version text,
  push_token text default null,
  call_token text default null
) returns void
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
  if not exists (select 1 from public.users u where u.id = uid) then
    raise exception 'not_signed_up';
  end if;
  insert into public.devices as d (user_id, install_id, platform, app_version, push_token, call_token)
  values (uid, register_device.install_id, register_device.platform, register_device.app_version,
          register_device.push_token, register_device.call_token)
  on conflict on constraint devices_install_id_key do update set
    user_id = excluded.user_id,
    platform = excluded.platform,
    app_version = excluded.app_version,
    push_token = coalesce(excluded.push_token, d.push_token),
    call_token = coalesce(excluded.call_token, d.call_token),
    last_active_at = now(),
    updated_at = now();
end;
$$;

-- 로그아웃할 때 부른다(계획 3-5). 이 기기로 전화 · 알림이 더 오지 않는다
create function public.unregister_device(install_id text) returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.devices d where d.install_id = unregister_device.install_id and d.user_id = auth.uid();
$$;

revoke execute on function public.register_device(text, text, text, text, text) from public, anon;
revoke execute on function public.unregister_device(text) from public, anon;
grant execute on function public.register_device(text, text, text, text, text) to authenticated;
grant execute on function public.unregister_device(text) to authenticated;
