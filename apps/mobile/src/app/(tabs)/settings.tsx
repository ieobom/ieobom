import { router } from "expo-router";
import { ko } from "@/copy/ko";
import { SettingsScreen } from "@/features/my/settings-screen";
import { useMyAction, useMyPage } from "@/features/my/use-my";
import { useSession } from "@/lib/session";
import { Placeholder, useToast } from "@/ui";

// 마이. 로그인(3-x) 전에는 안내만 보여 준다
export default function Settings() {
  const session = useSession();
  if (session === undefined) return null;
  if (!session) return <Placeholder title={ko.tabs.settings} body={ko.app.signedOut} />;
  return <SignedInSettings userId={session.user.id} />;
}

function SignedInSettings({ userId }: { userId: string }) {
  const toast = useToast();
  const my = useMyPage(userId);
  const act = useMyAction(userId);
  if (!my.data) return null;
  // 아직 만들지 않은 것: 문서 보기(12-2) · 도움말 · 문의(10-9) · 로그아웃(3-5) · 탈퇴(3-7)
  const soon = () => toast(ko.app.comingSoon);
  return (
    <SettingsScreen
      data={my.data}
      handlers={{
        onFamilies: () => router.push("/my/families"),
        onSchedule: () => router.push("/my/schedule"),
        onNotify: () => router.push("/my/notify"),
        onPrivacy: () => router.push("/my/privacy"),
        onDoc: soon,
        onHelp: soon,
        onLogout: soon,
        onWithdraw: soon,
        onRename: (name) =>
          act.mutate({ type: "profile", patch: { name } }, { onSuccess: () => toast(ko.my.renamed) }),
        onMemoDraft: (on) =>
          act.mutate(
            { type: "memo_draft", on },
            { onSuccess: () => toast(on ? ko.my.memoDraftTurnedOn : ko.my.memoDraftTurnedOff) },
          ),
        onBigText: (on) => act.mutate({ type: "profile", patch: { large_text: on } }),
      }}
    />
  );
}
