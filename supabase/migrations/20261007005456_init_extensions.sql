-- 1-1 첫 마이그레이션: 개발 DB 연결 확인과 RLS 규칙 검사 도구(pgTAP)
create extension if not exists pgtap with schema extensions;
