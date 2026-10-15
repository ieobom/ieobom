// 마이 > 통화 편한 시간(39차 ScheduleSettingsScreen · TimesEditor · TimeAddSheet).
// 기본 세 가지 시간에 내가 더한 시간을 붙여 보여 주고, 3개까지 골라 '저장'하면 통째로 바꾼다(set_call_times).
// 시안의 시각 고르기(select)는 휴대폰에 맞게 한 시간씩 앞뒤로 옮기는 단추로 바꿨다.
import { CALL_DAYS } from "@ieobom/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { Button, C, Chip, Dialog, IcoArrow, Option, R, Screen, ScreenHeader, Sheet, T, useToast } from "@/ui";
import { sameSlot, slotLabel } from "./labels";
import { BottomBar } from "./parts";
import type { CallDays, CallTime } from "./types";

/** 시안의 기본 시간: 평일 저녁 7시 – 9시 · 토요일 오전 10시 – 12시 · 일요일 오후 2시 – 4시 */
const PRESETS: CallTime[] = [
  { days: "weekdays", start_hour: 19, end_hour: 21 },
  { days: "sat", start_hour: 10, end_hour: 12 },
  { days: "sun", start_hour: 14, end_hour: 16 },
];
const FIRST_HOUR = 6;
const LAST_HOUR = 23;
const MAX = 3;

type Slot = { t: CallTime; on: boolean };

function startSlots(saved: CallTime[]): Slot[] {
  return [
    ...PRESETS.map((p) => ({ t: p, on: saved.some((s) => sameSlot(s, p)) })),
    ...saved.filter((s) => !PRESETS.some((p) => sameSlot(p, s))).map((t) => ({ t, on: true })),
  ];
}

export function ScheduleScreen({
  saved,
  onBack,
  onSave,
}: {
  saved: CallTime[];
  onBack: () => void;
  onSave: (times: CallTime[]) => void;
}) {
  const m = ko.my;
  const toast = useToast();
  const [slots, setSlots] = useState<Slot[]>(() => startSlots(saved));
  const [adding, setAdding] = useState(false);
  const [leave, setLeave] = useState(false);
  const picked = slots.filter((s) => s.on).map((s) => s.t);
  const dirty = picked.length !== saved.length || picked.some((p) => !saved.some((s) => sameSlot(s, p)));

  const flip = (i: number) => {
    if (!slots[i]!.on && picked.length >= MAX) return toast(m.maxTimes);
    setSlots(slots.map((s, j) => (j === i ? { ...s, on: !s.on } : s)));
  };
  const add = (t: CallTime) => {
    setAdding(false);
    const had = slots.find((s) => sameSlot(s.t, t));
    if (had?.on) return toast(m.already);
    setSlots(had ? slots.map((s) => (s === had ? { ...s, on: true } : s)) : [...slots, { t, on: true }]);
    toast(m.added);
  };

  return (
    <Screen>
      <ScreenHeader title={m.schedule} onBack={() => (dirty ? setLeave(true) : onBack())} />
      <ScrollView contentContainerStyle={styles.body}>
        <T size={14} lh={1.65} color={C.textTertiary} style={styles.lead}>
          {m.scheduleNote}
        </T>
        <View style={styles.list}>
          {slots.map((s, i) => (
            <Option
              key={slotLabel(s.t)}
              label={slotLabel(s.t)}
              selected={s.on}
              mark
              onPress={() => flip(i)}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => (picked.length >= MAX ? toast(m.maxTimes) : setAdding(true))}
          style={styles.addLink}
        >
          <T size={15} weight={600} color={C.primary}>
            {m.addTime}
          </T>
        </Pressable>
      </ScrollView>
      <BottomBar>
        {picked.length === 0 ? (
          <T size={14} color={C.textTertiary} align="center" style={styles.emptyNote}>
            {m.scheduleEmpty}
          </T>
        ) : null}
        <Button onPress={() => onSave(picked)}>{m.save}</Button>
      </BottomBar>
      {adding ? <TimeAddSheet onClose={() => setAdding(false)} onAdd={add} /> : null}
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

function TimeAddSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (t: CallTime) => void }) {
  const m = ko.my;
  const [days, setDays] = useState<CallDays>("weekdays");
  const [start, setStart] = useState(19);
  const [end, setEnd] = useState(21);
  const bad = end <= start;
  const t: CallTime = { days, start_hour: start, end_hour: end };
  return (
    <Sheet visible onClose={onClose}>
      <T size={20} weight={800} ls={-0.04} style={styles.sheetTitle}>
        {m.addTitle}
      </T>
      <T size={13} weight={600} color={C.textSub} style={styles.label}>
        {m.day}
      </T>
      <View style={styles.chips}>
        {CALL_DAYS.map((d) => (
          <Chip key={d} label={ko.time.days[d]} selected={days === d} onPress={() => setDays(d)} />
        ))}
      </View>
      <View style={styles.hours}>
        <HourStepper label={m.start} value={start} onChange={setStart} />
        <HourStepper label={m.end} value={end} onChange={setEnd} bad={bad} />
      </View>
      <T size={13} color={bad ? C.danger : C.textTertiary} style={styles.preview}>
        {bad ? m.badRange : slotLabel(t)}
      </T>
      <Button onPress={() => onAdd(t)} disabled={bad}>
        {m.add}
      </Button>
    </Sheet>
  );
}

function HourStepper({
  label,
  value,
  onChange,
  bad = false,
}: {
  label: string;
  value: number;
  onChange: (h: number) => void;
  bad?: boolean;
}) {
  const m = ko.my;
  const step = (d: -1 | 1) => {
    const next = value + d;
    if (next >= FIRST_HOUR && next <= LAST_HOUR) onChange(next);
  };
  return (
    <View style={styles.flex}>
      <T size={13} weight={600} color={C.textSub} style={styles.label}>
        {label}
      </T>
      <View style={[styles.stepper, bad && { borderColor: C.danger }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} ${m.earlier}`}
          disabled={value <= FIRST_HOUR}
          onPress={() => step(-1)}
          style={[styles.stepBtn, value <= FIRST_HOUR && styles.off]}
        >
          <IcoArrow dir={-1} color={C.textSub} />
        </Pressable>
        <T size={16} align="center" style={styles.flex} accessibilityLiveRegion="polite">
          {ko.time.hour(value)}
        </T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} ${m.later}`}
          disabled={value >= LAST_HOUR}
          onPress={() => step(1)}
          style={[styles.stepBtn, value >= LAST_HOUR && styles.off]}
        >
          <IcoArrow dir={1} color={C.textSub} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  lead: { marginHorizontal: 2, marginBottom: 18 },
  list: { gap: 10 },
  addLink: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
    marginTop: 10,
  },
  emptyNote: { marginBottom: 10 },
  sheetTitle: { marginBottom: 20 },
  label: { marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  hours: { flexDirection: "row", gap: 10, marginBottom: 10 },
  stepper: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: R.btn,
    flexDirection: "row",
    alignItems: "center",
  },
  stepBtn: { width: 44, minHeight: 48, alignItems: "center", justifyContent: "center" },
  off: { opacity: 0.3 },
  preview: { minHeight: 20, marginBottom: 18 },
});
