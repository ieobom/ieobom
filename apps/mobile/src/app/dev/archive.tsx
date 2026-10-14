// 개발 확인용: 기록 화면을 가짜 데이터로 그려 39차 시안과 나란히 본다. 출시 빌드에서는 열리지 않는다.
import { Redirect } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ArchiveScreen, type ArchiveMode } from "@/features/archive/archive-screen";
import type { Filter } from "@/features/archive/types";
import { ARCHIVE_CALENDAR, ARCHIVE_ITEMS } from "@/features/dev/archive-fixtures";
import { seoulParts } from "@/lib/dates";
import { C, Chip, useToast } from "@/ui";

const STATES = [
  { key: "connected", label: "자녀 · 엄마와의 기록" },
  { key: "parent", label: "부모님" },
  { key: "left", label: "엄마가 탈퇴함" },
  { key: "none", label: "이어진 가족 없음" },
] as const;

export default function DevArchive() {
  const toast = useToast();
  const [st, setSt] = useState<(typeof STATES)[number]["key"]>("connected");
  const [filter, setFilter] = useState<Filter>("all");
  const [mode, setMode] = useState<ArchiveMode>("list");
  const now = seoulParts(new Date());
  const today = { y: now.year, m: now.month, d: now.day };
  const [view, setView] = useState({ y: today.y, m: today.m });
  const [day, setDay] = useState<string | undefined>(undefined);
  if (!__DEV__) return <Redirect href="/" />;
  const pad = (n: number) => String(n).padStart(2, "0");
  const selected = day ?? `${today.y}-${pad(today.m)}-${pad(today.d)}`;
  const shown = st === "left" ? ARCHIVE_ITEMS.filter((i) => !(i.kind === "news" && !i.mine)) : ARCHIVE_ITEMS;
  const items = shown.filter((i) => filter === "all" || i.kind === filter);
  const parent = st === "parent";
  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bar}
        contentContainerStyle={styles.barRow}
      >
        {STATES.map((s) => (
          <Chip key={s.key} label={s.label} selected={s.key === st} onPress={() => setSt(s.key)} />
        ))}
      </ScrollView>
      <View style={styles.flex}>
        <ArchiveScreen
          state={st === "parent" ? "connected" : st}
          partner={parent ? "아영이" : "엄마"}
          parent={parent}
          families={[
            { id: "mom", label: "엄마" },
            { id: "dad", label: "아빠" },
          ]}
          familyId="mom"
          onFamily={() => toast("가족 바꾸기")}
          filter={filter}
          onFilter={setFilter}
          mode={mode}
          onMode={setMode}
          items={items}
          calendar={{
            view,
            today,
            data: ARCHIVE_CALENDAR,
            selected,
            onSelect: setDay,
            onMove: (step) => {
              setDay(undefined);
              const m = view.m - 1 + step;
              setView({ y: view.y + Math.floor(m / 12), m: (((m % 12) + 12) % 12) + 1 });
            },
            dayItems: items.filter(
              (i) => i.at.slice(0, 10) === selected || seoulParts(i.at).day === Number(selected.slice(8)),
            ),
          }}
          actions={{
            onAsk: (talk) => toast(talk.asked_on ? "여쭤봤어요 되돌리기" : "여쭤봤어요"),
            onDeleteMemo: () => toast("메모를 지웠어요"),
            onDeleteNews: () => toast("근황을 지웠어요"),
            onEditMemo: () => toast("메모 고치기"),
            onRetryTalk: () => toast("다시 만들기"),
          }}
          onInvite={() => toast("가족 초대하기")}
          onCode={() => toast("받은 초대 코드 넣기")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  bar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: C.border },
  barRow: { gap: 6, padding: 8, alignItems: "center" },
});
