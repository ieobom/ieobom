import { assertEquals } from "@std/assert";
import { fail, handle, HttpError, ok } from "./http.ts";

Deno.test("ok는 data로 감싼다", async () => {
  const res = ok({ a: 1 });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { data: { a: 1 } });
});

Deno.test("fail은 code와 message를 준다", async () => {
  const res = fail(400, "bad", "틀림");
  assertEquals(res.status, 400);
  assertEquals(await res.json(), { error: { code: "bad", message: "틀림" } });
});

Deno.test("handle은 HttpError를 그 상태로, 다른 오류는 500으로", async () => {
  const known = await handle(() => Promise.reject(new HttpError(409, "conflict")))(new Request("http://x"));
  assertEquals(known.status, 409);
  assertEquals((await known.json()).error.code, "conflict");

  const original = console.error;
  console.error = () => {};
  try {
    const unknown = await handle(() => Promise.reject(new Error("boom")))(new Request("http://x"));
    assertEquals(unknown.status, 500);
    assertEquals((await unknown.json()).error.code, "internal");
  } finally {
    console.error = original;
  }
});
