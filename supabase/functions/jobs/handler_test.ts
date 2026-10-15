import { assertEquals } from "@std/assert";
import { makeHandler, type Store } from "./handler.ts";

function fakeStore(names: { call_audio: string[]; news_photos: string[] }, failOn?: string) {
  const removed: Record<string, string[]> = {};
  const done: Record<string, string[]> = {};
  const store: Store = {
    targets: () => Promise.resolve(names),
    remove(bucket, list) {
      if (bucket === failOn) return Promise.reject(new Error("storage down"));
      (removed[bucket] ??= []).push(...list);
      return Promise.resolve();
    },
    done(bucket, list) {
      (done[bucket] ??= []).push(...list);
      return Promise.resolve();
    },
  };
  return { store, removed, done };
}

const call = (
  handler: (req: Request) => Promise<Response>,
  token: string | null,
  body: unknown = { job: "storage_cleanup" },
) =>
  handler(
    new Request("http://x/jobs", {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(body),
    }),
  );

Deno.test("jobs: 열쇠가 없거나 다르면 401", async () => {
  const { store } = fakeStore({ call_audio: [], news_photos: [] });
  const handler = makeHandler({ secret: () => "cron-key", store: () => store });
  assertEquals((await call(handler, null)).status, 401);
  assertEquals((await call(handler, "cron-kez")).status, 401);
  assertEquals((await call(handler, "cron-key-longer")).status, 401);
});

Deno.test("jobs: 남은 녹음과 사진을 100개씩 지우고 목록에서 뺀다", async () => {
  const photos = Array.from({ length: 150 }, (_, i) => `rel/news/${i}.jpg`);
  const { store, removed, done } = fakeStore({ call_audio: ["c1/u1.ogg"], news_photos: photos });
  const handler = makeHandler({ secret: () => "cron-key", store: () => store });
  const res = await call(handler, "cron-key");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).data, { removed: { call_audio: 1, news_photos: 150 } });
  assertEquals(removed["call-audio"], ["c1/u1.ogg"]);
  assertEquals(removed["news-photos"].length, 150);
  assertEquals(done["news-photos"], photos);
});

Deno.test("jobs: 저장소가 실패하면 목록에서 빼지 않고 500", async () => {
  const { store, done } = fakeStore({ call_audio: [], news_photos: ["a.jpg"] }, "news-photos");
  const handler = makeHandler({ secret: () => "cron-key", store: () => store });
  assertEquals((await call(handler, "cron-key")).status, 500);
  assertEquals(done["news-photos"], undefined);
});

Deno.test("jobs: 열쇠를 아직 안 넣었으면 503", async () => {
  const { store } = fakeStore({ call_audio: [], news_photos: [] });
  const handler = makeHandler({ secret: () => "", store: () => store });
  assertEquals((await call(handler, "")).status, 503);
  assertEquals((await call(handler, "anything")).status, 503);
});

Deno.test("jobs: 모르는 일은 400, POST 말고는 405", async () => {
  const { store } = fakeStore({ call_audio: [], news_photos: [] });
  const handler = makeHandler({ secret: () => "cron-key", store: () => store });
  assertEquals((await call(handler, "cron-key", { job: "nope" })).status, 400);
  assertEquals((await handler(new Request("http://x/jobs"))).status, 405);
});
