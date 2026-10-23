import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ko } from "@/copy/ko";
import {
  ComposeTabs,
  MakeQuestionScreen,
  NewsEditorScreen,
  type ComposeKind,
} from "@/features/compose/compose-screens";
import { useComposeAction, useNextSlot } from "@/features/compose/use-compose";
import { partnerLabel } from "@/features/home/partner";
import { useHome } from "@/features/home/use-home";
import { seoulParts } from "@/lib/dates";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 질문 만들기 · 근황 보내기. 홈의 '질문 만들기 · 근황도 보내요' 네모로 연다(?rel=연결ID&kind=q|news).
// 만들어 둔 질문이 있으면 그 질문 고치기만 보인다(시안). 사진 붙이기는 9-1에서
export default function Compose() {
  const params = useLocalSearchParams<{ rel: string; kind?: string }>();
  const session = useSession();
  const userId = session?.user.id;
  const toast = useToast();
  const home = useHome(userId);
  const act = useComposeAction(userId);
  const [kind, setKind] = useState<ComposeKind>(params.kind === "news" ? "news" : "q");
  const family = home.data?.families.find((f) => f.relationship_id === params.rel);
  const mine = family?.my_custom_question ?? null;
  const slot = useNextSlot(userId, mine ? undefined : family?.relationship_id);
  if (!home.data || !family) return null;
  const partner = partnerLabel(family);
  const parent = family.my_side === "parent";
  const date = (iso: string) => ko.time.date(seoulParts(iso));
  const tabs = mine ? undefined : <ComposeTabs kind={kind} onKind={setKind} />;
  const done = (message: string) => {
    toast(message);
    router.back();
  };

  if (kind === "news" && !mine) {
    return (
      <NewsEditorScreen
        partner={partner}
        parent={parent}
        tabs={tabs}
        sending={act.isPending}
        onBack={() => router.back()}
        onSend={(d) =>
          act.mutate(
            { type: "news", relationship: family.relationship_id, ...d },
            { onSuccess: () => done(ko.compose.sentNews(partner)) },
          )
        }
      />
    );
  }
  return (
    <MakeQuestionScreen
      partner={partner}
      toChild={parent}
      mine={mine}
      slot={slot.data}
      partnerOn={family.partner_custom_question_on}
      tabs={tabs}
      onBack={() => router.back()}
      onSend={(text) =>
        mine
          ? act.mutate(
              { type: "edit", question: mine.id, text },
              { onSuccess: () => done(ko.compose.sentQ(date(mine.send_on))) },
            )
          : act.mutate(
              { type: "make", relationship: family.relationship_id, text },
              {
                onSuccess: (made) =>
                  done(
                    ko.compose.sentQ(date((made as { send_on: string } | null)?.send_on ?? slot.data ?? "")),
                  ),
              },
            )
      }
      onDelete={() =>
        mine &&
        act.mutate({ type: "remove", question: mine.id }, { onSuccess: () => done(ko.compose.deletedQ) })
      }
    />
  );
}
