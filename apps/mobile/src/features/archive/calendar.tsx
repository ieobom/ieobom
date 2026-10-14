// 기록 · 달력(39차 ContactCalendar): 그달 수 세 칸 → 요일 → 날짜 칸(메모 · 함께 답한 질문 표시, 근황은 날짜 뒤 하트).
// 이어진 달보다 앞으로, 이번 달보다 뒤로는 가지 않는다. 고른 날의 기록은 아래에 줄로 보인다.
import { Pressable, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { C, CARD, HeartBack, IcoArrow, KindBadge, MarkMemo, MarkQ, R, T } from "@/ui";
import type { CalendarData, Filter } from "./types";

export type YM = { y: number; m: number }; // m: 1~12

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export function Calendar({
  view,
  today,
  data,
  filter,
  selected,
  onSelect,
  onMove,
}: {
  view: YM;
  today: { y: number; m: number; d: number };
  data?: CalendarData;
  filter: Filter;
  selected?: string;
  onSelect: (key: string) => void;
  onMove: (step: -1 | 1) => void;
}) {
  const a = ko.archive;
  const show = (k: Filter) => filter === "all" || filter === k;
  const thisMonth = view.y === today.y && view.m === today.m;
  const since = data?.since ?? dayKey(view.y, view.m, 1);
  const [sy, sm] = since.split("-").map(Number) as [number, number];
  const canPrev = view.y > sy || (view.y === sy && view.m > sm);
  const first = new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const todayKey = dayKey(today.y, today.m, today.d);

  const nav = (dir: -1 | 1, on: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir < 0 ? a.prevMonth : a.nextMonth}
      disabled={!on}
      onPress={() => onMove(dir)}
      style={[styles.nav, !on && styles.off]}
    >
      <IcoArrow dir={dir} color={C.textSub} />
    </Pressable>
  );
  const stats: { kind: "memo" | "question" | "news"; label: string; value: string }[] = [
    { kind: "memo", label: a.statMemo, value: a.times(data?.counts.memo_days ?? 0) },
    { kind: "question", label: a.statQuestion, value: a.count(data?.counts.questions ?? 0) },
    { kind: "news", label: a.statNews, value: a.count(data?.counts.news ?? 0) },
  ];

  return (
    <View style={[CARD, styles.card]}>
      <View style={styles.head}>
        <T size={18} weight={800} ls={-0.03}>
          {a.yearMonth(view.y, view.m)}
        </T>
        <View style={styles.navs}>
          {nav(-1, canPrev)}
          {nav(1, !thisMonth)}
        </View>
      </View>
      <View style={styles.stats}>
        {stats.map((t) => (
          <View key={t.kind} style={[styles.stat, !show(t.kind) && styles.dim]}>
            <View style={styles.statTop}>
              <KindBadge kind={t.kind} size={24} />
              <T size={18} weight={800} ls={-0.03}>
                {t.value}
              </T>
            </View>
            <T size={12.5} weight={600} ls={-0.04} lh={1.3} color={C.textSub} style={styles.statLabel}>
              {t.label}
            </T>
          </View>
        ))}
      </View>
      <View style={styles.week}>
        {a.week.map((w, i) => (
          <T
            key={w}
            size={12}
            weight={600}
            align="center"
            color={i === 0 || i === 6 ? C.primary : C.textTertiary}
            style={styles.weekDay}
          >
            {w}
          </T>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={`b${i}`} style={styles.cell} />;
          const key = dayKey(view.y, view.m, d);
          const future = (thisMonth && d > today.d) || key < since;
          const kinds = future ? [] : (data?.days[key] ?? []);
          const memo = show("memo") && kinds.includes("memo");
          const q = show("question") && kinds.includes("question");
          const news = show("news") && kinds.includes("news");
          const isToday = key === todayKey;
          const isSel = key === selected;
          return (
            <Pressable
              key={key}
              disabled={future}
              onPress={() => onSelect(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSel, disabled: future }}
              accessibilityLabel={a.dayLabel(view.m, d, memo, q, news)}
              style={styles.cell}
            >
              <View style={styles.dayBox}>
                {news ? (
                  <View style={styles.heart}>
                    <HeartBack
                      fill={isSel ? (isToday ? C.primary : C.newsSoft) : C.newsFaint}
                      stroke={isToday && !isSel ? C.primary : undefined}
                    />
                  </View>
                ) : null}
                <View
                  style={[
                    styles.dayNum,
                    !news && isSel && { backgroundColor: isToday ? C.primary : C.disabledBg },
                    isToday && !isSel && !news && styles.todayRing,
                    future && styles.half,
                  ]}
                >
                  <T
                    size={14}
                    weight={isSel || isToday ? 700 : 500}
                    color={
                      isSel && isToday
                        ? C.white
                        : isToday
                          ? C.primary
                          : future
                            ? C.textTertiary
                            : news
                              ? C.newsDeep
                              : C.text
                    }
                  >
                    {String(d)}
                  </T>
                </View>
              </View>
              <View style={styles.marks}>
                {memo ? <MarkMemo size={13} /> : null}
                {q ? <MarkQ size={13} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingTop: 18, paddingHorizontal: 16, paddingBottom: 14, marginTop: 8 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  navs: { flexDirection: "row", alignItems: "center", gap: 2 },
  nav: {
    width: 44,
    height: 44,
    margin: -6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  off: { opacity: 0.35 },
  stats: { flexDirection: "row", gap: 6, marginBottom: 16 },
  stat: {
    flex: 1,
    minWidth: 0,
    backgroundColor: C.well,
    borderRadius: R.sm,
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 9,
  },
  dim: { opacity: 0.35 },
  statTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  statLabel: { marginTop: 5 },
  week: { flexDirection: "row", marginBottom: 4 },
  weekDay: { width: `${100 / 7}%` },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 2 },
  cell: { width: `${100 / 7}%`, height: 50, alignItems: "center", gap: 2 },
  dayBox: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  heart: { position: "absolute", left: -3, top: -4 },
  dayNum: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  todayRing: { borderWidth: 1.5, borderColor: C.primary },
  half: { opacity: 0.5 },
  marks: { flexDirection: "row", gap: 3, height: 13, alignItems: "center", justifyContent: "center" },
});
