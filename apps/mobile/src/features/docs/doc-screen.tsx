// 동의 문서 한 편 (이용약관 · 개인정보 처리방침 · AI 사용 안내). 문서 내용은 src/copy/docs.ts
import { ScrollView, StyleSheet, View } from "react-native";
import type { Doc } from "@/copy/docs";
import { ko } from "@/copy/ko";
import { C, R, Screen, ScreenHeader, T } from "@/ui";

export function DocScreen({ doc, onBack }: { doc: Doc; onBack: () => void }) {
  return (
    <Screen>
      <ScreenHeader title={doc.short} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <T size={22} weight={800} ls={-0.04} accessibilityRole="header">
          {doc.title}
        </T>
        <T size={13} color={C.textTertiary} style={styles.meta}>
          {doc.meta}
        </T>

        <View style={styles.well}>
          <T size={15} weight={700} style={styles.wellHead}>
            {ko.docs.summaryHead}
          </T>
          {doc.summary.map((line) => (
            <View key={line} style={styles.bullet}>
              <View style={styles.dot} />
              <T size={15} lh={1.6} style={styles.flex}>
                {line}
              </T>
            </View>
          ))}
        </View>

        {doc.consent ? (
          <View style={styles.block}>
            <T size={16} weight={700} style={styles.h}>
              {ko.docs.consentHead}
            </T>
            <View style={styles.table}>
              {doc.consent.map(([k, v], i) => (
                <View key={k} style={[styles.row, i > 0 && styles.rowLine]}>
                  <T size={14} weight={700} color={C.textSub} style={styles.rowKey}>
                    {k}
                  </T>
                  <T size={14} lh={1.6} style={styles.flex}>
                    {v}
                  </T>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {doc.sections.map((sec) => (
          <View key={sec.h} style={styles.block}>
            <T size={16} weight={700} style={styles.h} accessibilityRole="header">
              {sec.h}
            </T>
            {sec.ps.map((p) => (
              <T key={p} size={15} lh={1.7} color={C.ink2} style={styles.p}>
                {p}
              </T>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 24, paddingBottom: 48 },
  flex: { flex: 1, minWidth: 0 },
  meta: { marginTop: 6, marginBottom: 18 },
  well: { backgroundColor: C.well, borderRadius: R.card, padding: 18, gap: 8 },
  wellHead: { marginBottom: 2 },
  bullet: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.primary, marginTop: 10 },
  block: { marginTop: 26 },
  h: { marginBottom: 10 },
  p: { marginBottom: 8 },
  table: { borderWidth: 1, borderColor: C.border, borderRadius: R.sm },
  row: { flexDirection: "row", gap: 12, padding: 14 },
  rowLine: { borderTopWidth: 1, borderTopColor: C.border },
  rowKey: { width: 82 },
});
