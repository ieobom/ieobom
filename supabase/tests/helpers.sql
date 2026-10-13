-- DB 검사 도움 함수. scripts/test-db.mjs가 검사 파일마다 맨 앞에 붙인다(pg_temp라 끝나면 사라진다).
--   select pg_temp.user_id('엄마')       이름으로 정해지는 시험용 사용자 ID
--   select pg_temp.make_user('엄마')     로그인 쪽(auth.users)에 시험용 사용자를 만든다
--   select pg_temp.login('엄마')         이 묶음의 남은 문장을 그 사용자로(authenticated) 실행
--   select pg_temp.logout()              로그인하지 않은 사람(anon)으로
--   reset role;                          원래(관리자)로 돌아오기
--
-- 남의 줄을 못 바꾸는지는 is_empty($$ update … returning 1 $$, …)로 본다(바뀐 줄이 없어야 함).

create function pg_temp.user_id(name text) returns uuid
language sql immutable as $$ select md5('ieobom-test:' || name)::uuid $$;

create function pg_temp.make_user(name text) returns uuid
language sql as $$
  insert into auth.users (id, aud, role, email)
  values (pg_temp.user_id(name), 'authenticated', 'authenticated', md5(name) || '@test.ieobom')
  on conflict (id) do nothing;
  select pg_temp.user_id(name);
$$;

create function pg_temp.login(name text) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', pg_temp.user_id(name), 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

create function pg_temp.logout() returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  select set_config('role', 'anon', true);
$$;
