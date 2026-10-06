# 작업 규칙

- 폴더나 주요 파일을 더하거나 옮기거나 지우면, `scripts/update-structure.mjs`의 `DESC`에 한 줄 설명을 고치고 `pnpm structure`를 실행해 README의 디렉토리 구조를 갱신한다. 작업을 마치기 전에 `pnpm structure:check`가 통과해야 한다.
- 패키지는 pnpm으로 설치한다. Expo 패키지는 `pnpm exec expo install`로 SDK에 맞는 버전을 받는다.
- 기술 선택이 바뀌면 `docs/tech-stack.md`도 함께 고친다.
- 열쇠(service_role, AI(Gemini), 음성 인식, 음성 통화, 카카오 비밀값)는 `.env`에만 둔다. 앱 코드와 `EXPO_PUBLIC_` 값에 넣지 않는다.
- 새 환경 변수를 쓰면 같은 위치의 `.env.example`에 이름과 한 줄 설명을 더한다(값은 넣지 않는다).
