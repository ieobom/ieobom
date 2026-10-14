// 기록(39차 ArchiveScreen): 제목 'OO와의 기록' + '목록 | 달력' → (가족이 둘이면) 가족 고르기 → 종류 거르기 → 목록 또는 달력.
// 목록은 최근 것부터 달마다 묶고, 끝까지 내리면 이어 불러온다. 누르면 같은 상세 창이 뜬다.
import { useState, type ReactElement } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { seoulParts } from "@/lib/dates";
import { Avatar, Button, C, IcoCalendar, IcoList, R, Screen, T } from "@/ui";
import { FamilyPicker, type FamilyOption } from "@/features/home/home-header";
import { Calendar, type YM } from "./calendar";
import { RecordDetail, type DetailActions } from "./detail-sheets";
import { MonthHead, RecordLine, type ThumbUrl } from "./rows";
import type { CalendarData, Filter, RecordItem } from "./types";

export type ArchiveMode = "list" | "cal";

export type ArchiveProps = {
  state: "connected" | "left" | "none";
  partner: string;
  parent: boolean;
  families: FamilyOption[];
  familyId?: string;
  onFamily: (id: string) => void;
  filter: Filter;
  onFilter: (f: Filter) => void;
  mode: ArchiveMode;
  onMode: (m: ArchiveMode) => void;
  items: RecordItem[];
  onMore?: () => void;
  calendar: {
    view: YM;
    today: { y: number; m: number; d: number };
    data?: CalendarData;
    selected?: string;
    onSelect: (key: string) => void;
    onMove: (step: -1 | 1) => void;
    dayItems: RecordItem[];
  };
  thumbUrl?: ThumbUrl;
  actions: DetailActions & { onOpenNews?: (item: RecordItem) => void };
  onInvite: () => void;
  onCode: () => void;
};

const FILTERS: Filter[] = ["all", "memo", "question", "news"];

type Row = { key: string; el: ReactElement };

export function ArchiveScreen(p: ArchiveProps) {
  const a = ko.archive;
  const [open, setOpen] = useState<RecordItem | null>(null);
  const openItem = (item: RecordItem) => {
    setOpen(item);
    if (item.kind === "news" && !item.mine) p.actions.onOpenNews?.(item);
  };

  const seg = (
    <View style={styles.seg} accessibilityRole="tablist" accessibilityLabel={a.viewLabel}>
      {(["list", "cal"] as const).map((k) => {
        const on = p.mode === k;
        const color = on ? C.text : C.textSub;
        return (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => p.onMode(k)}
            style={[styles.segItem, on && styles.segOn]}
          >
            {k === "list" ? <IcoList color={color} /> : <IcoCalendar color={color} size={15} />}
            <T size={15} weight={on ? 700 : 600} color={color}>
              {k === "list" ? a.list : a.calendar}
            </T>
          </Pressable>
        );
      })}
    </View>
  );

  const chips = (
    <View style={[styles.chips, p.mode === "cal" ? styles.mb4 : styles.mb20]}>
      {FILTERS.map((f) => {
        const on = p.filter === f;
        return (
          <Pressable
            key={f}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => p.onFilter(f)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <T size={15} weight={600} color={on ? C.white : C.textSub}>
              {a.filters[f]}
            </T>
          </Pressable>
        );
      })}
    </View>
  );

  // 목록: 달이 바뀔 때 달 머리말
  const rows: Row[] = [];
  const source = p.mode === "list" ? p.items : p.calendar.dayItems;
  let lastMonth = "";
  source.forEach((item, i) => {
    if (p.mode === "list") {
      const month = a.month(seoulParts(item.at).month);
      if (month !== lastMonth)
        rows.push({ key: `m-${item.id}`, el: <MonthHead first={i === 0}>{month}</MonthHead> });
      lastMonth = month;
    }
    rows.push({
      key: item.id,
      el: (
        <RecordLine
          item={item}
          partner={p.partner}
          parent={p.parent}
          thumbUrl={p.thumbUrl}
          onPress={() => openItem(item)}
        />
      ),
    });
  });

  const header = (
    <>
      {p.state === "left" ? (
        <View style={styles.leftBox}>
          <T size={15} weight={700} lh={1.5}>
            {a.left1(p.partner)}
          </T>
          <T size={14} lh={1.6} color={C.textSub} style={styles.mt4}>
            {a.left2}
          </T>
        </View>
      ) : null}
      {chips}
      {p.mode === "cal" && p.state === "connected" ? (
        <>
          <Calendar
            view={p.calendar.view}
            today={p.calendar.today}
            data={p.calendar.data}
            filter={p.filter}
            selected={p.calendar.selected}
            onSelect={p.calendar.onSelect}
            onMove={p.calendar.onMove}
          />
          {p.calendar.selected ? (
            <T size={17} weight={800} ls={-0.03} style={styles.dayTitle}>
              {ko.time.dateDay(seoulParts(p.calendar.selected)) +
                (p.calendar.selected === dayKeyOf(p.calendar.today) ? a.today : "")}
            </T>
          ) : null}
        </>
      ) : null}
    </>
  );

  const empty =
    p.mode === "cal" ? (
      p.calendar.selected ? (
        <T size={15} lh={1.6} color={C.textTertiary} style={styles.dayEmpty}>
          {p.calendar.selected === dayKeyOf(p.calendar.today) ? a.todayEmpty : a.dayEmpty}
        </T>
      ) : null
    ) : (
      <View style={styles.empty}>
        <T size={17} weight={600} color={C.textSub} align="center" style={styles.mb8}>
          {a.empty1}
        </T>
        <T size={15} lh={1.65} color={C.textTertiary} align="center">
          {a.empty2}
        </T>
      </View>
    );

  return (
    <Screen>
      <View style={styles.titleRow}>
        <T size={22} weight={800} ls={-0.04} style={styles.flex} accessibilityRole="header">
          {p.state === "none" ? a.plain : a.title(p.partner)}
        </T>
        {p.state === "connected" ? seg : null}
      </View>
      {p.state === "connected" && !p.parent && p.families.length > 1 && p.familyId ? (
        <View style={styles.picker}>
          <FamilyPicker
            value={p.families.find((f) => f.id === p.familyId) ?? p.families[0]!}
            options={p.families}
            onChange={p.onFamily}
          />
        </View>
      ) : null}
      {p.state === "none" ? (
        <View style={styles.noFamily}>
          <View style={styles.center}>
            <Avatar size={56} bg={C.plainBg} color={C.textTertiary} />
          </View>
          <T size={18} weight={700} align="center" style={styles.mb8}>
            {a.noFamily1}
          </T>
          <T size={15} lh={1.65} color={C.textSub} align="center" style={styles.mb24}>
            {a.noFamily2}
          </T>
          <Button onPress={p.onInvite}>{ko.home.solo.invite}</Button>
          <Button variant="ghost" onPress={p.onCode}>
            {ko.home.solo.code}
          </Button>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          renderItem={({ item }) => item.el}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          ListFooterComponent={<View style={{ height: p.mode === "cal" ? 32 : 48 }} />}
          onEndReached={p.mode === "list" ? p.onMore : undefined}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.list}
        />
      )}
      <RecordDetail
        key={open?.id}
        item={open}
        partner={p.partner}
        parent={p.parent}
        thumbUrl={p.thumbUrl}
        actions={p.actions}
        onClose={() => setOpen(null)}
      />
    </Screen>
  );
}

function dayKeyOf(t: { y: number; m: number; d: number }) {
  return `${t.y}-${String(t.m).padStart(2, "0")}-${String(t.d).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  seg: { flexDirection: "row", padding: 3, borderRadius: 12, backgroundColor: C.plainBg },
  segItem: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  segOn: { backgroundColor: C.white, boxShadow: "0 1px 3px rgba(64,44,24,0.14)" },
  picker: { paddingHorizontal: 24, paddingBottom: 14 },
  list: { paddingHorizontal: 20 },
  chips: { flexDirection: "row", gap: 6, paddingLeft: 4 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: R.chip,
    backgroundColor: C.plainBg,
    justifyContent: "center",
  },
  chipOn: { backgroundColor: C.text },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb20: { marginBottom: 20 },
  mb24: { marginBottom: 24 },
  mt4: { marginTop: 4 },
  leftBox: {
    backgroundColor: C.well,
    borderRadius: R.sm,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dayTitle: { marginTop: 22, marginHorizontal: 4, marginBottom: 12 },
  dayEmpty: { paddingHorizontal: 4, paddingBottom: 12 },
  empty: { paddingVertical: 48, paddingHorizontal: 24 },
  noFamily: { paddingTop: 56, paddingHorizontal: 36, paddingBottom: 24 },
  center: { alignItems: "center", marginBottom: 18 },
});
