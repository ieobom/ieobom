import { router } from "expo-router";
import { ko } from "@/copy/ko";
import { ScheduleScreen } from "@/features/my/schedule-screen";
import { useMyAction, useMyPage } from "@/features/my/use-my";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 마이 > 통화 편한 시간
export default function Schedule() {
  const session = useSession();
  const toast = useToast();
  const my = useMyPage(session?.user.id);
  const act = useMyAction(session?.user.id);
  if (!my.data) return null;
  return (
    <ScheduleScreen
      saved={my.data.call_times}
      onBack={() => router.back()}
      onSave={(times) =>
        act.mutate(
          { type: "call_times", times },
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
