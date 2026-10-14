// 기록 줄(39차 entryRow · newsRow): 왼쪽 표시, 종류 · 날짜(근황은 누가), 그 아래 글과 사진.
import { Image, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { seoulParts } from "@/lib/dates";
import { C, RecordRow, T } from "@/ui";
import type { RecordItem } from "./types";

export type ThumbUrl = (path: string) => string | undefined;

export function PhotoRow({ paths, size, thumbUrl }: { paths: string[]; size: number; thumbUrl?: ThumbUrl }) {
  if (paths.length === 0) return null;
  return (
    <View style={styles.photos}>
      {paths.map((p) => {
        const uri = thumbUrl?.(p);
        const box = { width: size, height: size, borderRadius: 10 };
        return uri ? (
          <Image key={p} source={{ uri }} style={box} />
        ) : (
          <View key={p} style={[box, styles.empty]} />
        );
      })}
    </View>
  );
}

export function RecordLine({
  item,
  partner,
  parent,
  thumbUrl,
  onPress,
}: {
  item: RecordItem;
  partner: string;
  parent: boolean;
  thumbUrl?: ThumbUrl;
  onPress: () => void;
}) {
  const date = ko.time.date(seoulParts(item.at));
  const a = ko.archive;
  if (item.kind === "memo") {
    const meta = [date, item.mood ? ko.mood[item.mood] : "", item.talk?.asked_on ? a.asked(parent) : ""]
      .filter(Boolean)
      .join(" · ");
    return (
      <RecordRow
        kind="memo"
        meta={meta}
        text={item.text || a.moodOnly}
        muted={!item.text}
        onPress={onPress}
        label={a.rowLabel(date, ko.kind.memo)}
      />
    );
  }
  if (item.kind === "question") {
    const suffix =
      item.status === "mine_only"
        ? a.mineOnly
        : item.status === "sent_first"
          ? a.sentFirst
          : item.status === "their_first"
            ? a.theirFirst
            : "";
    return (
      <RecordRow
        kind="question"
        meta={suffix ? `${date} · ${suffix}` : date}
        text={item.text}
        onPress={onPress}
        label={a.rowLabel(date, ko.kind.question)}
      />
    );
  }
  return (
    <RecordRow
      kind="news"
      meta={`${item.mine ? a.me : partner} · ${date}`}
      text={item.text}
      below={
        item.photos.length > 0 ? (
          <PhotoRow paths={item.photos.map((p) => p.thumb)} size={56} thumbUrl={thumbUrl} />
        ) : undefined
      }
      onPress={onPress}
      label={a.rowLabel(date, ko.kind.news)}
    />
  );
}

export function MonthHead({ first, children }: { first: boolean; children: string }) {
  return (
    <T size={14} weight={700} color={C.textSub} style={[styles.month, !first && styles.monthGap]}>
      {children}
    </T>
  );
}

const styles = StyleSheet.create({
  photos: { flexDirection: "row", gap: 8 },
  empty: { backgroundColor: C.border },
  month: { marginHorizontal: 4, marginBottom: 10 },
  monthGap: { marginTop: 14 },
});
