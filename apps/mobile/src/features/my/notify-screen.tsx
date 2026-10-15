// 마이 > 알림 받는 시각(39차 NotificationSettingsScreen). 하루 한 번 묶음 알림을 받을지와 시각.
// 휴대폰 설정에서 알림이 꺼졌을 때의 안내는 알림 권한을 붙일 때(6-8) 더한다.
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { Button, C, CARD, Dialog, Option, Screen, ScreenHeader, T, Toggle } from "@/ui";
import { BottomBar } from "./parts";
import type { NotifyTime } from "./types";

const TIMES = Object.keys(ko.my.notifyTimes) as NotifyTime[];

export function NotifyScreen({
  on: savedOn,
  time: savedTime,
  onBack,
  onSave,
}: {
  on: boolean;
  time: NotifyTime;
  onBack: () => void;
  onSave: (on: boolean, time: NotifyTime) => void;
}) {
  const m = ko.my;
  const [on, setOn] = useState(savedOn);
  const [time, setTime] = useState(savedTime);
  const [leave, setLeave] = useState(false);
  const dirty = on !== savedOn || time !== savedTime;
  return (
    <Screen>
      <ScreenHeader title={m.notify} onBack={() => (dirty ? setLeave(true) : onBack())} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[CARD, styles.card]}>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: on }}
            accessibilityLabel={m.notifyOn}
            onPress={() => setOn(!on)}
            style={styles.row}
          >
            <View style={styles.flex}>
              <T size={16} weight={500} ls={-0.02}>
                {m.notifyOn}
              </T>
              <T size={13} color={C.textTertiary} style={styles.sub}>
                {m.notifyOnSub}
              </T>
            </View>
            <Toggle display on={on} />
          </Pressable>
        </View>
        <T size={14} lh={1.6} color={C.textTertiary} style={styles.note}>
          {m.notifyNote}
        </T>
        <T size={15} weight={700} style={styles.head}>
          {m.notifyTimeHead}
        </T>
        <View style={[styles.grid, !on && styles.off]} pointerEvents={on ? "auto" : "none"}>
          {TIMES.map((t) => (
            <View key={t} style={styles.cell}>
              <Option label={m.notifyTimes[t]} selected={time === t} onPress={() => setTime(t)} />
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomBar>
        <Button onPress={() => onSave(on, time)}>{m.save}</Button>
      </BottomBar>
      <Dialog
        visible={leave}
        title={m.leaveTitle}
        body={m.leaveBody}
        confirmLabel={ko.common.leave}
        cancelLabel={m.keepEditing}
        onConfirm={() => {
          setLeave(false);
          onBack();
        }}
        onCancel={() => setLeave(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: 24, paddingBottom: 8 },
  card: { overflow: "hidden", marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  sub: { marginTop: 2 },
  note: { marginBottom: 24 },
  head: { marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  cell: { width: "48%", flexGrow: 1 },
  off: { opacity: 0.45 },
});
