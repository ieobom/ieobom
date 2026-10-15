import { router } from "expo-router";
import { ko } from "@/copy/ko";
import { NotifyScreen } from "@/features/my/notify-screen";
import { useMyAction, useMyPage } from "@/features/my/use-my";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 마이 > 알림 받는 시각
export default function Notify() {
  const session = useSession();
  const toast = useToast();
  const my = useMyPage(session?.user.id);
  const act = useMyAction(session?.user.id);
  if (!my.data) return null;
  return (
    <NotifyScreen
      on={my.data.me.notify_on}
      time={my.data.me.notify_time}
      onBack={() => router.back()}
      onSave={(on, time) =>
        act.mutate(
          { type: "profile", patch: { notify_on: on, notify_time: time } },
          {
            onSuccess: () => {
              toast(ko.my.saved);
              router.back();
            },
          },
        )
      }
    />
  );
}
