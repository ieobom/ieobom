// 글자 크게 보기. 앱 전체가 홈 함수의 large_text로 글자 크기를 정한다(앱 시작 때 부르는 함수는 홈 하나).
import type { ReactNode } from "react";
import { useHome } from "@/features/home/use-home";
import { useSession } from "@/lib/session";
import { BIG_TEXT_SCALE, TextScaleProvider } from "@/ui";

export function UserTextScale({ children }: { children: ReactNode }) {
  const session = useSession();
  const home = useHome(session?.user.id);
  return <TextScaleProvider scale={home.data?.large_text ? BIG_TEXT_SCALE : 1}>{children}</TextScaleProvider>;
}
