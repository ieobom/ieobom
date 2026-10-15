import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ko } from "@/copy/ko";
import { partnerLabel } from "@/features/home/partner";
import { FamilySettingsScreen } from "@/features/my/family-screens";
import type { MyPage } from "@/features/my/types";
import { useMyAction, useMyPage } from "@/features/my/use-my";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 마이 > 연결된 가족 > 가족별 설정
export default function FamilySettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession();
  const userId = session?.user.id;
  const toast = useToast();
  const qc = useQueryClient();
  const my = useMyPage(userId);
  const act = useMyAction(userId);
  const family = my.data?.families.find((f) => f.relationship_id === id);
  if (!family) return null;
  const who = partnerLabel(family);
  const two = ko.my.two(family.my_side === "parent");
  return (
    <FamilySettingsScreen
      family={family}
      onBack={() => router.back()}
      onFreq={(freq) =>
        act.mutate(
          { type: "freq", relationship: family.relationship_id, freq },
          {
            // 적은 쪽은 상대 횟수를 아는 서버가 다시 계산한다
            onSuccess: async () => {
              await qc.refetchQueries({ queryKey: ["my", userId] });
              const now = qc
                .getQueryData<MyPage>(["my", userId])
                ?.families.find((f) => f.relationship_id === id);
              const label = (f: number) => ko.my.freqs[f - 1]!;
              if (now)
                toast(
                  now.applied === freq
                    ? ko.my.freqSet(label(freq))
                    : ko.my.freqSetLess(two, label(now.applied)),
                );
            },
          },
        )
      }
      onTopics={(t) => act.mutate({ type: "topics", relationship: family.relationship_id, ...t })}
      onPrivacy={() => router.push({ pathname: "/my/privacy", params: { family: who } })}
      onDisconnect={() =>
        act.mutate(
          { type: "end", relationship: family.relationship_id },
          {
            onSuccess: () => {
              toast(ko.my.disconnected(who));
              router.back();
            },
          },
        )
      }
    />
  );
}
