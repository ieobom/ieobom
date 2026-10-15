// 마이 > 가족에게 보이는 정보(39차 PrivacyCenterScreen). 가족별 설정에서 열면 그 가족 이름으로 보여 준다.
import { ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { C, CARD, Screen, ScreenHeader, T } from "@/ui";
import { MarkList } from "./parts";

export function PrivacyScreen({ family, onBack }: { family?: string; onBack: () => void }) {
  const m = ko.my;
  return (
    <Screen>
      <ScreenHeader title={family ? m.shownTo(family) : m.privacy} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[CARD, styles.card]}>
          <T size={15} weight={700} style={styles.head}>
            {family ? m.shownToWho(family) : m.shownToFamily}
          </T>
          <MarkList items={m.shared} shown />
        </View>
        <View style={[CARD, styles.card, styles.mb16]}>
          <T size={15} weight={700} style={styles.head}>
            {m.onlyMe}
          </T>
          <MarkList items={m.notShared} shown={false} />
        </View>
        <T size={13} lh={1.65} color={C.textTertiary} style={styles.note}>
          {m.privacyNote}
        </T>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 24, paddingBottom: 48 },
  card: { paddingTop: 20, paddingHorizontal: 18, paddingBottom: 12, marginBottom: 14 },
  mb16: { marginBottom: 16 },
  head: { marginBottom: 14 },
  note: { marginHorizontal: 4 },
});
