import { ko } from "@/copy/ko";
import { HomeScreen, type HomeHandlers } from "@/features/home/home-screen";
import { useHome, useHomeAction, useTalkList } from "@/features/home/use-home";
import { useSession } from "@/lib/session";
import { Placeholder, useToast } from "@/ui";

// 홈. 로그인(3-x) 전에는 안내만 보여 준다
export default function Home() {
  const session = useSession();
  if (session === undefined) return null;
  if (!session) return <Placeholder title={ko.appName} body={ko.app.signedOut} />;
  return <SignedInHome userId={session.user.id} />;
}

function SignedInHome({ userId }: { userId: string }) {
  const toast = useToast();
  const home = useHome(userId);
  const act = useHomeAction(userId);
  const first = home.data?.families.find((f) => f.cards.some((c) => c.kind === "free_now"));
  const talk = useTalkList(userId, first?.relationship_id);
  if (!home.data) return null;

  // 아직 만들지 않은 화면(답하기 · 통화 · 초대 · 기록 · 질문 만들기 · 초안 저장)은 안내만 띄운다
  const soon = () => toast(ko.app.comingSoon);
  const handlers: HomeHandlers = {
    onCall: soon,
    onCallScreen: soon,
    onAnswer: soon,
    onPast: soon,
    onMakeQuestion: soon,
    onInvite: soon,
    onCode: soon,
    onDraftOpen: soon,
    onMissedOk: (call) => act.mutate({ type: "see_missed", call }),
    onNewsOk: (ids) => act.mutate({ type: "see_news", ids }),
    onQuestionSeen: (question) => act.mutate({ type: "see_question", question }),
    onChoose: (question, choice) => act.mutate({ type: "choose_early", question, choice }),
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
