// 화면 틀. 위쪽 안전 영역과 흰 바탕을 맞춘다. 아래 탭이 있는 화면은 아래 안전 영역을 탭이 맡는다.
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { T } from "./text";
import { C } from "./theme";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {children}
    </SafeAreaView>
  );
}

/** 아직 만들지 않은 화면 · 로그인 전처럼 글 한 줄만 보여 줄 때 */
export function Placeholder({ title, body }: { title: string; body?: string }) {
  return (
    <Screen>
      <View style={styles.center}>
        <T size={20} weight={800} ls={-0.03} align="center">
          {title}
        </T>
        {body ? (
          <T size={15} lh={1.6} color={C.textSub} align="center">
            {body}
          </T>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24 },
});
