-- 10-9 문의에 앱 버전과 휴대폰 종류를 같이 받는다(39차 '앱 버전과 휴대폰 종류도 함께 보내요'). 답할 때 원인을 찾기 쉽다.

alter table public.inquiries
  add column app_version text not null default '' check (char_length(app_version) <= 30),
  -- 휴대폰 종류와 OS 버전 (예: 'ios 18.2' · 'android 15')
  add column device text not null default '' check (char_length(device) <= 60);

grant insert (app_version, device) on public.inquiries to authenticated;
