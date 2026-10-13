import { assertEquals } from "@std/assert";
import type { Verifier } from "../_shared/auth.ts";
import { makeHandler } from "./handler.ts";

const fake: Verifier = (token) => Promise.resolve(token === "good" ? "user-1" : null);
const handler = makeHandler(fake);

Deno.test("ping: 로그인 없이도 응답", async () => {
  const res = await handler(new Request("http://x/ping"));
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { data: { pong: true, user: null } });
});

Deno.test("ping: 맞는 토큰이면 사용자 ID를 돌려줌", async () => {
  const res = await handler(new Request("http://x/ping", { headers: { authorization: "Bearer good" } }));
  assertEquals((await res.json()).data.user, "user-1");
});

Deno.test("ping: 틀린 토큰은 401, GET·POST 말고는 405", async () => {
  const bad = await handler(new Request("http://x/ping", { headers: { authorization: "Bearer bad" } }));
  assertEquals(bad.status, 401);
  const del = await handler(new Request("http://x/ping", { method: "DELETE" }));
  assertEquals(del.status, 405);
});
