// 마이에서 쓰는 이름 · 시간 글자
import { ko } from "@/copy/ko";
import { seoulParts } from "@/lib/dates";
import { partnerLabel } from "@/features/home/partner";
import type { CallTime, MyInvite, MyPage } from "./types";

/** 초대한 사람을 부르는 말: 엄마 · 아빠 · 자녀 */
export function inviteLabel(i: MyInvite): string {
  return i.invite_as === "mom" ? ko.family.mom : i.invite_as === "dad" ? ko.family.dad : ko.my.child;
}

export const isExpired = (i: MyInvite, now: Date = new Date()) =>
  new Date(i.expires_at).getTime() <= now.getTime();

/** '평일 저녁 7시 – 9시' */
export function slotLabel(t: CallTime): string {
  return `${ko.time.days[t.days]} ${ko.time.range(t.start_hour, t.end_hour)}`;
}

export const sameSlot = (a: CallTime, b: CallTime) =>
  a.days === b.days && a.start_hour === b.start_hour && a.end_hour === b.end_hour;

/** '11월 14일 저녁 7시 52분' */
export function whenLabel(iso: string): string {
  const p = seoulParts(iso);
  return `${ko.time.date(p)} ${ko.time.clock(p)}`;
}

/** 마이 첫 화면 '연결된 가족' 아래 줄: '엄마 · 아빠(초대 코드 보냄)' */
export function familiesDesc(d: MyPage, now: Date = new Date()): string {
  const names = [
    ...d.families.map(partnerLabel),
    ...d.invites.map((i) => inviteLabel(i) + (isExpired(i, now) ? ko.my.familyExpired : ko.my.familyInvited)),
  ];
  return names.length ? names.join(" · ") : ko.my.familiesNone;
}

export function scheduleDesc(times: CallTime[]): string {
  const [first] = times;
  if (!first) return ko.my.scheduleNone;
  return times.length > 1 ? ko.my.scheduleMore(slotLabel(first), times.length - 1) : slotLabel(first);
}
