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
    files: ["apps/mobile/app.config.ts"],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
