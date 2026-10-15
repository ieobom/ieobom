// 앱 오류 기록(계획 11-3). 오류 종류 · 화면 · 앱 버전만 client_errors에 바로 적는다(쓰기만 되는 표).
// 글 내용 · 이름 · 번호 같은 개인정보는 적지 않는다. 해외 오류 업체로 보내지 않는다.
// 적다가 실패해도(인터넷이 끊김 등) 앱에는 아무 일도 없다. 앱이 바로 닫히는 오류는 못 남을 수 있다.

import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";

export const appVersion = Constants.expoConfig?.version ?? "";

/** 어디서 났는지. render 화면 그리기 · load 불러오기 · save 저장 · crash 그 밖의 오류 */
export type ErrorSource = "render" | "load" | "save" | "crash";

let screen = "";
/** 지금 화면(경로 모양, 예: /my/family/[id]). 화면이 바뀔 때마다 루트 레이아웃이 적는다 */
export function setScreen(next: string) {
  screen = next;
}

// 같은 오류가 되풀이되면 한 번만, 앱을 연 동안 30개까지
const sent = new Set<string>();
const MAX = 30;

// 서버 함수가 낸 규칙 오류(raise exception 'question_closed')는 이름이 영어 소문자다
const RULE = /^[a-z][a-z_]{1,59}$/;

/** 오류를 개인정보 없는 짧은 이름으로. 따옴표 안 글자와 숫자는 지운다 */
export function errorKind(source: ErrorSource, error: unknown): string {
  const e = (error ?? {}) as { name?: unknown; message?: unknown; code?: unknown };
  const message = typeof e.message === "string" ? e.message : String(error);
  const code = typeof e.code === "string" ? e.code : "";
  let what: string;
  if (/network request failed|failed to fetch|load failed/i.test(message)) what = "network";
  else if (code) what = code === "P0001" && RULE.test(message) ? message : code;
  else {
    const name = typeof e.name === "string" && e.name ? e.name : "Error";
    const clean = message
      .replace(/(["'`])(?:(?!\1).)*\1/g, "…")
      .replace(/\d+/g, "#")
      .replace(/\s+/g, " ")
      .trim();
    what = `${name}: ${clean}`;
  }
  return `${source}:${what}`.slice(0, 100);
}

export function reportError(source: ErrorSource, error: unknown) {
  if (__DEV__) console.warn(error);
  const kind = errorKind(source, error);
  const key = `${kind}@${screen}`;
  if (sent.has(key) || sent.size >= MAX) return;
  sent.add(key);
  supabase
    .from("client_errors")
    .insert({
      kind,
      screen: screen.slice(0, 100),
      app_version: appVersion.slice(0, 30),
      platform: Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web",
    })
    .then(
      () => undefined,
      () => undefined,
    );
}

/** 화면 밖에서 난 오류(이벤트 처리 · 타이머 · 놓친 Promise)도 적는다. 앱을 열 때 한 번 */
export function watchUncaughtErrors() {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return;
    window.addEventListener("error", (ev) => reportError("crash", ev.error ?? ev.message));
    window.addEventListener("unhandledrejection", (ev) => reportError("crash", ev.reason));
    return;
  }
  const g = globalThis as unknown as {
    ErrorUtils?: {
      getGlobalHandler: () => (error: unknown, fatal?: boolean) => void;
      setGlobalHandler: (fn: (error: unknown, fatal?: boolean) => void) => void;
    };
  };
  const prev = g.ErrorUtils?.getGlobalHandler();
  g.ErrorUtils?.setGlobalHandler((error, fatal) => {
    reportError("crash", error);
    prev?.(error, fatal);
  });
}
