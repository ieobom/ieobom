// 이용 기록 묶어 보내기(계획 11-4). 앱 열기 · 홈 카드 누름 · 전화 걸기 단추 · 답 · 메모 저장 같은 핵심만 모아 두었다가
// 20개가 차거나, 앱이 뒤로 가거나, 앱을 열 때 한 번에 보낸다(DB 함수 log_events). 화면마다 요청이 생기지 않는다.
// 보내기 전에 앱이 꺼져도 남도록 휴대폰에 잠깐 둔다. 가입을 마치기 전 기록은 서버가 받지 않아서 버린다.

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Json } from "@ieobom/shared";
import { AppState } from "react-native";
import { supabase } from "./supabase";

/** 서버(log_events)가 받는 이름과 같아야 한다 */
export type EventName =
  | "app_open"
  | "card_tap"
  | "call_tap"
  | "answer_sent"
  | "question_made"
  | "news_sent"
  | "memo_saved"
  | "invite_issued"
  | "invite_accepted"
  | "signup_done"
  | "survey_sent"
  | "inquiry_sent";

type Item = { name: EventName; at: string; detail?: Record<string, string | number | boolean> };

const KEY = "ieobom.events";
const BATCH = 20;
// 오래 못 보내면 오래된 것부터 버린다
const KEEP = 200;

let queue: Item[] = [];
let loaded: Promise<void> | null = null;
let sending = false;

function load() {
  loaded ??= AsyncStorage.getItem(KEY)
    .then((raw) => {
      const saved = raw ? (JSON.parse(raw) as Item[]) : [];
      queue = [...saved, ...queue].slice(-KEEP);
    })
    .catch(() => undefined);
  return loaded;
}

function save() {
  AsyncStorage.setItem(KEY, JSON.stringify(queue)).catch(() => undefined);
}

/** 기록 하나 더하기. detail에는 개인정보 없이 짧은 값만(예: { mode: "text" }) */
export function track(name: EventName, detail?: Item["detail"]) {
  queue.push({ name, at: new Date().toISOString(), ...(detail ? { detail } : {}) });
  queue = queue.slice(-KEEP);
  save();
  if (queue.length >= BATCH) void flush();
}

/** 아직 안 보낸 기록 수 (개발 확인용) */
export const queuedCount = () => queue.length;

/** 모아 둔 기록 보내기. 로그인 전이면 다음에 보낸다 */
export async function flush() {
  await load();
  if (sending || queue.length === 0) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  sending = true;
  const items = queue.slice(0, 50);
  try {
    const { error } = await supabase.rpc("log_events", { items: items as unknown as Json });
    // 인터넷이 끊겼으면 남겨 두고, 서버가 거절한 것(가입 전 등)은 버린다
    if (!error || error.code === "P0001") {
      queue = queue.slice(items.length);
      save();
    }
  } catch {
    // 다음에 다시 보낸다
  } finally {
    sending = false;
  }
}

/** 앱을 열 때 한 번. 앱 열기를 적고, 앱이 뒤로 가면 보내고, 다시 앞으로 오면 앱 열기를 또 적는다 */
export function startEvents() {
  void load().then(() => {
    track("app_open");
    void flush();
  });
  let last = AppState.currentState;
  AppState.addEventListener("change", (next) => {
    if (next === "background" || next === "inactive") void flush();
    if (next === "active" && last === "background") {
      track("app_open");
      void flush();
    }
    last = next;
  });
}
