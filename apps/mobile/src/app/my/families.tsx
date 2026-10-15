import { router } from "expo-router";
import { FamilyListScreen } from "@/features/my/family-screens";
import { useMyPage } from "@/features/my/use-my";
import { useSession } from "@/lib/session";

// 마이 > 연결된 가족
export default function Families() {
  const session = useSession();
  const my = useMyPage(session?.user.id);
  if (!my.data) return null;
  return (
    <FamilyListScreen
      data={my.data}
      onBack={() => router.back()}
      onFamily={(id) => router.push({ pathname: "/my/family/[id]", params: { id } })}
      onInviteOpen={(as) => router.push({ pathname: "/my/invite/[as]", params: { as } })}
      onInvite={() => router.push("/invite")}
      onCode={() => router.push("/invite/code")}
    />
  );
}
