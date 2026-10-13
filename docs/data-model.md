# 이어봄 데이터 구조

- 기준: `../../설계/19_이어봄_ERD.html`(38차, 표 · 칸의 뜻) + 새 39차 시안 + [dev-plan.md](dev-plan.md) 1장 결정
- 이 문서에는 **19 ERD와 달라진 점**과 **표마다 누가 읽고 쓰는지**만 적는다. 칸의 뜻은 19 ERD를 본다.
- 실제 모양은 `supabase/migrations/`이 정답이다. 표를 바꾸면 이 문서도 고친다.

## 1. 공통 규칙

- 모든 표는 `public`에 두고 보는 사람 규칙(RLS)을 켠다. 앱 사용자(`authenticated`)에게는 필요한 읽기 · 쓰기만 열고, 나머지는 막는다(`revoke`).
- 두 사람의 데이터가 함께 바뀌는 일(답 열기, 초대 연결, 통화 상태)은 앱이 표에 바로 쓰지 않고 **DB 함수**로만 한다. 함수가 부른 사람(`auth.uid()`)과 연결을 확인한다.
- 규칙은 다른 표를 뒤지지 않게 단순하게 둔다. 그래서 자주 확인하는 값은 줄에 같이 적어 둔다(예: 답의 `relationship_id`, `visible_to_partner`).
- 상태 · 종류 값은 영어 코드로 저장하고(`check`로 묶음), 화면 글자는 앱의 `src/copy/ko.ts`가 정한다.
- 날짜 계산(질문 오는 날, 알림 시각, 설문 차수)은 한국 시간(`Asia/Seoul`)으로 한다.
- 고유 번호는 `uuid`(`gen_random_uuid()`), 때는 `timestamptz`.
- DB 함수의 오류는 `message`에 영어 code를 담는다(예: `unauthorized`, `not_signed_up`). 앱은 code로 `ko.error` 문구를 고른다.
- 앱이 부르는 DB 함수는 `security definer`로 두고 함수 안에서 `auth.uid()`를 확인한다. `anon`에게는 실행 권한을 주지 않는다. `pnpm supabase db advisors --linked`의 '0029 Signed-In Users Can Execute SECURITY DEFINER Function' 경고는 이 함수들이라 의도한 것이다.

## 2. 19 ERD에서 바뀐 점

| 표 | 바뀐 점 | 이유 |
|---|---|---|
| `users` | `kakao_id` 뺌. `memo_draft_on`(통화 메모 초안 켬) 더함 | 카카오 회원번호는 로그인 쪽(Auth)에만(계획 1장). 39차 [선택] 동의 |
| `consents` | 문서에 `memo_draft`(선택) 더함, `withdrawn_at`(철회한 때) 더함 | 마이에서 끄면 철회로 남긴다 |
| `devices` | `install_id`(앱이 만든 기기 번호), `last_active_at` 더함 | 같은 휴대폰에서 다시 로그인해도 줄이 늘지 않게. 전화는 가장 최근 휴대폰 하나로 |
| `relationships` | 상태에 `left`(상대 탈퇴) 더함. 탈퇴하면 그 사람 칸만 비움 | ERD 7-1 |
| `code_attempts` | 새로 | 초대 코드 10분 5번 틀리면 막기(ERD 7-3) |
| `calls` | `caller_draft_on` · `callee_draft_on`(받는 순간 값), `recording` 상태 더함 | 두 사람 모두 켰을 때만 녹음, 안내 문구(내가 끔 · 상대가 끔) |
| `call_transcripts` | 새로 (서버만) | 녹음을 글로 바꾼 것을 초안 만들 때까지만 둔다. 만들면 지운다 |
| `exchange_questions` | `text`(보낸 질문 문장) · `opened_at` 더함 | 앱은 질문 목록(`question_bank`)을 못 읽어서, 보낸 문장을 줄에 남긴다 |
| `answers` | `relationship_id` · `visible_to_partner` 더함 | 상대에게 보이는지를 규칙이 칸 하나로 확인 |
| `memos` | `memo_date` · `written_from` · `method` · `summary` 뺌. `version` 더함, `ai_status` → `suggest_status` | 39차: 메모장 · 메모 쓰기 · 기억해 둘 것 없음, 통화 뒤 글로만 |
| `memo_drafts` | 새로 | 통화 메모 초안. 사람마다 따로, 나만 봄, 3일 |
| `news` | `topic`은 칩 또는 직접 쓰기(12자), `topic_by`에 `custom` 더함 | 39차 '+ 직접 쓰기' |
| `news_photos` | `ai_tag` 뺌, `thumb_path` 더함 | 사진 AI 태그 뺌(계획 1장), 작은 그림(9-1) |
| `app_config` · `client_errors` · `usage` | 새로 | 기능 켜고 끄기(1-9), 앱 오류 기록(11-3), 사용량(11-1) |
| `calendar_links` · `timing_feedback` | 만들지 않음 | 시범 운영 뒤 |

## 3. 누가 읽고 쓰나

'함수'는 DB 함수로만 바꾼다는 뜻이다. '서버'는 서버 함수 · 정해진 시간 작업(비밀 키)만 쓴다는 뜻이다.

| 표 | 읽기 | 쓰기 | 커밋 |
|---|---|---|---|
| `app_config` | 누구나 | 서버 | 1-9 |
| `users` | 나 (가족 이름은 함수로) | 내 이름 · 글자 크게 · 알림만 바로, 가입 · 초안 켜기는 함수 | 2-2 |
| `consents` | 나 | 함수 | 2-2 |
| `devices` | 없음 | 함수(등록 · 지우기) | 2-2 |
| `relationships` | 두 사람 | 함수 | 2-3 |
| `relationship_settings` | 나 | 나 (횟수 바꾸기는 함수) | 2-4 |
| `invites` | 만든 사람 | 함수 | 2-4 |
| `code_attempts` | 없음 | 함수 | 2-4 |
| `call_times` | 나 · 이어진 가족 | 나 (3개까지) | 2-5 |
| `calls` | 두 사람 | 함수 · 서버 | 2-5 |
| `call_transcripts` | 없음 | 서버 | 2-5 |
| `question_bank` | 예시 질문만 | 서버 | 2-6 |
| `exchange_questions` | 두 사람 | 함수 · 서버 | 2-6 |
| `answers` | 나 · 상대에게 보이게 된 답 | 함수 | 2-6 |
| `custom_questions` | 만든 사람 (상대는 함수로 날짜만) | 함수 | 2-6 |
| `memos` | 나 | 함수 | 2-7 |
| `memo_drafts` | 나 | 함수 · 서버 | 2-7 |
| `talk_suggestions` | 나 | 함수 · 서버 | 2-7 |
| `news` · `news_photos` | 두 사람 | 함수 | 2-8 |
| 저장소 `news-photos` | 두 사람 (경로의 연결 ID로) | 이어진 두 사람만 올리기 | 2-8 |
| `notices` | 누구나 (보일 때만) | 서버 | 2-9 |
| `notice_reads` | 나 | 나 | 2-9 |
| `inquiries` | 나 | 나 (보내기만) | 2-9 |
| `survey_questions` | 누구나 | 서버 | 2-9 |
| `survey_responses` | 나 | 나 (차수마다 한 번) | 2-9 |
| `client_errors` | 없음 | 누구나 (쓰기만) | 2-9 |
| `push_log` · `events` · `usage` | 없음 | 서버 · 함수 | 2-9 |

## 4. 탈퇴하면

- 내 줄은 지운다: `users`(→ `consents` · `devices` · `relationship_settings` · `call_times` · `memos` · `memo_drafts` · `talk_suggestions` · `notice_reads` · `survey_responses` · `push_log`), 내가 쓴 `answers` · `news`(사진 파일 포함) · `custom_questions`.
- 가족 연결 줄은 남기고 내 칸만 비운다(`status = left`). 남은 사람에게는 '연결이 끊겼어요'와 자기 기록만 남는다(39차).
- `calls`는 30일 보관이 지나면 지운다. 탈퇴한 사람 칸은 비운다.
- `inquiries`는 1년 보관 동안 보낸 사람 칸만 비운다.
