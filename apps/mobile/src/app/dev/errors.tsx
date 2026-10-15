import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { flush, queuedCount, track } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { Button, C, Screen, T } from "@/ui";

// 개발 확인용: 앱 오류 기록(11-3)과 이용 기록 묶어 보내기(11-4)를 일부러 내 본다
export default function DevErrors() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ErrorLab />;
}

function Boom(): null {
  throw new Error("dev render test 42");
}

function FailingLoad() {
  useQuery({
    queryKey: ["dev-fail"],
    retry: false,
    queryFn: async () => {
      const { error } = await supabase.from("client_errors").select("id");
      if (error) throw error;
      return null;
    },
  });
  return null;
}

function ErrorLab() {
  const [boom, setBoom] = useState(false);
  const [load, setLoad] = useState(false);
  const [count, setCount] = useState(queuedCount());
  return (
    <Screen>
      <View style={styles.root}>
        <T size={20} weight={800}>
          {ko.dev.errorsGallery}
        </T>
        <T size={14} color={C.textSub}>
          {ko.dev.errorsHint}
        </T>
        <Button onPress={() => setBoom(true)}>{ko.dev.throwRender}</Button>
        <Button variant="secondary" onPress={() => setLoad(true)}>
          {ko.dev.throwLoad}
        </Button>
        <Button
          variant="secondary"
          onPress={() =>
            setTimeout(() => {
              throw new Error("dev crash test");
            })
          }
        >
          {ko.dev.throwCrash}
        </Button>
        <Button
          variant="secondary"
          onPress={() => {
            track("card_tap", { kind: "dev" });
            setCount(queuedCount());
          }}
        >
          {ko.dev.trackOne}
        </Button>
        <Button variant="secondary" onPress={() => flush().then(() => setCount(queuedCount()))}>
          {ko.dev.flushNow}
        </Button>
        <T size={14} color={C.textSub} testID="queued">
          {ko.dev.queued(count)}
        </T>
        {boom ? <Boom /> : null}
        {load ? <FailingLoad /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 12, padding: 24 },
});
