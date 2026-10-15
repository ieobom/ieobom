import { router, useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { ko } from "@/copy/ko";
import { partnerLabel } from "@/features/home/partner";
import { useHome } from "@/features/home/use-home";
import { AfterCallMemoScreen, EditMemoScreen } from "@/features/memo/memo-screen";
import { useCallMemoContext, useMemoAction, useMemoRecord, useTalkItems } from "@/features/memo/use-memo";
import { useMyPage } from "@/features/my/use-my";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 메모. 통화 뒤(?call=통화ID) · 홈의 통화 메모 초안 카드(?draft=초안ID)는 통화 후 메모, 기록의 '메모 고치기'(?edit=메모ID)는 고치기
export default function Memo() {
  const params = useLocalSearchParams<{ call?: string; draft?: string; edit?: string }>();
  const session = useSession();
  const userId = session?.user.id;
  if (!userId) return null;
  return params.edit ? (
    <EditMemo userId={userId} memoId={params.edit} />
  ) : (
    <AfterCallMemo userId={userId} call={params.call} draft={params.draft} />
  );
}

function EditMemo({ userId, memoId }: { userId: string; memoId: string }) {
  const toast = useToast();
  const memo = useMemoRecord(userId, memoId);
  const act = useMemoAction(userId);
  if (!memo.data) return null;
  return (
    <EditMemoScreen
      memo={memo.data}
      saving={act.isPending}
      onBack={() => router.back()}
      onSave={(mood, text) =>
        act.mutate(
          { type: "update", memo: memoId, mood, text },
          {
            onSuccess: () => {
              toast(ko.memo.edited);
              router.back();
            },
          },
        )
      }
      onDelete={() =>
        act.mutate(
          { type: "delete", memo: memoId },
          {
            onSuccess: () => {
              toast(ko.archive.memoDeleted);
              router.back();
            },
          },
        )
      }
    />
  );
}

function AfterCallMemo({ userId, call, draft }: { userId: string; call?: string; draft?: string }) {
  const toast = useToast();
  const ctx = useCallMemoContext(userId, { call, draft });
  const home = useHome(userId);
  const my = useMyPage(userId);
  const talks = useTalkItems(userId, ctx.data?.relationshipId);
  const act = useMemoAction(userId);
  // 날씨 이야기는 표시할 때 생긴 ID로 되돌린다
  const made = useRef(new Map<string, string>());
  const family = home.data?.families.find((f) => f.relationship_id === ctx.data?.relationshipId);
  if (!ctx.data || !family || !my.data) return null;
  const c = ctx.data;
  // 초안 줄이 없으면: 내가 꺼 두었으면 '꺼져 있어요', 아니면 안내 없이 직접 쓴다
  const status = c.draft?.status ?? (my.data.me.memo_draft_on ? "none" : "off_self");
  return (
    <AfterCallMemoScreen
      partner={partnerLabel(family)}
      parent={family.my_side === "parent"}
      draft={{ status, text: c.draft?.text ?? null }}
      talks={talks.data ?? []}
      saving={act.isPending}
      onToggleAsk={(t, on) => {
        const key = t.id ?? t.text;
        if (on) {
          act.mutate(
            { type: "ask", relationship: c.relationshipId, suggestion: t.id },
            { onSuccess: (id) => id && made.current.set(key, id) },
          );
        } else {
          const id = t.id ?? made.current.get(key);
          if (id) act.mutate({ type: "unask", suggestion: id });
        }
      }}
      onSave={(mood, text) =>
        act.mutateAsync({ type: "save", call: c.callId, mood, text }).then(() => undefined)
      }
      onKeep={(making) => {
        toast(making ? ko.memo.keptMaking : ko.memo.keptReady);
        router.back();
      }}
      onSkip={() => router.back()}
      onDone={() => {
        toast(ko.memo.left);
        router.dismissTo("/");
      }}
    />
  );
}
