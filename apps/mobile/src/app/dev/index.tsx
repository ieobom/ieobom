import { Link, Redirect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { useFeatureFlags } from "@/features/config/use-features";
import { usePing } from "@/features/dev/use-ping";
import { C, T, WORDMARK } from "@/ui";

// 개발 확인용: 서버 연결 · 기능 켜고 끄기 값을 보고, 개발 확인용 화면으로 간다. 출시 빌드에서는 열리지 않는다.
export default function DevHome() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DevHub />;
}

function DevHub() {
  const ping = usePing();
  const status = ping.isPending ? ko.dev.serverChecking : ping.isError ? ko.dev.serverFail : ko.dev.serverOk;
  const flags = useFeatureFlags();
  return (
    <View style={styles.root}>
      <T size={28} color={C.primary} style={{ fontFamily: WORDMARK }}>
        {ko.appName}
      </T>
      <T size={15} color={C.textSub} testID="server-status">
        {status}
      </T>
      {__DEV__ && flags.data ? (
        <T size={13} color={C.textTertiary} testID="feature-flags">
          {Object.entries(flags.data)
            .map(([key, on]) => `${key} ${on ? "on" : "off"}`)
            .join(" · ")}
        </T>
      ) : null}
      {__DEV__ ? (
        <Link href="/dev/my" style={styles.link}>
          <T size={14} color={C.primary}>
            {ko.dev.myGallery}
          </T>
        </Link>
      ) : null}
      {__DEV__ ? (
        <Link href="/dev/archive" style={styles.link}>
          <T size={14} color={C.primary}>
            {ko.dev.archiveGallery}
          </T>
        </Link>
      ) : null}
      {__DEV__ ? (
        <Link href="/dev/home" style={styles.link}>
          <T size={14} color={C.primary}>
            {ko.dev.homeGallery}
          </T>
        </Link>
      ) : null}
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
