import { router } from "expo-router";
import { ko } from "@/copy/ko";
import { SettingsScreen } from "@/features/my/settings-screen";
import { useInquiries, useInquiryAction } from "@/features/my/use-help";
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
  const inquiries = useInquiries(userId);
  const ask = useInquiryAction(userId);
  if (!my.data) return null;
  // 아직 만들지 않은 것: 문서 보기(12-2) · 가족 전화 받기(6-8) · 로그아웃(3-5) · 탈퇴(3-7)
  const soon = () => toast(ko.app.comingSoon);
  return (
    <SettingsScreen
      data={my.data}
      inquiries={inquiries.data ?? []}
      handlers={{
        onFamilies: () => router.push("/my/families"),
        onSchedule: () => router.push("/my/schedule"),
        onNotify: () => router.push("/my/notify"),
        onPrivacy: () => router.push("/my/privacy"),
        onDoc: soon,
        onHelpOpen: () => {
          const unseen = (inquiries.data ?? []).filter((x) => x.answer && !x.answer_seen_at).map((x) => x.id);
          if (unseen.length) ask.mutate({ type: "seen", ids: unseen });
        },
        onHelpGo: (go) => {
          if (go === "big") {
            act.mutate({ type: "profile", patch: { large_text: true } });
            toast(ko.help.bigDone);
          } else if (go === "privacy") router.push("/my/privacy");
          else if (go === "schedule") router.push("/my/schedule");
          else if (go === "family") router.push("/my/families");
          else soon();
        },
        onSendInquiry: (body, helpItem) =>
          ask.mutate(
            { type: "send", body, help_item: helpItem },
            { onSuccess: () => toast(ko.help.sentToast) },
          ),
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
