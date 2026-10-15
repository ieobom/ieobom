// 개발 확인용: 가족 초대 · 받은 코드 넣기를 가짜 데이터로 그려 39차 시안과 나란히 본다. 출시 빌드에서는 열리지 않는다.
import { Redirect } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { INVITE_CASES, lookupFixture } from "@/features/dev/invite-fixtures";
import { CodeEntryScreen, InviteFlow } from "@/features/invite/invite-screens";
import { inviterLabel } from "@/features/invite/labels";
import type { Issued, Lookup } from "@/features/invite/use-invite";
import { BIG_TEXT_SCALE, C, Chip, T, TextScaleProvider, useToast } from "@/ui";

export default function DevInvite() {
  const toast = useToast();
  const [key, setKey] = useState<string>(INVITE_CASES[0]!.key);
  const [issued, setIssued] = useState<Issued | undefined>(undefined);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Lookup | undefined>(undefined);
  if (!__DEV__) return <Redirect href="/" />;
  const c = INVITE_CASES.find((x) => x.key === key);
  const say = (what: string) => () => toast(what);
  const pick = (k: string) => {
    setKey(k);
    setIssued(undefined);
    setCode("");
    setResult(undefined);
  };

  return (
    <TextScaleProvider scale={c?.data.me.large_text ? BIG_TEXT_SCALE : 1}>
      <View style={styles.root}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bar}
          contentContainerStyle={styles.barRow}
        >
          {[...INVITE_CASES.map((x) => [x.key, x.label] as const), ["code", "받은 코드 넣기"] as const].map(
            ([k, label]) => (
              <Chip key={k} label={label} selected={k === key} onPress={() => pick(k)} />
            ),
          )}
        </ScrollView>
        {key === "code" ? (
          <T size={12} color={C.textTertiary} style={styles.hint}>
            482716 아영이가 엄마로 · 628413 아빠가 자녀로 · 000000 지남 · 111111 씀 · 222222 바뀜 · 333333
            여러 번 틀림 · 593827 내 코드 · 444444 자녀가 넣는 코드 · 555555 이미 이어짐 · 374159 엄마가 이미
            있음
          </T>
        ) : null}
        <View style={styles.flex} key={key}>
          {c ? (
            <InviteFlow
              data={c.data}
              issued={issued}
              onIssue={() =>
                setIssued({
                  id: "new",
                  code: "715284",
                  expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
                })
              }
              onKakao={say("카카오톡으로 보내기 (4-3)")}
              onCopy={say("코드 복사 (4-3)")}
              onClose={say(ko.invite.closed)}
              onHaveCode={() => pick("code")}
              onExit={say("나가기")}
            />
          ) : (
            <CodeEntryScreen
              code={code}
              onChange={(v) => {
                setCode(v);
                setResult(v.length === 6 ? lookupFixture(v) : undefined);
              }}
              result={result}
              onConnect={() => result?.ok && toast(ko.invite.connected(inviterLabel(result)))}
              onBack={say("뒤로")}
            />
          )}
        </View>
      </View>
    </TextScaleProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  bar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: C.border },
  barRow: { gap: 6, padding: 8, alignItems: "center" },
  hint: { paddingHorizontal: 12, paddingVertical: 6 },
});
