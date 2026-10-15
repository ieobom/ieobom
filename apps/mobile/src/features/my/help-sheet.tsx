// 마이 > 도움말 · 문의(39차 HelpSheet): 보낸 문의(답이 오면 이어봄 답변) → 도움말 열 가지(답 아래 그 자리에서 할 수 있는 단추)
// → '찾는 답이 없어요 · 문의하기'. 문의는 보내기를 누를 때만 서버로 간다.
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { ko, type HelpGo } from "@/copy/ko";
import { seoulParts } from "@/lib/dates";
import { Button, C, IcoChevronDown, R, Sheet, T, TextField } from "@/ui";
import type { Inquiry } from "./use-help";

export function HelpSheet({
  visible,
  big,
  example,
  inquiries,
  onClose,
  onGo,
  onSend,
}: {
  visible: boolean;
  /** 글자 크게 보기가 켜져 있으면 '글자가 작아요'의 단추 대신 안내 */
  big: boolean;
  /** 문의 예시에 넣을 가족 이름: '엄마' · '아영이' */
  example: string;
  inquiries: Inquiry[];
  onClose: () => void;
  onGo: (go: HelpGo) => void;
  onSend: (body: string, helpItem: string) => void;
}) {
  const h = ko.help;
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(-1);
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState("");
  const date = (iso: string) => ko.time.date(seoulParts(iso));

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView style={{ maxHeight: height * 0.78 }} keyboardShouldPersistTaps="handled">
        <T size={21} weight={800} ls={-0.04} style={styles.title} accessibilityRole="header">
          {asking ? h.ask : h.title}
        </T>
        {!asking ? (
          <>
            {inquiries.length > 0 ? (
              <View style={styles.sent}>
                <T size={15} weight={700} style={styles.sentHead}>
                  {h.sent}
                </T>
                {inquiries.map((x) => (
                  <View key={x.id} style={styles.inquiry}>
                    <T
                      size={13}
                      weight={x.answer ? 700 : 500}
                      color={x.answer ? C.accent2Deep : C.textTertiary}
                      style={styles.inquiryMeta}
                    >
                      {`${date(x.created_at)} · ${x.answer ? h.answered : h.waiting}`}
                    </T>
                    <T size={15} lh={1.55}>
                      {x.body}
                    </T>
                    {x.answer ? (
                      <View style={styles.answer}>
                        <T size={13} weight={700} color={C.textSub} style={styles.inquiryMeta}>
                          {h.answerHead(x.answered_at ? date(x.answered_at) : "")}
                        </T>
                        <T size={15} lh={1.6}>
                          {x.answer}
                        </T>
                      </View>
                    ) : null}
                  </View>
                ))}
                {inquiries.some((x) => !x.answer) ? (
                  <T size={13} lh={1.6} color={C.textTertiary}>
                    {h.waitNote}
                  </T>
                ) : null}
              </View>
            ) : null}
            {h.items.map((item, i) => (
              <View key={item.key} style={styles.item}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open === i }}
                  onPress={() => setOpen(open === i ? -1 : i)}
                  style={styles.q}
                >
                  <T size={16} weight={600} style={styles.flex}>
                    {item.q}
                  </T>
                  <View style={open === i && styles.flip}>
                    <IcoChevronDown size={16} color={C.textTertiary} />
                  </View>
                </Pressable>
                {open === i ? (
                  <View style={styles.a}>
                    <T size={15} lh={1.65} color={C.textSub}>
                      {item.a}
                    </T>
                    {item.go ? (
                      item.go[1] === "big" && big ? (
                        <T size={14} weight={600} color={C.accent2Deep} style={styles.goNote}>
                          {h.bigOn}
                        </T>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => onGo(item.go![1])}
                          style={styles.go}
                        >
                          <T size={15} weight={700} color={C.primary}>
                            {item.go[0]}
                          </T>
                        </Pressable>
                      )
                    ) : null}
                  </View>
                ) : null}
              </View>
            ))}
            <View style={styles.gap} />
            <Button variant="secondary" onPress={() => setAsking(true)}>
              {h.noAnswer}
            </Button>
          </>
        ) : (
          <>
            <T size={15} lh={1.6} color={C.textSub} style={styles.askLead}>
              {h.askLead}
            </T>
            <TextField
              value={text}
              onChangeText={setText}
              label={h.bodyLabel}
              placeholder={h.askExample(example)}
              maxLength={2000}
              lines={4}
            />
            <T size={13} lh={1.6} color={C.textTertiary} style={styles.askNote}>
              {h.askNote}
            </T>
            <Button
              disabled={!text.trim()}
              onPress={() => {
                onSend(text.trim(), open >= 0 ? (h.items[open]?.key ?? "") : "");
                setText("");
                setAsking(false);
              }}
            >
              {h.send}
            </Button>
            <Button variant="ghost" onPress={() => setAsking(false)} style={styles.back}>
              {h.backToHelp}
            </Button>
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  title: { marginBottom: 12 },
  sent: { marginBottom: 22 },
  sentHead: { marginBottom: 8 },
  inquiry: {
    backgroundColor: C.well,
    borderRadius: R.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  inquiryMeta: { marginBottom: 4 },
  answer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  item: { borderBottomWidth: 1, borderBottomColor: C.border },
  q: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 },
  flip: { transform: [{ rotate: "180deg" }] },
  a: { paddingBottom: 16 },
  goNote: { marginTop: 10 },
  go: {
    alignSelf: "flex-start",
    marginTop: 10,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: C.bg,
    justifyContent: "center",
  },
  gap: { height: 20 },
  askLead: { marginBottom: 12 },
  askNote: { marginTop: 8, marginHorizontal: 2, marginBottom: 20 },
  back: { marginTop: 6 },
});
