// 홈 카드 6종(39차): 못 받은 전화 · 지금 편한 시간 · 질문 · 새 근황 · 통화 메모 초안 · 이어진 가족이 없을 때.
// 시안의 MissedCard · TimingCard · QuestionCard · NewsCard · DraftCard · SoloCard를 옮겼다.
import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { minutesAgo, seoulParts } from "@/lib/dates";
import {
  Avatar,
  Button,
  C,
  CARD,
  CardHead,
  IcoBook,
  IcoChevronRight,
  IcoHeart,
  IcoLock,
  IcoMic,
  IcoPhone,
  R,
  T,
  Tag,
} from "@/ui";
import type { HomeCard, NewsItem, Talk } from "./types";

type Of<K extends HomeCard["kind"]> = Extract<HomeCard, { kind: K }>;

function Box({ children, ring, label }: { children: ReactNode; ring?: boolean; label: string }) {
  return (
    <View accessibilityLabel={label} style={[CARD, styles.box, ring && styles.ring]}>
      {children}
    </View>
  );
}

function Foot({ children }: { children: ReactNode }) {
  return <View style={styles.foot}>{children}</View>;
}

function BigTitle({
  children,
  color = C.text,
  size = 22,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
}) {
  return (
    <T size={size} weight={800} ls={-0.04} lh={1.38} color={color} accessibilityRole="header">
      {children}
    </T>
  );
}

function QTitle({ children }: { children: ReactNode }) {
  return (
    <T size={19} weight={800} ls={-0.04} lh={1.42} style={styles.qTitle} accessibilityRole="header">
      {children}
    </T>
  );
}

function Sub({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <T size={15} lh={1.6} ls={-0.01} color={C.textSub} style={style}>
      {children}
    </T>
  );
}

export function OnlyMe() {
  return (
    <View style={styles.onlyMe}>
      <IcoLock />
      <T size={13} color={C.textTertiary}>
        {ko.home.onlyMe}
      </T>
    </View>
  );
}

function AnswerWell({
  who,
  text,
  tone,
  clamp,
}: {
  who: string;
  text: string;
  tone: "me" | "family";
  clamp?: number;
}) {
  return (
    <View style={styles.well}>
      <T size={13} weight={600} color={tone === "me" ? C.primary : C.accent2Deep} style={styles.wellWho}>
        {who}
      </T>
      <T size={16} lh={1.65} numberOfLines={clamp}>
        {text}
      </T>
    </View>
  );
}

// ── 못 받은 전화 ──
export function MissedCard({
  card,
  partner,
  onCall,
  onOk,
}: {
  card: Of<"missed_call">;
  partner: string;
  onCall: () => void;
  onOk: () => void;
}) {
  const ago = minutesAgo(card.at) < 60 ? ko.time.justNow : ko.time.hour(seoulParts(card.at).hour);
  return (
    <Box label={ko.home.missed.head}>
      <CardHead
        label={ko.home.missed.head}
        tone="primary"
        right={
          <T size={13} color={C.textTertiary}>
            {ago}
          </T>
        }
      />
      <View style={styles.missedRow}>
        <View style={styles.missedIcon}>
          <IcoPhone color="#E8590C" size={22} />
        </View>
        <View style={styles.flex}>
          <BigTitle size={21}>{ko.home.missed.title(partner)}</BigTitle>
        </View>
      </View>
      <Foot>
        <Button onPress={onCall} icon={<IcoPhone color={C.white} size={19} />}>
          {ko.home.missed.call(partner)}
        </Button>
        <Button variant="ghost" onPress={onOk}>
          {ko.home.ok}
        </Button>
      </Foot>
    </Box>
  );
}

// ── 지금 둘 다 통화 편한 시간 ──
export function TimingCard({
  card,
  partner,
  parent,
  talk,
  onCall,
}: {
  card: Of<"free_now">;
  partner: string;
  parent: boolean;
  talk?: Talk;
  onCall: () => void;
}) {
  const range = ko.time.range(seoulParts(card.from).hour, seoulParts(card.until).hour);
  return (
    <Box label={ko.home.timing.head} ring>
      <CardHead label={ko.home.timing.head} tone="primary" />
      <BigTitle
        color={C.primaryDeep}
      >{`${ko.home.timing.title1(partner)}\n${ko.home.timing.title2}`}</BigTitle>
      <Sub style={styles.mt8}>{ko.home.timing.sub(range)}</Sub>
      {talk ? (
        <View style={[styles.well, styles.mt14]}>
          <View style={styles.talkHead}>
            <T size={13} weight={600} color={C.textSub}>
              {ko.home.timing.talkHead(parent)}
            </T>
            {talk.source === "memo" ? (
              <Tag tone="plain">{ko.home.timing.fromMemo}</Tag>
            ) : (
              <Tag>{ko.home.timing.ai}</Tag>
            )}
            <View style={styles.flex} />
            <OnlyMe />
          </View>
          <T size={16} weight={600} lh={1.5}>
            {talk.text}
          </T>
        </View>
      ) : null}
      <Foot>
        <Button onPress={onCall} icon={<IcoPhone color={C.white} size={19} />}>
          {ko.home.timing.call(partner)}
        </Button>
      </Foot>
    </Box>
  );
}

// ── 질문 ──
export type QuestionActions = {
  onAnswer: (voice: boolean) => void;
  onChoose: (choice: "send" | "keep") => void;
  onSeen: () => void;
  onPast: () => void;
};

function PastLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.pastLink}>
      <T size={15} weight={600} color={C.textSub}>
        {ko.home.question.past}
      </T>
      <IcoChevronRight color={C.textTertiary} />
    </Pressable>
  );
}

function AnswerButtons({ parent, onAnswer }: { parent: boolean; onAnswer: (voice: boolean) => void }) {
  if (!parent) return <Button onPress={() => onAnswer(false)}>{ko.home.question.answer}</Button>;
  // 부모님은 말로 답하기가 먼저(39차)
  return (
    <View style={styles.gap10}>
      <Button onPress={() => onAnswer(true)} icon={<IcoMic color={C.white} />}>
        {ko.home.question.voice}
      </Button>
      <Button variant="secondary" onPress={() => onAnswer(false)}>
        {ko.home.question.text}
      </Button>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <T size={20} weight={800} ls={-0.03} lh={1.2}>
        {value}
      </T>
      <T size={12} color={C.textTertiary} style={styles.statLabel}>
        {label}
      </T>
    </View>
  );
}

export function QuestionCard({
  card,
  partner,
  parent,
  family,
  actions,
}: {
  card: Of<"question">;
  partner: string;
  parent: boolean;
  family: {
    next_question_on: string;
    my_custom_question: { send_on: string } | null;
    partner_custom_question_on: string | null;
    answered_together: number;
    memo_count: number;
    days_together: number;
  };
  actions: QuestionActions;
}) {
  const q = ko.home.question;
  const s = card.state;
  const label = s === "next" ? q.next : s === "ask_early" || s === "received" ? q.last : q.today;
  const right =
    s === "new" ? (
      <Tag>{card.source === "custom" ? q.fromCustom : q.fromBank}</Tag>
    ) : s === "ask_early" ? (
      <T size={13} color={C.textTertiary}>
        {q.threeDays}
      </T>
    ) : s === "opened" ? (
      <Tag tone="family">{q.opened}</Tag>
    ) : s === "received" || s === "partner_sent_first" ? (
      <Tag tone="family">{q.received}</Tag>
    ) : null;

  let body: ReactNode;
  if (s === "new") {
    body = (
      <>
        <BigTitle>{card.text}</BigTitle>
        <Sub style={styles.newSub}>{q.openHint}</Sub>
        <AnswerButtons parent={parent} onAnswer={actions.onAnswer} />
        <PastLink onPress={actions.onPast} />
      </>
    );
  } else if (s === "partner_sent_first") {
    body = (
      <>
        <QTitle>{card.text}</QTitle>
        <AnswerWell who={partner} text={card.partner_answer ?? ""} tone="family" />
        <Sub style={styles.mid}>{`${q.received1(partner)}\n${q.partnerFirst2}`}</Sub>
        <AnswerButtons parent={parent} onAnswer={actions.onAnswer} />
        <PastLink onPress={actions.onPast} />
      </>
    );
  } else if (s === "waiting") {
    body = (
      <>
        <QTitle>{card.text}</QTitle>
        <AnswerWell who={q.mine} text={card.my_answer ?? ""} tone="me" />
        <View style={styles.lockLine}>
          <View style={styles.lockIcon}>
            <IcoLock />
          </View>
          <T size={15} lh={1.6} color={C.textSub} style={styles.flex}>
            {q.waitingLine(partner)}
          </T>
        </View>
        <PastLink onPress={actions.onPast} />
      </>
    );
  } else if (s === "ask_early") {
    body = (
      <>
        <QTitle>{card.text}</QTitle>
        <AnswerWell who={q.mine} text={card.my_answer ?? ""} tone="me" clamp={3} />
        <Sub style={styles.mid}>{`${q.askEarly1(partner)}\n${q.askEarly2}`}</Sub>
        <View style={styles.gap4}>
          <Button onPress={() => actions.onChoose("send")}>{q.sendFirst}</Button>
          <Button variant="ghost" onPress={() => actions.onChoose("keep")}>
            {q.keepMine}
          </Button>
        </View>
        <PastLink onPress={actions.onPast} />
      </>
    );
  } else if (s === "received") {
    body = (
      <>
        <QTitle>{card.text}</QTitle>
        <AnswerWell who={partner} text={card.partner_answer ?? ""} tone="family" />
        <Sub style={styles.mid}>{`${q.received1(partner)}\n${q.received2}`}</Sub>
        <Button onPress={actions.onSeen}>{ko.home.ok}</Button>
        <PastLink onPress={actions.onPast} />
      </>
    );
  } else if (s === "opened") {
    body = (
      <>
        <QTitle>{card.text}</QTitle>
        <View style={[styles.gap10, styles.mb18]}>
          <AnswerWell who={partner} text={card.partner_answer ?? ""} tone="family" />
          <AnswerWell who={q.me} text={card.my_answer ?? ""} tone="me" />
        </View>
        <Button variant="secondary" onPress={actions.onSeen}>
          {ko.home.ok}
        </Button>
        <PastLink onPress={actions.onPast} />
      </>
    );
  } else {
    // 다음 질문: 내가 만든 질문 · 상대가 만든 질문이 그 차례면 그렇게 알린다
    const next = card.next_on ?? family.next_question_on;
    const p = seoulParts(next);
    const date = ko.time.date(p);
    const line =
      family.partner_custom_question_on === next ? (
        <T size={19} weight={800} ls={-0.04} lh={1.45}>
          {q.theirsOn(date, partner)}
        </T>
      ) : family.my_custom_question?.send_on === next ? (
        <T size={19} weight={800} ls={-0.04} lh={1.45}>
          {q.mineOn1(date)}
          <T size={19} weight={800} ls={-0.04} color={C.primary}>
            {q.mineOn2}
          </T>
          {q.mineOn3}
        </T>
      ) : (
        <T size={19} weight={800} ls={-0.04} lh={1.45}>
          {q.nextOn(date, ko.time.weekday(p))}
        </T>
      );
    body = (
      <>
        <View style={styles.mb14}>{line}</View>
        <View style={styles.stats}>
          <Stat value={q.count(family.answered_together)} label={q.statAnswered} />
          <View style={styles.statLine} />
          <Stat value={q.count(family.memo_count)} label={q.statMemos} />
          <View style={styles.statLine} />
          <Stat value={q.days(family.days_together)} label={q.statDays} />
        </View>
        <Pressable accessibilityRole="button" onPress={actions.onPast} style={styles.pastBig}>
          <IcoBook />
          <T size={16} weight={700} ls={-0.02} color={C.primary} style={styles.flex}>
            {q.past}
          </T>
          <IcoChevronRight color={C.primary} />
        </Pressable>
      </>
    );
  }

  return (
    <Box label={q.today}>
      <CardHead label={label} tone="primary" right={right} />
      {body}
    </Box>
  );
}

// ── 새 근황 ──
export function NewsCard({
  card,
  partner,
  parent,
  thumbUrl,
  onOk,
}: {
  card: Of<"news">;
  partner: string;
  parent: boolean;
  /** 저장소 경로 → 보여 줄 주소(9-5). 없으면 사진 칸을 비운다 */
  thumbUrl?: (path: string) => string | undefined;
  onOk: () => void;
}) {
  const items = card.items.slice(0, 2);
  const first = items[0] as NewsItem | undefined;
  const right =
    card.items.length > 1
      ? ko.home.news.many(card.items.length)
      : first
        ? ko.time.dateDay(seoulParts(first.at))
        : "";
  return (
    <Box label={ko.home.news.head}>
      <CardHead
        label={ko.home.news.head}
        tone="primary"
        right={
          <T size={13} color={C.textTertiary}>
            {right}
          </T>
        }
      />
      <View style={styles.newsTitle}>
        <IcoHeart size={24} />
        <View style={styles.flex}>
          <BigTitle size={21}>{ko.home.news.title(partner)}</BigTitle>
        </View>
      </View>
      {items.map((x) => (
        <View key={x.id} style={[styles.well, styles.mb8]}>
          {x.text ? (
            <T size={16} lh={1.6}>
              {x.text}
            </T>
          ) : null}
          {x.thumbs.length > 0 && thumbUrl ? (
            <View style={styles.photos}>
              {x.thumbs.map((path) => {
                const uri = thumbUrl(path);
                return uri ? (
                  <Image key={path} source={{ uri }} style={styles.photo} />
                ) : (
                  <View key={path} style={styles.photo} />
                );
              })}
            </View>
          ) : null}
        </View>
      ))}
      {first?.talk ? (
        <View style={styles.talkLine}>
          <Tag>{ko.home.news.ai}</Tag>
          <T size={14} lh={1.55} color={C.textSub} style={styles.flex}>
            {ko.home.news.talk(parent, first.talk)}
          </T>
        </View>
      ) : null}
      <Foot>
        <Button variant="secondary" onPress={onOk}>
          {ko.home.ok}
        </Button>
      </Foot>
    </Box>
  );
}

// ── 통화 메모 초안 ──
export function DraftCard({
  card,
  partner,
  onOpen,
  onDelete,
}: {
  card: Of<"memo_draft">;
  partner: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const d = ko.home.draft;
  return (
    <Box label={d.head}>
      <CardHead label={d.head} tone="primary" right={<OnlyMe />} />
      <BigTitle size={21}>{d.title}</BigTitle>
      <Sub style={styles.draftSub}>{d.sub(ko.time.dateDay(seoulParts(card.at)), partner)}</Sub>
      <View style={styles.well}>
        <View style={styles.mb6}>
          <Tag>{d.tag}</Tag>
        </View>
        <T size={16} lh={1.6} numberOfLines={3}>
          {card.text}
        </T>
      </View>
      <T size={13} lh={1.5} color={C.textTertiary} style={styles.mt8}>
        {d.note}
      </T>
      <Foot>
        <Button onPress={onOpen}>{d.open}</Button>
        <Button variant="ghost" onPress={onDelete}>
          {d.remove}
        </Button>
      </Foot>
    </Box>
  );
}

// ── 이어진 가족이 없을 때 · 상대가 탈퇴했을 때 ──
export function SoloCard({
  leftName,
  onInvite,
  onCode,
}: {
  leftName?: string;
  onInvite: () => void;
  onCode: () => void;
}) {
  const s = ko.home.solo;
  return (
    <View style={[CARD, styles.solo]}>
      <View style={styles.soloAvatar}>
        <Avatar size={56} bg={C.plainBg} color={C.textTertiary} />
      </View>
      <T size={20} weight={700} ls={-0.03} lh={1.45} align="center" style={styles.mb8}>
        {leftName ? `${s.left1(leftName)}\n${s.left2}` : `${s.none1}\n${s.none2}`}
      </T>
      <T size={15} lh={1.65} color={C.textSub} align="center" style={styles.mb20}>
        {leftName ? s.leftSub : s.noneSub}
      </T>
      <Button onPress={onInvite}>{leftName ? s.reinvite : s.invite}</Button>
      <Button variant="ghost" onPress={onCode} style={styles.mt6}>
        {s.code}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  box: { paddingTop: 22, paddingHorizontal: 20, paddingBottom: 20 },
  ring: {
    boxShadow:
      "0 1px 3px rgba(64, 44, 24, 0.05), 0 6px 22px rgba(64, 44, 24, 0.08), inset 0 0 0 1.5px " +
      C.primarySoft,
  },
  foot: { paddingTop: 16, gap: 4 },
  qTitle: { marginBottom: 14 },
  onlyMe: { flexDirection: "row", alignItems: "center", gap: 4 },
  well: { backgroundColor: C.well, borderRadius: R.sm, paddingVertical: 14, paddingHorizontal: 16 },
  wellWho: { marginBottom: 6 },
  missedRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  missedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF1EA",
    alignItems: "center",
    justifyContent: "center",
  },
  talkHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  mt14: { marginTop: 14 },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mb14: { marginBottom: 14 },
  mb18: { marginBottom: 18 },
  mb20: { marginBottom: 20 },
  gap4: { gap: 4 },
  gap10: { gap: 10 },
  newSub: { marginTop: 10, marginBottom: 20 },
  mid: { marginTop: 16, marginBottom: 14 },
  lockLine: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 14 },
  lockIcon: { marginTop: 4 },
  pastLink: {
    minHeight: 48,
    marginTop: 16,
    marginBottom: -8,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.well,
    borderRadius: R.sm,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  stat: { flex: 1, alignItems: "center" },
  statLabel: { marginTop: 3 },
  statLine: { width: 1, height: 28, backgroundColor: C.border },
  pastBig: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: R.btn,
    backgroundColor: C.primaryLight,
  },
  newsTitle: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  photos: { flexDirection: "row", gap: 6, marginTop: 10 },
  photo: { width: 72, height: 72, borderRadius: 10, backgroundColor: C.border },
  talkLine: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 4 },
  draftSub: { marginTop: 4, marginBottom: 12 },
  solo: { paddingTop: 30, paddingHorizontal: 22, paddingBottom: 22, alignItems: "stretch" },
  soloAvatar: { alignItems: "center", marginBottom: 16 },
});
