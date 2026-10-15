// 초대 · 코드 확인 결과를 화면 글자로
import { ko } from "@/copy/ko";
import { callName } from "@/lib/korean";
import type { InviteAs, Kind, Lookup } from "./use-invite";

export const kindLabel = (k: Kind) => (k === "mom" ? ko.family.mom : ko.family.dad);
export const asLabel = (a: InviteAs) => (a === "child" ? ko.my.child : kindLabel(a));

/** 코드를 보낸 사람을 부르는 말: 자녀가 받으면 '엄마', 부모님이 받으면 '아영이' */
export function inviterLabel(l: Extract<Lookup, { ok: true }>): string {
  if (l.invite_as === "child") return kindLabel(l.parent_kind);
  return l.inviter_name ? callName(l.inviter_name) : ko.family.someone;
}

/** 확인 카드 세 줄: '엄마가 초대했어요' · '엄마의 자녀로 이어져요' · '맞지 않으면 엄마께 여쭤봐 주세요' */
export function previewLines(l: Extract<Lookup, { ok: true }>) {
  const i = ko.invite;
  const who = inviterLabel(l);
  return l.invite_as === "child"
    ? { by: i.invitedBy(who), as: i.asChild(who), ask: i.askParent(who) }
    : { by: i.invitedBy(who), as: i.asParent(who, kindLabel(l.invite_as)), ask: i.askChild(who) };
}

/** 안 되는 코드의 까닭 */
export function lookupError(l: Extract<Lookup, { ok: false }>): string {
  const e = ko.invite.errors;
  switch (l.reason) {
    case "code_expired":
    case "code_used":
    case "code_canceled":
    case "too_many_attempts":
    case "own_code":
      return e[l.reason];
    case "side_mismatch":
      return e.side_mismatch(l.invite_as ? asLabel(l.invite_as) : ko.family.someone);
    case "already_connected":
      return e.already_connected(
        l.child_name ? callName(l.child_name) : l.parent_kind ? kindLabel(l.parent_kind) : ko.family.someone,
      );
    case "already_has_parent":
      return e.already_has_parent(
        l.child_name ? callName(l.child_name) : ko.my.child,
        l.parent_kind ? kindLabel(l.parent_kind) : ko.family.someone,
      );
    default:
      return e.code_not_found;
  }
}
