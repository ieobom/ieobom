begin;
select plan(13);

select pg_temp.make_user('자녀');
select pg_temp.make_user('엄마');

select pg_temp.login('자녀');
select throws_ok($$ select public.signup_complete('아영', 'child', array['terms', 'privacy', 'ai']) $$,
  'P0001', 'consent_required', '만 14세 확인이 빠지면 거절');
select throws_ok($$ select public.signup_complete('아영', 'child', array['age14', 'terms', 'privacy', 'ai', 'marketing']) $$,
  'P0001', 'unknown_consent', '모르는 동의는 거절');
select throws_ok($$ select public.signup_complete('   ', 'child', array['age14', 'terms', 'privacy', 'ai']) $$,
  '23514', null, '빈 이름은 거절');
select is((select name from public.signup_complete('  아영 ', 'child', array['age14', 'terms', 'privacy', 'ai'])), '아영', '이름 앞뒤 빈칸을 지우고 가입');
select is((select count(*)::int from public.consents), 4, '필수 동의 4개를 남긴다');
select ok((select not memo_draft_on and not large_text from public.users), '선택을 안 고르면 초안 꺼짐, 자녀는 글자 보통');
select throws_ok($$ select public.signup_complete('아영', 'child', array['age14', 'terms', 'privacy', 'ai']) $$,
  'P0001', 'already_signed_up', '두 번 가입하지 않는다');

select pg_temp.login('엄마');
select public.signup_complete('김순자', 'parent', array['age14', 'terms', 'privacy', 'ai', 'memo_draft']);
select ok((select memo_draft_on and large_text from public.users), '선택 동의하면 초안 켜짐, 부모님은 처음부터 글자 크게');
select is((select count(*)::int from public.consents where doc = 'memo_draft' and withdrawn_at is null), 1, '선택 동의도 남긴다');

-- 마이에서 끄고 다시 켜기
select public.set_memo_draft(false);
select ok((select not memo_draft_on from public.users), '끄면 초안 꺼짐');
select is((select count(*)::int from public.consents where doc = 'memo_draft' and withdrawn_at is not null), 1, '끄면 철회로 남긴다');
select public.set_memo_draft(true);
select is((select count(*)::int from public.consents where doc = 'memo_draft' and withdrawn_at is null), 1, '다시 켜면 새로 동의한다');

select pg_temp.logout();
select throws_ok($$ select public.signup_complete('누구', 'child', array['age14', 'terms', 'privacy', 'ai']) $$,
  '42501', null, '로그인 전에는 못 부른다');
reset role;

select * from finish();
rollback;
