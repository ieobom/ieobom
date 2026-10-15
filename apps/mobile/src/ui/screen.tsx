// 화면 틀. 위쪽 안전 영역과 흰 바탕을 맞춘다. 아래 탭이 있는 화면은 아래 안전 영역을 탭이 맡는다.
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ko } from "@/copy/ko";
import { IcoBack } from "./icons";
import { T } from "./text";
import { C } from "./theme";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {children}
    </SafeAreaView>
  );
}

/** 뒤로 단추 + 제목 (시안의 설정 화면 머리). 제목이 없으면 뒤로 단추만 */
export function ScreenHeader({ title, onBack }: { title?: string; onBack: () => void }) {
  return (
    <View style={[styles.header, !title && styles.headerBare]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.my.back}
        onPress={onBack}
        hitSlop={8}
        style={styles.back}
      >
        <IcoBack />
      </Pressable>
      {title ? (
        <T size={20} weight={800} ls={-0.04} accessibilityRole="header" style={styles.flex}>
          {title}
        </T>
      ) : null}
    </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  headerBare: { minHeight: 36, paddingTop: 14, paddingBottom: 22 },
  back: {
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 20,
    marginVertical: -4,
    marginLeft: -10,
    marginRight: -14,
  },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24 },
});
