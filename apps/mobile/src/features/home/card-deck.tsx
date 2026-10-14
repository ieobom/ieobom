// 홈 카드 줄(39차): 좌우로 넘기고 아래 점으로 몇 번째인지 보여 준다. 부모님은 이전 · 다음 화살표 단추도 있다.
// 카드마다 높이가 달라서 줄 높이는 지금 보이는 카드에 맞춘다.
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { ko } from "@/copy/ko";
import { C, IcoArrow } from "@/ui";

export type DeckCard = { key: string; node: ReactNode };

const GAP = 10;
const PEEK = 18;

export function CardDeck({
  cards,
  parent,
  startKey,
}: {
  cards: DeckCard[];
  parent: boolean;
  startKey?: string;
}) {
  const ref = useRef<ScrollView>(null);
  // 처음에는 화면 폭에서 좌우 여백(20씩)을 뺀 값으로 시작하고, 실제 폭을 재면 바꾼다
  const [width, setWidth] = useState(() => Math.max(0, Dimensions.get("window").width - 40));
  const n = cards.length;
  // 알림을 누르고 들어오면 그 카드부터(39차)
  const [picked, setIdx] = useState(() =>
    Math.max(0, startKey ? cards.findIndex((c) => c.key === startKey) : 0),
  );
  const idx = Math.min(picked, Math.max(0, n - 1)); // 카드가 빠지면 마지막 카드로
  const [heights, setHeights] = useState<Record<string, number>>({});
  const one = n < 2;
  const cardW = one ? width : width - PEEK;
  const step = cardW + GAP;

  // 폭을 알게 되면 고른 카드 자리로 옮긴다(화면 상태는 바꾸지 않음)
  useEffect(() => {
    if (step > 0 && idx > 0) ref.current?.scrollTo({ x: idx * step, animated: false });
    // 폭이 정해질 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const goTo = (i: number) => {
    ref.current?.scrollTo({ x: i * step, animated: true });
    setIdx(i);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (one || step <= 0) return;
    const i = Math.max(0, Math.min(n - 1, Math.round(e.nativeEvent.contentOffset.x / step)));
    if (i !== idx) setIdx(i);
  };
  const current = cards[Math.min(idx, n - 1)];
  const h = current ? heights[current.key] : undefined;

  const arrow = (dir: -1 | 1) => {
    const off = dir < 0 ? idx === 0 : idx === n - 1;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dir < 0 ? ko.home.prev : ko.home.next}
        accessibilityState={{ disabled: off }}
        disabled={off}
        onPress={() => goTo(idx + dir)}
        style={[styles.arrow, off && styles.arrowOff]}
      >
        <IcoArrow dir={dir} />
      </Pressable>
    );
  };

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <ScrollView
          ref={ref}
          horizontal
          scrollEnabled={!one}
          showsHorizontalScrollIndicator={false}
          snapToInterval={step}
          decelerationRate="fast"
          disableIntervalMomentum
          onScroll={onScroll}
          scrollEventThrottle={32}
          style={[styles.scroll, h ? { height: h + 22 } : null]}
          contentContainerStyle={styles.row}
          accessibilityLabel={ko.home.deck(n)}
        >
          {cards.map((c) => (
            <View
              key={c.key}
              style={{ width: cardW }}
              onLayout={(e) => {
                const v = Math.ceil(e.nativeEvent.layout.height);
                setHeights((old) => (old[c.key] === v ? old : { ...old, [c.key]: v }));
              }}
            >
              {c.node}
            </View>
          ))}
        </ScrollView>
      ) : null}
      {!one ? (
        <View style={[styles.nav, parent && styles.navParent]}>
          {parent ? arrow(-1) : null}
          <View style={styles.dots} accessibilityRole="tablist">
            {cards.map((c, i) => (
              <Pressable
                key={c.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: i === idx }}
                accessibilityLabel={ko.home.dot(n, i + 1)}
                onPress={() => goTo(i)}
                style={styles.dotHit}
              >
                <View style={[styles.dot, i === idx && styles.dotOn]} />
              </Pressable>
            ))}
          </View>
          {parent ? arrow(1) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -20, marginTop: -6, marginBottom: -12 },
  row: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16, gap: GAP, alignItems: "flex-start" },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 4 },
  navParent: { gap: 14 },
  dots: { flexDirection: "row", alignItems: "center" },
  dotHit: { width: 22, height: 28, alignItems: "center", justifyContent: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#DCD3C4" },
  dotOn: { width: 18, backgroundColor: C.primary },
  arrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowOff: { opacity: 0.35 },
});
