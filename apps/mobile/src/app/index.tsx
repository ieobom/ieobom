import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { usePing } from "@/features/dev/use-ping";
import { C, T, WORDMARK } from "@/ui";

// 임시 화면: 서버 연결만 확인한다. 홈은 10-6에서 만든다.
export default function Index() {
  const ping = usePing();
  const status = ping.isPending ? ko.dev.serverChecking : ping.isError ? ko.dev.serverFail : ko.dev.serverOk;
  return (
    <View style={styles.root}>
      <T size={28} color={C.primary} style={{ fontFamily: WORDMARK }}>
        {ko.appName}
      </T>
      <T size={15} color={C.textSub} testID="server-status">
        {status}
      </T>
      {__DEV__ ? (
        <Link href="/dev/ui" style={styles.link}>
          <T size={14} color={C.primary}>
            {ko.dev.gallery}
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
