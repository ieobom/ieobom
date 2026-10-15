// 마이 > 이용 설문(39차 SurveyScreen). 문항마다 1~5점, 더 하고 싶은 말(선택). 모두 고르면 보낼 수 있다.
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { Button, C, Dialog, R, Screen, ScreenHeader, T, TextField } from "@/ui";
import { BottomBar } from "./parts";
import type { SurveyRound } from "./types";
import type { SurveyQuestion } from "./use-survey";

const SCALE = [1, 2, 3, 4, 5] as const;

export function SurveyScreen({
  round,
  questions,
  onBack,
  onSend,
}: {
  round: SurveyRound;
  questions: SurveyQuestion[];
  onBack: () => void;
  onSend: (scores: Record<string, number>, comment: string) => void;
}) {
  const s = ko.survey;
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [leave, setLeave] = useState(false);
  const done = questions.length > 0 && questions.every((q) => scores[q.id]);
  const started = Object.keys(scores).length > 0 || !!comment.trim();

  return (
    <Screen>
      <ScreenHeader title={s.title} onBack={() => (started ? setLeave(true) : onBack())} />
      <ScrollView contentContainerStyle={styles.body}>
        <T size={24} weight={800} ls={-0.04} lh={1.35} style={styles.heading}>
          {round ? s.cardTitle(round) : s.firstTitle}
        </T>
        <T size={15} lh={1.65} color={C.textSub} style={styles.lead}>
          {s.lead}
        </T>
        {questions.map((q, qi) => (
          <View key={q.id} style={styles.question}>
            <T size={16} weight={700} ls={-0.02} style={styles.qText}>
              {`${qi + 1}. ${q.text}`}
            </T>
            <View style={styles.scale} accessibilityRole="radiogroup" accessibilityLabel={q.text}>
              {SCALE.map((n) => {
                const on = scores[q.id] === n;
                return (
                  <Pressable
                    key={n}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={s.score(q.text, n)}
                    onPress={() => setScores({ ...scores, [q.id]: n })}
                    style={[
                      styles.point,
                      { borderColor: on ? C.primary : C.border, backgroundColor: on ? C.primaryLight : C.bg },
                    ]}
                  >
                    <T size={16} weight={on ? 700 : 500} color={on ? C.primary : C.textSub}>
                      {String(n)}
                    </T>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.ends}>
              <T size={13} color={C.textTertiary}>
                {s.low}
              </T>
              <T size={13} color={C.textTertiary}>
                {s.high}
              </T>
            </View>
          </View>
        ))}
        <T size={16} weight={700} ls={-0.02} style={styles.qText}>
          {`${questions.length + 1}. ${s.more} `}
          <T size={13} weight={500} color={C.textTertiary}>
            {s.optional}
          </T>
        </T>
        <TextField
          value={comment}
          onChangeText={setComment}
          label={s.more}
          placeholder={s.morePlaceholder}
          maxLength={2000}
          lines={3}
        />
      </ScrollView>
      <BottomBar>
        {!done && questions.length ? (
          <T size={13} color={C.textTertiary} align="center" style={styles.need}>
            {s.needAll(questions.length)}
          </T>
        ) : null}
        <Button disabled={!done} onPress={() => onSend(scores, comment.trim())}>
          {s.send}
        </Button>
      </BottomBar>
      <Dialog
        visible={leave}
        title={s.leaveTitle}
        body={s.leaveBody}
        confirmLabel={ko.common.leave}
        cancelLabel={s.keep}
        onConfirm={() => {
          setLeave(false);
          onBack();
        }}
        onCancel={() => setLeave(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  heading: { marginTop: 4, marginBottom: 8 },
  lead: { marginBottom: 24 },
  question: { marginBottom: 24 },
  qText: { marginBottom: 12 },
  scale: { flexDirection: "row", gap: 6 },
  point: {
    flex: 1,
    minHeight: 46,
    borderRadius: R.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  ends: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  need: { marginBottom: 10 },
});
