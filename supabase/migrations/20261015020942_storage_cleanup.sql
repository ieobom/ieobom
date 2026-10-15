-- 7-11 · 9-6 남은 파일 지우기. 저장소 파일은 SQL로 바로 지울 수 없어서, 정해진 시간 작업이 서버 함수(jobs)를 부르고
-- 서버 함수가 여기서 지울 목록을 받아 Storage API로 지운다.
--   통화 녹음(call-audio): 글로 바꾸면 바로 지우는데(7-6) 1시간 넘게 남은 것
--   근황 사진(news-photos): 지운 근황(탈퇴 포함)의 사진, 근황 줄 없이 하루 넘게 남은 올리다 만 사진
-- 저장 안 하고 3일 지난 통화 메모 초안은 줄만 지우면 되어서 보관 기간 지우기(purge_expired)에 더한다.

create extension if not exists pg_net with schema extensions;

-- 지운 근황 사진의 경로. 줄이 지워질 때 남기고, 서버 함수가 파일을 지운 뒤 비운다
create table private.storage_trash (
  bucket text not null,
  name text not null,
  added_at timestamptz not null default now(),
  primary key (bucket, name)
);

create function private.news_photos_to_trash() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.storage_trash (bucket, name)
  values ('news-photos', old.file_path), ('news-photos', old.thumb_path)
  on conflict do nothing;
  return old;
end;
$$;

create trigger news_photos_to_trash after delete on public.news_photos
for each row execute function private.news_photos_to_trash();

-- 지울 파일 목록(저장소마다 최대 limit_n개). 서버(비밀 키)만 부른다
create function public.storage_cleanup_targets(at timestamptz default now(), limit_n int default 1000) returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'call_audio', (
      select coalesce(jsonb_agg(o.name), '[]'::jsonb) from (
        select o.name from storage.objects o
        where o.bucket_id = 'call-audio' and o.created_at < at - interval '1 hour'
        order by o.created_at limit limit_n
      ) o
    ),
    'news_photos', (
      select coalesce(jsonb_agg(x.name), '[]'::jsonb) from (
        select t.name from private.storage_trash t where t.bucket = 'news-photos'
        union
        select o.name from storage.objects o
        where o.bucket_id = 'news-photos' and o.created_at < at - interval '1 day'
          and not exists (select 1 from public.news_photos p where p.file_path = o.name or p.thumb_path = o.name)
        limit limit_n
      ) x
    )
  )
$$;

-- 지운 파일을 지울 목록에서 뺀다
create function public.storage_cleanup_done(bucket text, names text[]) returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  delete from private.storage_trash t where t.bucket = storage_cleanup_done.bucket and t.name = any (names);
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.storage_cleanup_targets(timestamptz, int) from public, anon, authenticated;
revoke execute on function public.storage_cleanup_done(text, text[]) from public, anon, authenticated;
grant execute on function public.storage_cleanup_targets(timestamptz, int) to service_role;
grant execute on function public.storage_cleanup_done(text, text[]) to service_role;

-- 정해진 시간 작업이 서버 함수를 부른다. 프로젝트 주소와 부를 때 쓰는 열쇠는 금고(Vault)에 둔다:
--   project_url (https://….supabase.co) · cron_key (서버 함수의 CRON_SECRET과 같은 값)
-- 둘 중 하나라도 없으면 부르지 않고 경고만 남긴다(운영 메모 11-6에 넣는 법)
create function private.call_function(fn text, body jsonb default '{}'::jsonb) returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  url text := (select s.decrypted_secret from vault.decrypted_secrets s where s.name = 'project_url');
  key text := (select s.decrypted_secret from vault.decrypted_secrets s where s.name = 'cron_key');
begin
  if url is null or key is null then
    raise warning 'vault secrets project_url, cron_key are needed to call %', fn;
    return null;
  end if;
  return net.http_post(
    url := rtrim(url, '/') || '/functions/v1/' || fn,
    body := body,
    headers := jsonb_build_object('content-type', 'application/json', 'authorization', 'Bearer ' || key),
    timeout_milliseconds := 60000
  );
end;
$$;

-- 매일 새벽 4시 30분(한국) = 19시 30분(UTC). 보관 기간 지우기(4시) 뒤
select cron.schedule('storage-cleanup', '30 19 * * *', $$ select private.call_function('jobs', '{"job": "storage_cleanup"}') $$);

-- 보관 기간 지우기에 3일 지난 초안(저장한 것은 빼고)을 더한다
create or replace function public.purge_expired(at timestamptz default now()) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  calls_n int;
  events_n int;
  inquiries_n int;
  push_n int;
  errors_n int;
  attempts_n int;
  drafts_n int;
begin
  delete from public.calls where started_at < at - interval '30 days';
  get diagnostics calls_n = row_count;
  delete from public.events where created_at < at - interval '6 months';
  get diagnostics events_n = row_count;
  delete from public.inquiries where coalesce(answered_at, created_at) < at - interval '1 year';
  get diagnostics inquiries_n = row_count;
  delete from public.push_log where sent_at < at - interval '30 days';
  get diagnostics push_n = row_count;
  delete from public.client_errors where created_at < at - interval '90 days';
  get diagnostics errors_n = row_count;
  delete from public.code_attempts where attempted_at < at - interval '1 day';
  get diagnostics attempts_n = row_count;
  delete from public.memo_drafts where expires_at < at and status <> 'saved';
  get diagnostics drafts_n = row_count;
  return jsonb_build_object('calls', calls_n, 'events', events_n, 'inquiries', inquiries_n,
                            'push_log', push_n, 'client_errors', errors_n, 'code_attempts', attempts_n,
                            'memo_drafts', drafts_n);
end;
$$;
