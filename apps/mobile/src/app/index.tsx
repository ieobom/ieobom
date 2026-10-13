import { StyleSheet, Text, View } from "react-native";
import { usePing } from "@/features/dev/use-ping";

// 임시 화면: 서버 연결만 확인한다. 홈은 10-6에서 만든다.
export default function Index() {
  const ping = usePing();
  const status = ping.isPending ? "서버 확인 중" : ping.isError ? "서버 연결 안 됨" : "서버 연결됨";
  return (
    <View style={styles.root}>
      <Text style={styles.title}>이어봄</Text>
      <Text style={styles.status} testID="server-status">
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFFFFF" },
  title: { fontSize: 24, fontWeight: "700" },
  status: { fontSize: 15, color: "#6B635C" },
});
