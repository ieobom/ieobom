import { assertEquals } from "@std/assert";
import type { Verifier } from "../_shared/auth.ts";
import { type AccountStore, makeHandler } from "./handler.ts";

const verify: Verifier = (token) => Promise.resolve(token === "good" ? "user-1" : null);

function fakeStore(opts: { kakaoId?: string | null; photos?: string[] } = {}) {
  const log: string[] = [];
  const store: AccountStore = {
    kakaoId: () => Promise.resolve(opts.kakaoId === undefined ? "4242" : opts.kakaoId),
    photoPaths: () => Promise.resolve(opts.photos ?? []),
    removePhotos: (p) => {
      log.push(`remove:${p.length}`);
      return Promise.resolve();
    },
    deleteUser: (uid) => {
      log.push(`delete:${uid}`);
      return Promise.resolve();
    },
    clearTrash: (p) => {
      log.push(`trash:${p.length}`);
      return Promise.resolve();
    },
  };
  return { store, log };
}

const call = (
  h: (req: Request) => Promise<Response>,
  token: string | null,
  body: unknown = { action: "withdraw" },
) =>
  h(
    new Request("http://x/account", {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(body),
    }),
  );

Deno.test("account: 로그인하지 않으면 401, 모르는 일은 400", async () => {
  const { store } = fakeStore();
  const h = makeHandler({ verify, store: () => store, unlink: () => null });
  assertEquals((await call(h, null)).status, 401);
  assertEquals((await call(h, "good", { action: "nope" })).status, 400);
});

Deno.test("account: 카카오 끊기 → 사진 지우기(100개씩) → 계정 지우기 순서", async () => {
  const unlinked: string[] = [];
  const photos = Array.from({ length: 150 }, (_, i) => `rel/news/${i}.jpg`);
  const { store, log } = fakeStore({ photos });
  const h = makeHandler({
    verify,
    store: () => store,
    unlink: () => (id) => {
      unlinked.push(id);
      log.push("unlink");
      return Promise.resolve("unlinked");
    },
  });
  const res = await call(h, "good");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).data, { withdrawn: true, kakao: "unlinked", photos: 150 });
  assertEquals(unlinked, ["4242"]);
  assertEquals(log, ["unlink", "remove:100", "remove:50", "delete:user-1", "trash:150"]);
});

Deno.test("account: 카카오 끊기가 실패하면 계정을 지우지 않고 502 (다시 하면 이어서)", async () => {
  const { store, log } = fakeStore();
  const h = makeHandler({
    verify,
    store: () => store,
    unlink: () => () => Promise.reject(new Error("down")),
  });
  assertEquals((await call(h, "good")).status, 502);
  assertEquals(log, []);
});

Deno.test("account: 어드민 키가 없으면 카카오 끊기는 건너뛰고 탈퇴는 한다", async () => {
  const { store, log } = fakeStore();
  const h = makeHandler({ verify, store: () => store, unlink: () => null });
  const res = await call(h, "good");
  assertEquals((await res.json()).data.kakao, "skipped");
  assertEquals(log, ["delete:user-1"]);
});

Deno.test("account: 이미 끊긴 카카오 · 카카오로 가입하지 않은 계정도 탈퇴된다", async () => {
  const a = fakeStore();
  const h1 = makeHandler({ verify, store: () => a.store, unlink: () => () => Promise.resolve("not_linked") });
  assertEquals((await (await call(h1, "good")).json()).data.kakao, "not_linked");
  const b = fakeStore({ kakaoId: null });
  const h2 = makeHandler({
    verify,
    store: () => b.store,
    unlink: () => () => Promise.reject(new Error("never")),
  });
  assertEquals((await (await call(h2, "good")).json()).data.kakao, "none");
  assertEquals(b.log, ["delete:user-1"]);
});
