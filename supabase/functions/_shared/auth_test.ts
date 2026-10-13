import { assertEquals, assertRejects } from "@std/assert";
import { optionalUser, requireUser, type Verifier } from "./auth.ts";
import { HttpError } from "./http.ts";

const fake: Verifier = (token) => Promise.resolve(token === "good" ? "user-1" : null);
const req = (auth?: string) => new Request("http://x", { headers: auth ? { authorization: auth } : {} });

Deno.test("requireUser: 맞는 토큰이면 사용자 ID", async () => {
  assertEquals(await requireUser(req("Bearer good"), fake), "user-1");
});

Deno.test("requireUser: 토큰이 없거나 틀리면 401", async () => {
  const none = await assertRejects(() => requireUser(req(), fake), HttpError);
  assertEquals(none.status, 401);
  await assertRejects(() => requireUser(req("Bearer bad"), fake), HttpError);
  await assertRejects(() => requireUser(req("Basic good"), fake), HttpError);
});

Deno.test("optionalUser: 토큰이 없으면 null, 틀리면 401", async () => {
  assertEquals(await optionalUser(req(), fake), null);
  assertEquals(await optionalUser(req("bearer good"), fake), "user-1");
  await assertRejects(() => optionalUser(req("Bearer bad"), fake), HttpError);
});
