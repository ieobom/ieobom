import { ko } from "@/copy/ko";
import { useSession } from "@/lib/session";
import { Placeholder } from "@/ui";

// 홈. 로그인(3-x) 전에는 안내만 보여 준다. 홈 화면은 10-6에서 붙인다
export default function Home() {
  const session = useSession();
  if (session === undefined) return null;
  if (!session) return <Placeholder title={ko.appName} body={ko.app.signedOut} />;
  return <Placeholder title={ko.tabs.home} body={ko.app.comingSoon} />;
}
