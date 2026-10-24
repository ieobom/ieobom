import { Redirect, router } from "expo-router";
import { ko } from "@/copy/ko";
import { HomeScreen, type HomeHandlers } from "@/features/home/home-screen";
import { useHome, useHomeAction, useTalkList } from "@/features/home/use-home";
import { useSignedUp } from "@/features/signup/use-signup";
import { track } from "@/lib/events";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 홈. 로그인 전이거나 가입을 마치지 않았으면 가입으로 보낸다
export default function Home() {
  const session = useSession();
  const signedUp = useSignedUp(session?.user.id);
  if (session === undefined || (session && signedUp.isPending)) return null;
  if (!session || signedUp.data === false) return <Redirect href="/signup" />;
  return <SignedInHome userId={session.user.id} />;
}

function SignedInHome({ userId }: { userId: string }) {
  const toast = useToast();
  const home = useHome(userId);
  const act = useHomeAction(userId);
  const first = home.data?.families.find((f) => f.cards.some((c) => c.kind === "free_now"));
  const talk = useTalkList(userId, first?.relationship_id);
  if (!home.data) return null;

  // 앱 안 통화(단위 5)를 붙이기 전에는 안내만 띄운다
  const soon = () => toast(ko.app.callNotReady);
  // 이용 기록(11-4): 전화 걸기 단추와 홈 카드를 누른 것만 적는다
  const handlers: HomeHandlers = {
    onCall: () => {
      track("call_tap");
      soon();
    },
    onCallScreen: soon,
    // 말로 답하기(7-4)가 붙기 전에는 글로 답하기로 연다
    onAnswer: (f) => {
      track("card_tap", { kind: "question" });
      router.push({ pathname: "/answer", params: { rel: f.relationship_id } });
    },
    onPast: (f) =>
      router.navigate({ pathname: "/archive", params: { kind: "question", family: f.relationship_id } }),
    onMakeQuestion: (f) => router.push({ pathname: "/compose", params: { rel: f.relationship_id } }),
    onInvite: () => router.push("/invite"),
    onInviteOpen: (as) => router.push({ pathname: "/my/invite/[as]", params: { as } }),
    onCode: () => router.push("/invite/code"),
    onDraftOpen: (draft) => {
      track("card_tap", { kind: "memo_draft" });
      router.push({ pathname: "/memo", params: { draft } });
    },
    onMissedOk: (call) => {
      track("card_tap", { kind: "missed_call" });
      act.mutate({ type: "see_missed", call });
    },
    onNewsOk: (ids) => {
      track("card_tap", { kind: "news" });
      act.mutate({ type: "see_news", ids });
    },
    onQuestionSeen: (question) => act.mutate({ type: "see_question", question }),
    onChoose: (question, choice) => {
      track("card_tap", { kind: "early_answer", choice });
      act.mutate({ type: "choose_early", question, choice });
    },
    onDraftDelete: (draft) =>
      act.mutate(
        { type: "discard_draft", draft },
        { onSuccess: () => toast(ko.home.draft.removed, () => act.mutate({ type: "restore_draft", draft })) },
      ),
    onNoticeOk: (notice) => act.mutate({ type: "see_notice", notice, user: userId }),
  };
  return (
    <HomeScreen
      data={home.data}
      handlers={handlers}
      talk={(rel) => (rel === first?.relationship_id ? talk.data?.[0] : undefined)}
    />
  );
}
