// 초대 · 코드 넣기 개발 확인용 가짜 데이터(39차 시연 코드와 같은 숫자). 로그인 없이 /dev/invite에서 본다.
import type { Lookup } from "@/features/invite/use-invite";
import type { MyPage } from "@/features/my/types";
import { MY_CASES } from "./my-fixtures";

const CHILD = MY_CASES[0]!.data;
const PARENT = MY_CASES[1]!.data;

export const INVITE_CASES: { key: string; label: string; data: MyPage }[] = [
  { key: "both", label: "자녀 · 엄마 · 아빠 고르기", data: { ...CHILD, families: [], invites: [] } },
  { key: "dad", label: "자녀 · 아빠만 남음", data: { ...CHILD, invites: [] } },
  { key: "parent", label: "부모님 · 자녀 초대", data: PARENT },
  { key: "parentNew", label: "부모님 · 처음 초대", data: { ...PARENT, families: [] } },
];

/** 코드 → 확인 결과. 시연 숫자: 482716 아영이가 엄마로 · 628413 아빠가 자녀로 · 000000 지남 · 111111 씀 · 222222 바뀜 · 374159 엄마가 이미 있음 */
export function lookupFixture(code: string): Lookup {
  switch (code) {
    case "482716":
      return { ok: true, invite_as: "mom", parent_kind: "mom", inviter_name: "아영" };
    case "628413":
      return { ok: true, invite_as: "child", parent_kind: "dad", inviter_name: null };
    case "000000":
      return { ok: false, reason: "code_expired" };
    case "111111":
      return { ok: false, reason: "code_used" };
    case "222222":
      return { ok: false, reason: "code_canceled" };
    case "333333":
      return { ok: false, reason: "too_many_attempts" };
    case "593827":
      return { ok: false, reason: "own_code" };
    case "444444":
      return { ok: false, reason: "side_mismatch", invite_as: "child" };
    case "555555":
      return { ok: false, reason: "already_connected", parent_kind: "mom" };
    case "374159":
      return { ok: false, reason: "already_has_parent", parent_kind: "mom", child_name: "아영" };
    default:
      return { ok: false, reason: "code_not_found" };
  }
}
