import { router } from "expo-router";
import { useRef, useState } from "react";
import { ko } from "@/copy/ko";
import { CodeEntryScreen } from "@/features/invite/invite-screens";
import { inviterLabel } from "@/features/invite/labels";
import { useAcceptInvite, usePreviewInvite, type Lookup } from "@/features/invite/use-invite";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 받은 초대 코드 넣기(앱 안에서). 여섯 자리를 다 넣으면 서버가 확인하고, '연결하기'로 이어진다
export default function Code() {
  const session = useSession();
  const toast = useToast();
  const preview = usePreviewInvite();
  const accept = useAcceptInvite(session?.user.id);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Lookup | undefined>(undefined);
  // 빨리 고쳐 넣으면 앞선 확인 결과가 늦게 올 수 있어서 지금 칸의 코드와 맞을 때만 쓴다
  const latest = useRef("");

  return (
    <CodeEntryScreen
      code={code}
      onChange={(c) => {
        setCode(c);
        setResult(undefined);
        latest.current = c;
        if (c.length === 6) preview.mutate(c, { onSuccess: (r) => latest.current === c && setResult(r) });
      }}
      result={result}
      connecting={accept.isPending}
      onConnect={() => {
        if (!result?.ok) return;
        const who = inviterLabel(result);
        accept.mutate(code, {
          onSuccess: (r) => {
            if (!r.ok) return setResult(r);
            toast(ko.invite.connected(who));
            router.dismissTo("/");
          },
        });
      }}
      onBack={() => router.back()}
    />
  );
}
