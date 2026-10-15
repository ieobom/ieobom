# 이어봄 운영 메모

운영팀이 Supabase 관리 화면에서 하는 일을 모았다(계획 11-6). 지금은 개발 프로젝트(`ieobom-dev`) 기준이고, 운영 프로젝트(12-5)가 생기면 같은 순서로 한다.

- 관리 화면: Supabase 대시보드 → 프로젝트 → **SQL Editor**(아래 SQL을 붙여 넣고 Run) 또는 **Table Editor**(표를 보며 칸을 고침)
- 아래 SQL은 SQL Editor의 **Saved** 에 이름을 붙여 저장해 두고 꺼내 쓴다.
- 표 · 칸의 뜻은 [data-model.md](data-model.md), 기능 이름은 `packages/shared/src/index.ts`를 본다.

## 1. 자주 하는 일

### 공지 올리기

홈 맨 위에 보일 때만 뜨고, 사람마다 '확인했어요'를 누르면 사라진다. 종류는 `maintenance`(점검) · `terms`(약관 변경) · `etc`(기타).

```sql
insert into public.notices (kind, title, body, note, show_from, show_until)
values ('maintenance', '점검 안내', '10월 20일 새벽 2시부터 30분 동안 앱을 쓸 수 없어요.', '급한 일은 휴대폰 전화로 연락해 주세요.',
        '2026-10-18 09:00+09', '2026-10-20 03:00+09');
```

### 문의 답하기

답을 적으면 앱의 '도움말 · 문의'에 보인다. 답이 오면 보내는 알림은 6-6을 붙이면 저절로 간다.

```sql
-- 아직 답하지 않은 문의
select id, help_item, body, app_version, device, created_at
from public.inquiries where answered_at is null order by created_at;

-- 답하기 (id는 위에서 복사)
update public.inquiries set answer = '알려 주셔서 고마워요. 다음 업데이트에서 고쳤어요.', answered_at = now()
where id = '여기에-문의-id';
```

### 질문 넣기 (계획 8-1)

팀이 검토한 질문만 `reviewed = true`로 넣는다. 정해진 시간 작업(새벽 5시)이 검토한 질문 중에서 두 사람이 피하는 주제를 빼고 보낸다. `topic`은 피하고 싶은 주제 중 하나이거나 빈칸(`null`)이다. 질문 만들기 화면의 예시로 보이게 하려면 `is_example = true`.

```sql
insert into public.question_bank (text, topic, reviewed, is_example) values
  ('어릴 때 가장 좋아했던 음식은 뭐예요?', null, true, true),
  ('요즘 몸은 어디가 제일 신경 쓰여요?', '건강', true, false);

-- 넣은 질문 보기
select text, topic, reviewed, is_example from public.question_bank order by created_at desc;
```

### 이용 설문 문항 고치기 · 결과 보기 (0 · 3 · 6주)

차수(`round`)마다 문항 3개가 있다. 점수는 문항 ID별로 모인다.

```sql
select round, sort, id, text from public.survey_questions order by round, sort;

update public.survey_questions set text = '이어봄을 쓰고 가족과 대화가 늘었어요'
where round = 3 and sort = 1;

-- 차수별 응답 수와 문항별 평균 점수
select r.round, q.sort, q.text, count(*) as answers, round(avg((r.scores ->> q.id::text)::numeric), 2) as avg_score
from public.survey_responses r join public.survey_questions q on q.round = r.round
where r.scores ? q.id::text
group by 1, 2, 3 order by 1, 2;

-- 더 하고 싶은 말
select round, comment, submitted_at from public.survey_responses where comment <> '' order by submitted_at desc;
```

## 2. 살펴보기

```sql
-- 앱 오류: 지난 하루 동안 많이 난 것부터 (개인정보 없이 종류 · 화면 · 앱 버전만 있음)
select kind, screen, app_version, platform, count(*) as n
from public.client_errors where created_at > now() - interval '1 day'
group by 1, 2, 3, 4 order by n desc limit 30;

-- 이용 기록: 지난 7일 동안 무엇을 몇 번 했는지 (자녀 · 부모님별, 사람은 알아볼 수 없음)
select name, detail ->> 'side' as side, count(*) as n, count(distinct anon_id) as people
from public.events where created_at > now() - interval '7 days'
group by 1, 2 order by 1, 2;

-- 주간 사용량: 쌍마다 AI 토큰 · 말→글 초 · 통화 분 · 녹음 분 · 사진 MB
select * from public.usage_weekly order by week desc, relationship_id limit 50;

-- 정해진 시간 작업과 최근 실행 결과
select jobname, schedule, active from cron.job order by jobname;
select j.jobname, d.status, d.return_message, d.start_time
from cron.job_run_details d join cron.job j on j.jobid = d.jobid
order by d.start_time desc limit 20;
```

정해진 시간 작업 (시각은 한국 시간)

| 이름 | 언제 | 하는 일 |
|---|---|---|
| `send-questions` | 매일 새벽 5시 | 오늘 차례인 연결에 질문 보내기(8-3) |
| `purge-expired` | 매일 새벽 4시 | 보관 기간 지난 통화 · 이용 기록 · 문의 · 알림 기록 · 앱 오류 · 3일 지난 초안 · 지난 하루 한도 지우기(11-5) |
| `storage-cleanup` | 매일 새벽 4시 30분 | 남은 통화 녹음 · 지운 근황 사진 · 올리다 만 사진 지우기(7-11 · 9-6). 아래 3장을 해 둬야 돈다 |

## 3. 처음 한 번 하는 설정

### 정해진 시간 작업이 서버 함수를 부르게 하기

`storage-cleanup`은 DB 안에서 서버 함수(`jobs`)를 불러 저장소 파일을 지운다. 부를 때 쓰는 열쇠를 서버 함수와 DB 금고(Vault)에 같은 값으로 넣는다. 이 값은 채팅 · 문서 · 저장소에 붙여 넣지 않는다.

1. 터미널에서 긴 임의 값을 만들어 서버 함수에 넣고, 같은 값을 클립보드에 담는다(값은 화면에 나오지 않는다).

   ```bash
   export CRON_SECRET=$(openssl rand -hex 32) && pnpm supabase secrets set CRON_SECRET=$CRON_SECRET --project-ref njsecrkivrpdzhxffgjy && printf %s $CRON_SECRET | pbcopy
   ```

2. 대시보드 → **Integrations → Vault → Add new secret** 에서 두 값을 넣는다(SQL Editor에 붙이면 실행 기록에 남으니 이 화면을 쓴다).
   - 이름 `cron_key`, 값: 클립보드(붙여 넣기)
   - 이름 `project_url`, 값: `https://njsecrkivrpdzhxffgjy.supabase.co`

3. 한 번 불러 보고 결과를 본다. `status_code`가 200이고 `removed` 수가 나오면 된다.

   ```sql
   select private.call_function('jobs', '{"job": "storage_cleanup"}');
   -- 몇 초 뒤
   select status_code, content from net._http_response order by created desc limit 1;
   ```

열쇠를 바꿀 때는 1번을 다시 하고, Vault 화면에서 `cron_key` 값을 새 값으로 고친다.

## 4. 사고 때 기능 끄기

`app_config`의 `enabled`를 `false`로 바꾸면 서버는 바로 막고, 앱은 다음에 열 때(켜 둔 앱은 한 시간 안에 앱으로 돌아올 때) 그 기능을 숨긴다. 다시 켜려면 `true`.

| 이름 | 끄면 |
|---|---|
| `ai` | 통화 메모 초안 · 여쭤볼 이야기 · 근황 주제 고르기(AI) · 이야기 만들기를 부르지 않는다 |
| `call_recording` | 새 통화를 녹음하지 않는다(초안을 못 만듦). 지금 하는 통화는 그대로 |
| `voice` | 말로 답하기 · 말로 남기기를 숨기고 글로만 받는다 |
| `news_photos` | 근황에 사진을 못 붙인다 |

```sql
update public.app_config set enabled = false, updated_at = now() where key = 'ai';

-- 지금 상태
select key, enabled, value, note from public.app_config order by key;
```

### 하루 한도 바꾸기 (계획 11-2)

버그로 같은 호출이 되풀이될 때를 막는 한도다. 넘으면 그날은 그 기능만 쉬고(원문은 저장), 다음 날 다시 된다.

| 값 | 처음 값 | 뜻 |
|---|---|---|
| `ai` → `per_user_per_day` | 50 | 사람마다 하루 AI 호출 횟수 |
| `voice` → `per_user_per_day` | 40 | 사람마다 하루 짧은 말→글 횟수 |
| `call_recording` → `minutes_per_relationship_per_day` | 120 | 연결마다 하루 통화 녹음 분 |

```sql
update public.app_config set value = jsonb_set(value, '{per_user_per_day}', '80'), updated_at = now() where key = 'ai';
```

이름을 틀리게 바꾸면 그 기능이 막힌다(실수로 한도가 풀리지 않게). 바꾼 뒤 위의 '지금 상태'로 확인한다.

## 5. 업체 사용량 알림 · 상한 (계정을 만든 뒤 채움)

계정을 만들 때 아래를 켜고 여기에 어디서 켰는지 적는다. 기준은 사용량(호출 수 · 분 · MB)이다.

- [ ] Supabase: 사용량 상한 켜기, DB 크기 · 저장소 · 서버 함수 호출 알림 (12-5)
- [ ] LiveKit: 통화 분 · 녹음 분 알림 (5-2 · 7-2)
- [ ] CLOVA(말 → 글): 인식 초 알림 (7-5 · 7-6)
- [ ] AI: 토큰 알림, 보낸 내용을 학습에 쓰지 않는 등급인지 확인 (7-8)
- [ ] Expo 알림 · EAS: 빌드 · 업데이트 횟수 (12-7)
