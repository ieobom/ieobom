import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ko } from "@/copy/ko";
import { AnswerScreen } from "@/features/compose/compose-screens";
import { errorCode, useComposeAction } from "@/features/compose/use-compose";
import { partnerLabel } from "@/features/home/partner";
import { useHome } from "@/features/home/use-home";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 질문 답하기. 홈 질문 카드의 '답하기'로 연다(?rel=연결ID). 말로 답하기는 7-4에서 붙인다
export default function Answer() {
  const { rel } = useLocalSearchParams<{ rel: string }>();
  const session = useSession();
  const userId = session?.user.id;
  const toast = useToast();
  const home = useHome(userId);
  const act = useComposeAction(userId);
  const [closed, setClosed] = useState(false);
  const family = home.data?.families.find((f) => f.relationship_id === rel);
  if (!home.data || !family) return null;
  const card = family.cards.find((c) => c.kind === "question");
  const q = card?.kind === "question" ? card : undefined;
  // 답할 수 있는 것은 새 질문과 상대가 먼저 보낸 질문뿐. 그 사이 다음 질문이 왔으면 기간이 지났다고 알려 준다
  const open = q && q.question_id && q.text && (q.state === "new" || q.state === "partner_sent_first");
  return (
    <AnswerScreen
      partner={partnerLabel(family)}
      parent={family.my_side === "parent"}
      question={{ text: q?.text ?? "", source: q?.source ?? "bank" }}
      expired={closed || !open}
      sending={act.isPending}
      onBack={() => router.back()}
      onSend={(text) =>
        open &&
        act.mutate(
          { type: "answer", question: q.question_id!, text },
          {
            onSuccess: () => {
              toast(ko.answer.sent);
              router.back();
            },
            onError: (e) => errorCode(e) === "question_closed" && setClosed(true),
          },
        )
      }
      onHome={() => router.dismissTo("/")}
      onPast={() =>
        router.replace({ pathname: "/archive", params: { kind: "question", family: family.relationship_id } })
      }
    />
  );
}
