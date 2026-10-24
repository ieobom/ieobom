// 개발 확인용: 가입 흐름을 가짜 데이터로 그려 39차 시안과 나란히 본다. 카카오 로그인은 1초 뒤 된 것으로, 코드는 시연 숫자로 본다.
// 출시 빌드에서는 열리지 않는다.
import { Redirect } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { lookupFixture } from "@/features/dev/invite-fixtures";
import { inviterLabel } from "@/features/invite/labels";
import type { Issued, Lookup } from "@/features/invite/use-invite";
import { SignupFlow, type SignupStep } from "@/features/signup/signup-flow";
import { C, Chip, useToast } from "@/ui";

const CASES: [string, string, SignupStep][] = [
  ["start", "처음부터", "login"],
  ["profile", "로그인함 · 이름부터", "profile"],
  ["me", "나는 누구인가요", "me"],
  ["family", "자녀 · 엄마 아빠 고르기", "family"],
  ["times", "통화 편한 시간", "times"],
];

export default function DevSignup() {
  const toast = useToast();
  const [key, setKey] = useState(CASES[0]![0]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<Issued | undefined>(undefined);
  const [linked, setLinked] = useState<string | undefined>(undefined);
  const [lookup, setLookup] = useState<Lookup | undefined>(undefined);
  if (!__DEV__) return <Redirect href="/" />;
  const c = CASES.find((x) => x[0] === key) ?? CASES[0]!;
  const say = (what: string) => () => toast(what);
  const reset = (k: string) => {
    setKey(k);
    setLoggedIn(k !== "start");
    setIssued(undefined);
    setLinked(undefined);
    setLookup(undefined);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bar}
        contentContainerStyle={styles.barRow}
      >
        {CASES.map(([k, label]) => (
          <Chip key={k} label={label} selected={k === key} onPress={() => reset(k)} />
        ))}
        <Chip
          label="상대가 코드를 넣음"
          selected={!!linked}
          onPress={() => setLinked(linked ? undefined : "엄마")}
        />
      </ScrollView>
      <View style={styles.flex} key={key}>
        <SignupFlow
          start={c[2]}
          loggedIn={loggedIn}
          loggingIn={busy}
          loginError={false}
          kakaoName={loggedIn ? "아영" : ""}
          onLogin={() => {
            setBusy(true);
            setTimeout(() => {
              setBusy(false);
              setLoggedIn(true);
            }, 1000);
          }}
          onCancelLogin={() => setBusy(false)}
          onDoc={(k) => toast(ko.my.docs[k])}
          onSignup={() => Promise.resolve()}
          issued={issued}
          onIssue={() =>
            setIssued({
              id: "new",
              code: "482716",
              expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
            })
          }
          onKakaoShare={say("카카오톡으로 보내기 (4-3)")}
          onCopy={say("코드 복사 (4-3)")}
          onEarlyNotify={say("알림 권한 (6-2)")}
          linked={linked}
          lookup={lookup}
          onCode={(v) => setLookup(v.length === 6 ? lookupFixture(v) : undefined)}
          onConnect={() =>
            lookup?.ok
              ? Promise.resolve({ name: inviterLabel(lookup), parent: lookup.invite_as !== "child" })
              : Promise.reject(new Error("no"))
          }
          onTimes={say("통화 편한 시간 저장")}
          onQuestions={(f, a) => toast(`주 ${f}번 · 피하고 싶은 주제 ${a.length}개`)}
          onFinish={(on, t, parent) =>
            toast(`시작하기 · 알림 ${on ? ko.my.notifyTimes[t] : "끔"}${parent ? " · 글자 크게" : ""}`)
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  bar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: C.border },
  barRow: { gap: 6, padding: 8, alignItems: "center" },
});
