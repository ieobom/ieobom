import { router } from "expo-router";
import { ko } from "@/copy/ko";
import { FamilyListScreen } from "@/features/my/family-screens";
import { useMyPage } from "@/features/my/use-my";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 마이 > 연결된 가족
export default function Families() {
  const session = useSession();
  const toast = useToast();
  const my = useMyPage(session?.user.id);
  if (!my.data) return null;
  return (
    <FamilyListScreen
      data={my.data}
      onBack={() => router.back()}
      onFamily={(id) => router.push({ pathname: "/my/family/[id]", params: { id } })}
      onInviteOpen={(as) => router.push({ pathname: "/my/invite/[as]", params: { as } })}
      // 초대하기 · 받은 코드 넣기 화면은 4-4에서 만든다
      onInvite={() => toast(ko.app.comingSoon)}
      onCode={() => toast(ko.app.comingSoon)}
    />
  );
}
