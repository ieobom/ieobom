import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { ko } from "@/copy/ko";
import { finishKakaoWebLogin, isKakaoCancel } from "@/features/auth/kakao";
import { signInWithKakao } from "@/features/auth/use-kakao-login";
import { reportError } from "@/lib/errors";
import { Placeholder } from "@/ui";

// 개발 확인용 웹에서 카카오 로그인 화면이 돌려보내는 곳(카카오 디벨로퍼스에 등록한 리디렉션 URI).
// 인가 코드를 토큰으로 바꿔 서버에 로그인하고 가입으로 돌아간다. 휴대폰은 이 화면을 쓰지 않는다
export default function KakaoReturn() {
  const { code, error } = useLocalSearchParams<{ code?: string; error?: string }>();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const back = (failed: boolean) =>
      router.replace(failed ? { pathname: "/signup", params: { login: "failed" } } : "/signup");
    if (error) {
      back(!isKakaoCancel({ code: error }));
      return;
    }
    finishKakaoWebLogin(code)
      .then(signInWithKakao)
      .then(() => back(false))
      .catch((e: unknown) => {
        reportError("save", e);
        back(true);
      });
  }, [code, error]);
  return <Placeholder title={ko.signup.busyWeb} />;
}
