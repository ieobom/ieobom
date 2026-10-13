// 코드 검사 (pnpm lint). 모양 맞추기는 Prettier가 하므로 여기서는 끈다.
// 서버 함수(supabase/functions)는 Deno라서 deno lint로 따로 검사한다.
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/", "**/dist/", "**/.expo/", "supabase/functions/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.mjs", "scripts/**"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["apps/mobile/**/*.{ts,tsx}"],
    ...reactHooks.configs.flat.recommended,
  },
  {
    // 글꼴 · 그림 파일은 require로 불러오는 것이 React Native 방식이다
    files: ["apps/mobile/**/*.{ts,tsx}"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // 화면 문구는 src/copy/ko.ts에만 둔다(계획 1-8). 개발 확인용 화면은 예외
    files: ["apps/mobile/src/{app,ui,features}/**/*.{ts,tsx}"],
    ignores: ["apps/mobile/src/app/dev/**", "apps/mobile/src/features/dev/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/[가-힣]/]",
          message: "화면 문구는 src/copy/ko.ts에 두고 ko.…로 가져와 쓴다",
        },
        {
          selector: "TemplateElement[value.raw=/[가-힣]/]",
          message: "화면 문구는 src/copy/ko.ts에 두고 ko.…로 가져와 쓴다",
        },
        {
          selector: "JSXText[value=/[가-힣]/]",
          message: "화면 문구는 src/copy/ko.ts에 두고 ko.…로 가져와 쓴다",
        },
      ],
    },
  },
  {
    files: ["apps/mobile/app.config.ts"],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
