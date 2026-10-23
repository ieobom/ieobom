import { useQueryClient } from "@tanstack/react-query";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ko } from "@/copy/ko";
import { kakaoName, useKakaoLogin } from "@/features/auth/use-kakao-login";
import { partnerLabel } from "@/features/home/partner";
import { inviterLabel } from "@/features/invite/labels";
import {
  useAcceptInvite,
  useInviteStatus,
  useIssueInvite,
  usePreviewInvite,
  type Issued,
  type Lookup,
} from "@/features/invite/use-invite";
import type { MyPage } from "@/features/my/types";
import { useMyAction } from "@/features/my/use-my";
import { SignupFlow } from "@/features/signup/signup-flow";
import { useSignedUp, useSignupComplete } from "@/features/signup/use-signup";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 가입. 로그인 전이면 카카오 로그인부터, 로그인했지만 가입을 마치지 않았으면 이름부터.
// 아직 없는 것: 문서 보기(12-2), 카카오톡으로 보내기 · 코드 복사(4-3), 알림 · 마이크 권한(6-2)
export default function Signup() {
  const session = useSession();
  const userId = session?.user.id;
  const signedUp = useSignedUp(userId);
  const toast = useToast();
  const qc = useQueryClient();
  // 웹(개발 확인용)은 카카오에서 돌아온 화면(/auth/kakao)이 실패하면 ?login=failed 로 보낸다
  const { login } = useLocalSearchParams<{ login?: string }>();
  const kakao = useKakaoLogin((code) =>
    toast(code === "needs_dev_build" ? ko.signup.needsDevBuild : ko.signup.notConfigured),
  );
  const complete = useSignupComplete(userId);
  const act = useMyAction(userId);
  const issue = useIssueInvite(userId);
  const preview = usePreviewInvite();
  const accept = useAcceptInvite(userId);
  const [issued, setIssued] = useState<Issued | undefined>(undefined);
  const [lookup, setLookup] = useState<Lookup | undefined>(undefined);
  const [linked, setLinked] = useState<string | undefined>(undefined);
  const latest = useRef("");
  const status = useInviteStatus(issued?.id);
  const used = status.data?.status === "used" ? status.data.relationship_id : null;

  // 보낸 코드를 상대가 넣으면 이어진 가족 이름을 알아 와서 '이어졌어요'로
  const familyName = async (rel: string | null) => {
    await qc.refetchQueries({ queryKey: ["my", userId] });
    const f = qc.getQueryData<MyPage>(["my", userId])?.families.find((x) => x.relationship_id === rel);
    return f ? partnerLabel(f) : ko.family.someone;
  };
  useEffect(() => {
    if (used) familyName(used).then(setLinked);
    // familyName은 그때그때 만들어도 같은 일을 한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [used]);

  if (session === undefined || (userId && signedUp.isPending)) return null;
  // 가입을 마친 사람은 홈으로(가입 흐름 중에는 다시 묻지 않아서 끝날 때까지 여기 있는다)
  if (session && signedUp.data && !complete.isSuccess) return <Redirect href="/" />;
  const soon = () => toast(ko.app.comingSoon);

  return (
    <SignupFlow
      start={session ? "profile" : "login"}
      loggedIn={!!session}
      loggingIn={kakao.busy}
      loginError={kakao.failed || login === "failed"}
      kakaoName={kakaoName(session)}
      onLogin={() => {
        if (login) router.setParams({ login: undefined });
        kakao.start();
      }}
      onCancelLogin={kakao.cancel}
      onDoc={soon}
      onSignup={(name, agreed) => complete.mutateAsync({ name, agreed })}
      issued={issued}
      onIssue={(invite_as, my_kind) => issue.mutate({ invite_as, my_kind }, { onSuccess: setIssued })}
      onKakaoShare={soon}
      onCopy={soon}
      onEarlyNotify={soon}
      linked={linked}
      lookup={lookup}
      onCode={(c) => {
        latest.current = c;
        setLookup(undefined);
        if (c.length === 6) preview.mutate(c, { onSuccess: (r) => latest.current === c && setLookup(r) });
      }}
      onConnect={async (code) => {
        const r = await accept.mutateAsync(code);
        if (!r.ok || !lookup?.ok) {
          if (!r.ok) setLookup(r);
          throw new Error("not_connected");
        }
        await familyName(null);
        return { name: inviterLabel(lookup), parent: lookup.invite_as !== "child" };
      }}
      onTimes={(times) => act.mutate({ type: "call_times", times })}
      onQuestions={(freq, avoid) => {
        const rel = qc.getQueryData<MyPage>(["my", userId])?.families[0]?.relationship_id;
        if (!rel) return;
        act.mutate({ type: "freq", relationship: rel, freq });
        if (avoid.length) act.mutate({ type: "topics", relationship: rel, avoid_topics: avoid });
      }}
      onFinish={(notifyOn, time, parent) =>
        act.mutate(
          { type: "profile", patch: { notify_on: notifyOn, notify_time: time, large_text: parent } },
          {
            onSettled: () => {
              qc.invalidateQueries({ queryKey: ["signed-up", userId] });
              router.replace("/");
            },
          },
        )
      }
    />
  );
}
