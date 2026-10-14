-- 7-1 통화 녹음 저장소(call-audio). LiveKit 녹음(7-2)이 S3 방식으로 바로 올리고, 글로 바꾸면 바로 지운다(7-6 · 7-11).
-- 앱은 읽기 · 쓰기 · 목록 모두 못 한다(규칙을 하나도 두지 않음 = 막힘). 서버(비밀 키)만 쓴다.
-- 경로: 통화ID/사람ID.ogg. 사람별 오디오(Opus) 15분이 약 4MB라 한 파일 50MB까지

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('call-audio', 'call-audio', false, 52428800, array['audio/ogg', 'audio/opus', 'audio/webm']);
