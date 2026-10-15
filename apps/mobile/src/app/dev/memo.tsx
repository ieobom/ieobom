// 개발 확인용: 통화 후 메모(초안 경우 여섯 가지) · 메모 고치기를 가짜 데이터로 그려 39차 시안과 나란히 본다. 출시 빌드에서는 열리지 않는다.
import { Redirect } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { AfterCallMemoScreen, EditMemoScreen, type DraftStatus } from "@/features/memo/memo-screen";
import { BIG_TEXT_SCALE, C, Chip, TextScaleProvider, useToast } from "@/ui";

const CASES: [string, string, DraftStatus | "none" | "edit"][] = [
  ["ready", "초안 있음", "ready"],
  ["making", "초안 만드는 중", "making"],
  ["off", "내가 끔", "off_self"],
  ["partnerOff", "상대가 끔", "off_partner"],
  ["short", "1분 미만", "too_short"],
  ["failed", "못 만듦", "failed"],
  ["parent", "부모님 · 초안 있음", "ready"],
  ["edit", "메모 고치기", "edit"],
];

const DRAFT = {
  child: "무릎 검사 결과 괜찮으시대. 다음 달에 한 번 더 보신대.",
  parent: "아영이 이사 잘 끝났대. 새집 사진 보내 준다고 했다.",
};

export default function DevMemo() {
  const toast = useToast();
  const [key, setKey] = useState(CASES[0]![0]);
  if (!__DEV__) return <Redirect href="/" />;
  const [, , status] = CASES.find((c) => c[0] === key) ?? CASES[0]!;
  const parent = key === "parent";
  const say = (what: string) => () => toast(what);

  const body =
    status === "edit" ? (
      <EditMemoScreen
        memo={{
          text: "엄마 무릎 검사 결과는 괜찮으시대요. 다음 달에 한 번 더 검사받으신대요.",
          mood: "good",
          created_at: "2026-10-12T20:00:00+09:00",
        }}
        onBack={say("뒤로")}
        onSave={say(ko.memo.edited)}
        onDelete={say(ko.archive.memoDeleted)}
      />
    ) : (
      <AfterCallMemoScreen
        partner={parent ? "아영이" : "엄마"}
        parent={parent}
        draft={{ status, text: status === "ready" ? (parent ? DRAFT.parent : DRAFT.child) : null }}
        talks={[
          { id: "t1", source: "memo", text: parent ? "이사는 잘 끝났어?" : "검사 결과는 나왔어요?" },
          {
            id: null,
            source: "weather",
            text: parent
              ? "요즘 아침저녁으로 쌀쌀한데 감기 안 걸렸어?"
              : "요즘 쌀쌀한데 감기 기운은 없으세요?",
          },
        ]}
        onToggleAsk={(t, on) => toast(`${on ? "여쭤봤어요" : "되돌리기"}: ${t.text}`)}
        onSave={() => Promise.resolve()}
        onKeep={(making) => toast(making ? ko.memo.keptMaking : ko.memo.keptReady)}
        onSkip={say("건너뛰기")}
        onDone={say(ko.memo.left)}
      />
    );

  return (
    <TextScaleProvider scale={parent ? BIG_TEXT_SCALE : 1}>
      <View style={styles.root}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bar}
          contentContainerStyle={styles.barRow}
        >
          {CASES.map(([k, label]) => (
            <Chip key={k} label={label} selected={k === key} onPress={() => setKey(k)} />
          ))}
        </ScrollView>
        <View style={styles.flex} key={key}>
          {body}
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
});
