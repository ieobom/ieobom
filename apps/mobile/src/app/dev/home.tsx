// 개발 확인용: 홈 화면을 가짜 데이터로 그려 39차 시안과 나란히 본다. 출시 빌드에서는 열리지 않는다.
import { Redirect } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SCENARIOS } from "@/features/dev/home-fixtures";
import { HomeScreen, type HomeHandlers } from "@/features/home/home-screen";
import { BIG_TEXT_SCALE, C, Chip, TextScaleProvider, Toggle, T, useToast } from "@/ui";

export default function DevHome() {
  const [key, setKey] = useState(SCENARIOS[0]!.key);
  const [big, setBig] = useState(false);
  const toast = useToast();
  if (!__DEV__) return <Redirect href="/" />;
  const scenario = SCENARIOS.find((s) => s.key === key) ?? SCENARIOS[0]!;
  const say = (what: string) => () => toast(what);
  const handlers: HomeHandlers = {
    onCall: say("전화 걸기"),
    onCallScreen: say("통화 화면"),
    onAnswer: (_f, _q, voice) => toast(voice ? "말로 답하기" : "글로 답하기"),
    onPast: say("기록 · 질문으로 거르기"),
    onMakeQuestion: say("질문 만들기"),
    onInvite: say("가족 초대하기"),
    onCode: say("받은 초대 코드 넣기"),
    onDraftOpen: say("초안 고치고 저장"),
    onMissedOk: say("못 받은 전화 확인했어요"),
    onNewsOk: say("근황 확인했어요"),
    onQuestionSeen: say("질문 확인했어요"),
    onChoose: (_q, c) => toast(c === "send" ? "먼저 보내기" : "나만 보고 끝내기"),
    onDraftDelete: say("초안 지우기"),
    onNoticeOk: say("공지 확인했어요"),
  };
  // 부모님은 처음부터 글자 크게(39차)
  const parent = scenario.data.families[0]?.my_side === "parent";
  return (
    <TextScaleProvider scale={big || parent ? BIG_TEXT_SCALE : 1}>
      <View style={styles.root}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bar}
          contentContainerStyle={styles.barRow}
        >
          {SCENARIOS.map((s) => (
            <Chip key={s.key} label={s.label} selected={s.key === key} onPress={() => setKey(s.key)} />
          ))}
          <View style={styles.big}>
            <T size={13} color={C.textSub}>
              글자 크게
            </T>
            <Toggle on={big || parent} onChange={() => setBig(!big)} label="글자 크게 보기" />
          </View>
        </ScrollView>
        <View style={styles.flex}>
          <HomeScreen
            key={key}
            data={scenario.data}
            handlers={handlers}
            talk={() => ({ text: "검사 결과는 나왔어요?", source: "memo" })}
          />
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
  big: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 6 },
});
