// 화면을 그리다 오류가 났을 때 보이는 화면. 다시 해 보기와(뒤로 갈 곳이 있으면) 뒤로 가기.
import { StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { Button } from "./button";
import { Screen } from "./screen";
import { T } from "./text";
import { C } from "./theme";

export function CrashView({ onRetry, onBack }: { onRetry: () => void; onBack?: () => void }) {
  return (
    <Screen>
      <View style={styles.root}>
        <T size={20} weight={800} ls={-0.03} align="center">
          {ko.app.crashTitle}
        </T>
        <T size={15} lh={1.6} color={C.textSub} align="center">
          {ko.app.crashBody}
        </T>
        <Button onPress={onRetry} style={styles.retry}>
          {ko.app.retry}
        </Button>
        {onBack ? (
          <Button variant="ghost" onPress={onBack}>
            {ko.app.goBack}
          </Button>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24 },
  retry: { alignSelf: "stretch", marginTop: 20 },
});
