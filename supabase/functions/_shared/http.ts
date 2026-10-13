// 서버 함수의 응답 · 오류 형식. 성공은 { data }, 실패는 { error: { code, message } }.
// 앱은 code로 화면 문구를 고르고, message는 기록용이다.

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message = code,
  ) {
    super(message);
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function ok(data: unknown, status = 200): Response {
  return json({ data }, status);
}

export function fail(status: number, code: string, message = code): Response {
  return json({ error: { code, message } }, status);
}

/** 처리 함수를 감싸서 던진 HttpError는 그 형식으로, 나머지는 500으로 돌려준다. */
export function handle(fn: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
  return async (req) => {
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof HttpError) return fail(e.status, e.code, e.message);
      console.error(e);
      return fail(500, "internal", "서버 오류");
    }
  };
}
