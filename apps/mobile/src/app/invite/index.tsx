import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ko } from "@/copy/ko";
import { partnerLabel } from "@/features/home/partner";
import { InviteFlow } from "@/features/invite/invite-screens";
import { useInviteStatus, useIssueInvite, type Issued } from "@/features/invite/use-invite";
import type { MyPage } from "@/features/my/types";
import { useMyPage } from "@/features/my/use-my";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 가족 초대(앱 안에서). 코드를 보내 두고 기다리는 동안 상대가 코드를 넣으면 '엄마와 이어졌어요'와 함께 홈으로 간다.
// 기다림은 3초마다 · 앱으로 돌아올 때 다시 확인한다(계획 4-4)
export default function Invite() {
  const session = useSession();
  const userId = session?.user.id;
  const toast = useToast();
  const qc = useQueryClient();
  const my = useMyPage(userId);
  const issue = useIssueInvite(userId);
  const [issued, setIssued] = useState<Issued | undefined>(undefined);
  const status = useInviteStatus(issued?.id);
  const used = status.data?.status === "used" ? status.data.relationship_id : null;

  useEffect(() => {
    if (!used) return;
    qc.refetchQueries({ queryKey: ["my", userId] }).then(() => {
      const fam = qc.getQueryData<MyPage>(["my", userId])?.families.find((f) => f.relationship_id === used);
      toast(ko.invite.connected(fam ? partnerLabel(fam) : ko.family.someone));
      router.dismissTo("/");
    });
  }, [used, qc, userId, toast]);

  const onIssue = useCallback(
    (inviteAs: "mom" | "dad" | "child", myKind?: "mom" | "dad") =>
      issue.mutate({ invite_as: inviteAs, my_kind: myKind }, { onSuccess: setIssued }),
    [issue],
  );

  if (!my.data) return null;
  return (
    <InviteFlow
      data={my.data}
      issued={issued}
      onIssue={onIssue}
      // 카카오톡으로 보내기 · 코드 복사는 4-3에서 붙인다
      onKakao={() => toast(ko.app.comingSoon)}
      onCopy={() => toast(ko.app.comingSoon)}
      onClose={() => {
        toast(ko.invite.closed);
        router.back();
      }}
      onHaveCode={() => router.replace("/invite/code")}
      onExit={() => router.back()}
    />
  );
}
