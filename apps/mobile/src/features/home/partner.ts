import { ko } from "@/copy/ko";
import { callName } from "@/lib/korean";
import type { HomeFamily } from "./types";

/** 홈에서 상대를 부르는 말. 자녀 화면은 엄마 · 아빠(부모님 이름은 보이지 않음), 부모님 화면은 '아영이' */
export function partnerLabel(f: Pick<HomeFamily, "my_side" | "parent_kind" | "partner_name">): string {
  if (f.my_side === "child") return f.parent_kind === "mom" ? ko.family.mom : ko.family.dad;
  return f.partner_name ? callName(f.partner_name) : ko.family.someone;
}
