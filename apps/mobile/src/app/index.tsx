import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { usePing } from "@/features/dev/use-ping";
import { C, T, WORDMARK } from "@/ui";

// 임시 화면: 서버 연결만 확인한다. 홈은 10-6에서 만든다.
export default function Index() {
  const ping = usePing();
  const status = ping.isPending ? "서버 확인 중" : ping.isError ? "서버 연결 안 됨" : "서버 연결됨";
  return (
    <View style={styles.root}>
      <T size={28} color={C.primary} style={{ fontFamily: WORDMARK }}>
        이어봄
      </T>
      <T size={15} color={C.textSub} testID="server-status">
        {status}
      </T>
      {__DEV__ ? (
        <Link href="/dev/ui" style={styles.link}>
          <T size={14} color={C.primary}>
            공통 부품 보기
          </T>
        </Link>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.bg },
  link: { marginTop: 16 },
});
