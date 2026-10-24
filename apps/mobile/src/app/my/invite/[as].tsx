import { router, useLocalSearchParams } from "expo-router";
import { ko } from "@/copy/ko";
import { useShareCode } from "@/features/invite/share-code";
import { InviteScreen } from "@/features/my/family-screens";
import { useMyAction, useMyPage } from "@/features/my/use-my";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 마이 > 연결된 가족 > 초대 코드 보기. 새 코드를 만들면 ID가 바뀌어서 '누구를 초대했는지'(mom · dad · child)로 찾는다
export default function Invite() {
  const { as } = useLocalSearchParams<{ as: string }>();
  const session = useSession();
  const toast = useToast();
  const my = useMyPage(session?.user.id);
  const act = useMyAction(session?.user.id);
  const shareCode = useShareCode();
  const invite = my.data?.invites.find((i) => i.invite_as === as);
  if (!invite) return null;
  return (
    <InviteScreen
      invite={invite}
      onBack={() => router.back()}
      onRenew={() =>
        act.mutate(
          {
            type: "renew_invite",
            invite_as: invite.invite_as,
            my_kind: invite.invite_as === "child" ? invite.parent_kind : undefined,
          },
          { onSuccess: () => toast(ko.my.renewed) },
        )
      }
      // 카카오톡으로 바로 보내기(카카오 메시지 모양)는 4-3. 지금은 휴대폰 공유 창으로
      onKakao={() => shareCode.share(invite.code)}
      onCopy={() => shareCode.copy(invite.code)}
      onCancel={() =>
        act.mutate(
          { type: "cancel_invite", invite: invite.id },
          {
            onSuccess: () => {
              toast(ko.my.canceled);
              router.back();
            },
          },
        )
      }
    />
  );
}
