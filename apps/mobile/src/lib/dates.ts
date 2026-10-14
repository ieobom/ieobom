// 한국 시간으로 날짜 · 시각 나누기. 한국은 서머타임이 없어서 +9시간으로 계산한다.

export type SeoulParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dow: number;
};

const KST = 9 * 60 * 60 * 1000;

/** 때(ISO) 또는 날짜('2026-10-15') → 한국 시간 조각. dow는 일 0 ~ 토 6 */
export function seoulParts(value: string | Date): SeoulParts {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number) as [number, number, number];
    return {
      year: y,
      month: m,
      day: d,
      hour: 0,
      minute: 0,
      dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay(),
    };
  }
  const t = new Date(new Date(value).getTime() + KST);
  return {
    year: t.getUTCFullYear(),
    month: t.getUTCMonth() + 1,
    day: t.getUTCDate(),
    hour: t.getUTCHours(),
    minute: t.getUTCMinutes(),
    dow: t.getUTCDay(),
  };
}

export function minutesAgo(iso: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
}
