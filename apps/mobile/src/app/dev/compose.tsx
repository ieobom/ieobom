// 개발 확인용: 질문 답하기 · 질문 만들기 · 근황 보내기를 가짜 데이터로 그려 39차 시안과 나란히 본다. 출시 빌드에서는 열리지 않는다.
import { Redirect } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import {
  AnswerScreen,
  ComposeTabs,
  MakeQuestionScreen,
  NewsEditorScreen,
  type ComposeKind,
} from "@/features/compose/compose-screens";
import { BIG_TEXT_SCALE, C, Chip, TextScaleProvider, useToast } from "@/ui";

const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const CASES = [
  ["answerChild", "답하기 · 자녀"],
  ["answerParent", "답하기 · 부모님"],
  ["expired", "답할 기간 지남"],
  ["make", "질문 만들기"],
  ["after", "상대가 먼저 만듦"],
  ["edit", "만든 질문 고치기"],
  ["newsChild", "근황 · 자녀"],
  ["newsParent", "근황 · 부모님"],
] as const;
type Case = (typeof CASES)[number][0];

export default function DevCompose() {
  const toast = useToast();
  const [c, setC] = useState<Case>("answerChild");
  const [kind, setKind] = useState<ComposeKind>("q");
  if (!__DEV__) return <Redirect href="/" />;
  const parent = c === "answerParent" || c === "newsParent";
  const partner = parent ? "아영이" : "엄마";
  const say = (what: string) => () => toast(what);
  const pick = (k: Case) => {
    setC(k);
    setKind(k.startsWith("news") ? "news" : "q");
  };
  const tabs = <ComposeTabs kind={kind} onKind={setKind} />;

  const body =
    c === "answerChild" || c === "answerParent" || c === "expired" ? (
      <AnswerScreen
        partner={partner}
        parent={parent}
        question={{
          text: parent ? "요즘 가장 자주 듣는 노래는 뭐야?" : "요즘 가장 자주 듣는 노래는 뭐예요?",
          source: "bank",
        }}
        expired={c === "expired"}
        onBack={say("뒤로")}
        onSend={say(ko.answer.sent)}
        onHome={say("홈으로")}
        onPast={say("지난 질문 보기")}
      />
    ) : kind === "news" && c !== "edit" ? (
      <NewsEditorScreen
        partner={partner}
        parent={parent}
        tabs={tabs}
        onBack={say("뒤로")}
        onAddPhoto={say("사진 고르기 (9-1)")}
        onSend={(d) => toast(`${ko.compose.sentNews(partner)} · ${d.topic ?? "주제 없음"}`)}
      />
    ) : (
      <MakeQuestionScreen
        partner={partner}
        toChild={parent}
        mine={c === "edit" ? { text: "엄마 첫 직장은 어디였어요?", send_on: day(2) } : null}
        slot={c === "after" ? day(5) : day(2)}
        partnerOn={c === "after" ? day(2) : null}
        tabs={c === "edit" ? undefined : tabs}
        onBack={say("뒤로")}
        onSend={say("질문 보내기")}
        onDelete={say(ko.compose.deletedQ)}
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
            <Chip key={k} label={label} selected={k === c} onPress={() => pick(k)} />
          ))}
        </ScrollView>
        <View style={styles.flex} key={`${c}-${kind}`}>
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
