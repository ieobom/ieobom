// 질문 답하기(39차 QuestionAnswerScreen) · 질문 만들기(MakeQuestionScreen) · 근황 보내기(NewsEditorScreen).
// 질문 만들기와 근황 보내기는 위의 '질문 | 근황'으로 오간다(39차, 홈의 '질문 만들기 · 근황도 보내요' 네모가 입구).
// 말로 답하기 · 말로 남기기(7-4)와 사진 붙이기(9-1)는 그 부품이 생기면 이 화면에 들어온다.
import { guessTopic, NEWS_TOPICS } from "@ieobom/shared";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { BottomBar } from "@/features/my/parts";
import { seoulParts } from "@/lib/dates";
import {
  Button,
  C,
  Chip,
  Dialog,
  IcoCheck,
  IcoLock,
  IcoQuestion,
  R,
  Screen,
  ScreenHeader,
  T,
  Tag,
  TextField,
} from "@/ui";

const dateOf = (iso: string) => ko.time.date(seoulParts(iso));
const dayOf = (iso: string) => ko.time.weekday(seoulParts(iso));

/** 쓰는 화면의 작은 제목 (시안 16 · 굵게) */
function SmallTitle({ text }: { text: string }) {
  return (
    <T size={16} weight={700} ls={-0.02} accessibilityRole="header">
      {text}
    </T>
  );
}

/** 나가기 확인 창 (쓰던 것이 있을 때) */
function LeaveDialog({
  visible,
  title,
  body,
  onLeave,
  onStay,
}: {
  visible: boolean;
  title: string;
  body: string;
  onLeave: () => void;
  onStay: () => void;
}) {
  return (
    <Dialog
      visible={visible}
      title={title}
      body={body}
      confirmLabel={ko.common.leave}
      cancelLabel={ko.compose.keep}
      onConfirm={onLeave}
      onCancel={onStay}
    />
  );
}

// ── 질문 답하기 ──────────────────────────────

export function AnswerScreen({
  partner,
  parent,
  question,
  expired = false,
  sending = false,
  onBack,
  onSend,
  onHome,
  onPast,
}: {
  partner: string;
  parent: boolean;
  question: { text: string; source: "bank" | "custom" };
  /** 다음 질문이 와서 답할 수 없음 */
  expired?: boolean;
  sending?: boolean;
  onBack: () => void;
  onSend: (text: string) => void;
  onHome: () => void;
  onPast: () => void;
}) {
  const a = ko.answer;
  const [text, setText] = useState("");
  const [leave, setLeave] = useState(false);
  if (expired) {
    return (
      <Screen>
        <View style={styles.expired}>
          <View style={styles.expiredMark}>
            <IcoQuestion color={C.textTertiary} />
          </View>
          <T size={24} weight={800} ls={-0.04} lh={1.38} align="center" style={styles.h2}>
            {a.expiredTitle}
          </T>
          <T size={16} lh={1.7} color={C.textSub} align="center">
            {a.expiredBody}
          </T>
        </View>
        <BottomBar>
          <View style={styles.gap10}>
            <Button onPress={onHome}>{a.home}</Button>
            <Button variant="secondary" onPress={onPast}>
              {a.past}
            </Button>
          </View>
        </BottomBar>
      </Screen>
    );
  }
  return (
    <Screen>
      <ScreenHeader
        middle={<SmallTitle text={a.head} />}
        onBack={() => (text.trim() ? setLeave(true) : onBack())}
      />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.qBlock}>
          <View style={styles.tag}>
            <Tag>
              {question.source === "custom" ? ko.home.question.fromCustom : ko.home.question.fromBank}
            </Tag>
          </View>
          <T size={24} weight={800} ls={-0.04} lh={1.4}>
            {question.text}
          </T>
        </View>
        <TextField
          value={text}
          onChangeText={setText}
          label={a.label}
          placeholder={a.placeholder(parent)}
          lines={4}
          size={17}
          card
          autoFocus
        />
        <T size={13} lh={1.65} color={C.textTertiary} style={styles.note}>
          {a.note(partner)}
        </T>
      </ScrollView>
      <BottomBar>
        <Button disabled={!text.trim() || sending} onPress={() => onSend(text.trim())}>
          {a.send}
        </Button>
      </BottomBar>
      <LeaveDialog
        visible={leave}
        title={a.leaveTitle}
        body={a.leaveBody}
        onLeave={() => {
          setLeave(false);
          onBack();
        }}
        onStay={() => setLeave(false)}
      />
    </Screen>
  );
}

// ── 질문 | 근황 ──────────────────────────────

export type ComposeKind = "q" | "news";

export function ComposeTabs({ kind, onKind }: { kind: ComposeKind; onKind: (k: ComposeKind) => void }) {
  const c = ko.compose;
  return (
    <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel={c.tabsLabel}>
      {(["q", "news"] as const).map((k) => {
        const on = kind === k;
        return (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onKind(k)}
            style={[styles.tab, on && styles.tabOn]}
          >
            <T size={16} weight={on ? 700 : 600} ls={-0.02} color={on ? C.text : C.textSub}>
              {c.tabs[k]}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 머리: 뒤로 + ('질문 | 근황' 또는 제목) + (고칠 때) 지우기 */
function ComposeHead({
  title,
  tabs,
  onBack,
  onRemove,
}: {
  title: string;
  tabs?: ReactNode;
  onBack: () => void;
  onRemove?: () => void;
}) {
  return (
    <ScreenHeader
      onBack={onBack}
      middle={tabs ?? <SmallTitle text={title} />}
      right={
        onRemove ? (
          <Pressable accessibilityRole="button" onPress={onRemove} style={styles.remove}>
            <T size={15} weight={600} color={C.danger}>
              {ko.compose.remove}
            </T>
          </Pressable>
        ) : undefined
      }
    />
  );
}

// ── 질문 만들기 ──────────────────────────────

export function MakeQuestionScreen({
  partner,
  toChild,
  mine,
  slot,
  partnerOn,
  tabs,
  onBack,
  onSend,
  onDelete,
}: {
  partner: string;
  /** 부모님이 자녀에게 보낼 때(반말 예시) */
  toChild: boolean;
  /** 이미 만들어 둔 내 질문(고치기) */
  mine?: { text: string; send_on: string } | null;
  /** 지금 만들면 갈 날 */
  slot?: string;
  /** 상대가 만들어 둔 질문이 가는 날 */
  partnerOn?: string | null;
  tabs?: ReactNode;
  onBack: () => void;
  onSend: (text: string) => void;
  onDelete: () => void;
}) {
  const c = ko.compose;
  const editing = !!mine;
  const [q, setQ] = useState(mine?.text ?? "");
  const [leave, setLeave] = useState(false);
  const [askDel, setAskDel] = useState(false);
  const on = mine?.send_on ?? slot;
  const changed = !!q.trim() && q.trim() !== (mine?.text ?? "");
  // 내 질문 뒤에 상대 질문이 기다리면, 지울 때 그 질문이 내 차례로 당겨진다
  const partnerAfter = !!mine && !!partnerOn && partnerOn > mine.send_on;
  const examples = toChild ? c.examples.toChild : c.examples.toParent;

  return (
    <Screen>
      <ComposeHead
        title={c.makeTitle}
        tabs={editing ? undefined : tabs}
        onBack={() => (changed ? setLeave(true) : onBack())}
        onRemove={editing ? () => setAskDel(true) : undefined}
      />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <T size={26} weight={800} ls={-0.04} lh={1.3} style={styles.h2}>
          {editing && on ? c.editingTitle(dateOf(on)) : c.newTitle(partner)}
        </T>
        {!editing && partnerOn ? (
          <View style={styles.partnerFirst}>
            <T size={15} weight={700} lh={1.5}>
              {c.partnerFirst(partner, dateOf(partnerOn))}
            </T>
          </View>
        ) : null}
        {!editing && on ? (
          <T size={16} lh={1.6} color={C.textSub} style={styles.together}>
            <T size={16} weight={700}>
              {c.togetherOn(dateOf(on), dayOf(on))}
            </T>
            {c.together}
          </T>
        ) : null}
        <View style={[styles.lockRow, editing && styles.lockEditing]}>
          <IcoLock />
          <T size={14} lh={1.5} color={C.textTertiary} style={styles.flex}>
            {c.locked(partner)}
          </T>
        </View>
        <TextField
          value={q}
          onChangeText={setQ}
          label={c.qLabel}
          placeholder={c.qPlaceholder(toChild)}
          lines={3}
          size={17}
          card
        />
        {!editing ? (
          <>
            <T size={14} weight={700} color={C.textSub} style={styles.examplesHead}>
              {c.examplesHead}
            </T>
            <View style={styles.examples}>
              {examples.map((x) => {
                const picked = q === x;
                return (
                  <Pressable
                    key={x}
                    accessibilityRole="button"
                    accessibilityState={{ selected: picked }}
                    onPress={() => setQ(x)}
                    style={[
                      styles.example,
                      {
                        borderColor: picked ? C.primary : C.border,
                        backgroundColor: picked ? C.primaryLight : C.bg,
                      },
                    ]}
                  >
                    <T size={16} lh={1.45} style={styles.flex}>
                      {x}
                    </T>
                    {picked ? <IcoCheck /> : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
      <BottomBar>
        <Button disabled={!changed} onPress={() => onSend(q.trim())}>
          {editing ? c.resendQ : c.sendQ}
        </Button>
      </BottomBar>
      <LeaveDialog
        visible={leave}
        title={c.leaveQTitle}
        body={c.leaveQBody}
        onLeave={() => {
          setLeave(false);
          onBack();
        }}
        onStay={() => setLeave(false)}
      />
      <Dialog
        visible={askDel}
        title={c.delTitle}
        body={on ? (partnerAfter ? c.delPartner(dateOf(on), partner) : c.delAi(dateOf(on))) : ""}
        confirmLabel={c.remove}
        danger
        onConfirm={() => {
          setAskDel(false);
          onDelete();
        }}
        onCancel={() => setAskDel(false)}
      />
    </Screen>
  );
}

// ── 근황 보내기 ──────────────────────────────

export type NewsDraft = { text: string; topic: string | null; topicBy: "chip" | "custom" | "rule" | null };

export function NewsEditorScreen({
  partner,
  parent,
  tabs,
  sending = false,
  onBack,
  onSend,
  onAddPhoto,
}: {
  partner: string;
  parent: boolean;
  tabs?: ReactNode;
  sending?: boolean;
  onBack: () => void;
  onSend: (d: NewsDraft) => void;
  /** 사진 고르기(9-1) */
  /** 사진 고르기(9-1). 없으면 사진 칸을 숨긴다 */
  onAddPhoto?: () => void;
}) {
  const c = ko.compose;
  const [text, setText] = useState("");
  // null: 아직 안 고름(글에서 낱말 규칙으로 고른 칩을 켜 둠) · "": 켜진 칩을 끔 · 그 밖: 고른 칩
  const [topic, setTopic] = useState<string | null>(null);
  const [own, setOwn] = useState(false);
  const [ownText, setOwnText] = useState("");
  const [leave, setLeave] = useState(false);
  const auto = guessTopic(text);
  const chosen = own ? ownText.trim() || null : topic === null ? auto : topic || null;
  const topicBy = !chosen ? null : own ? "custom" : topic === null ? "rule" : "chip";
  const has = !!text.trim();

  return (
    <Screen>
      <ComposeHead title={c.newsTitle} tabs={tabs} onBack={() => (has ? setLeave(true) : onBack())} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <T size={23} weight={800} ls={-0.04} lh={1.38} style={styles.newsHead}>
          {`${c.newsHead1(partner)}\n${c.newsHead2(parent)}`}
        </T>
        <TextField
          value={text}
          onChangeText={setText}
          label={c.newsLabel}
          placeholder={c.newsPlaceholder(parent)}
          lines={2}
          size={17}
          card
        />
        {onAddPhoto ? (
          <>
            <T size={15} weight={700} style={styles.sec}>
              {c.photos}
              <T size={13} weight={500} color={C.textTertiary}>
                {c.photosNote}
              </T>
            </T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={c.addPhoto}
              onPress={onAddPhoto}
              style={styles.addPhoto}
            >
              <T size={28} color={C.textSub}>
                +
              </T>
            </Pressable>
          </>
        ) : null}
        <T size={15} weight={700} style={styles.sec}>
          {c.topicHead}
          <T size={15} weight={500} color={C.textTertiary}>
            {c.optional}
          </T>
        </T>
        <View style={styles.chips}>
          {NEWS_TOPICS.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={!own && chosen === t}
              onPress={() => {
                setOwn(false);
                setTopic(!own && chosen === t ? "" : t);
              }}
            />
          ))}
          <Chip label={c.own} selected={own} onPress={() => setOwn(!own)} />
        </View>
        {own ? (
          <View style={styles.ownField}>
            <TextField
              value={ownText}
              onChangeText={(v) => setOwnText(v.slice(0, 12))}
              label={c.ownLabel}
              placeholder={c.ownPlaceholder}
              maxLength={12}
              size={16}
              autoFocus
            />
          </View>
        ) : null}
      </ScrollView>
      <BottomBar>
        <Button
          disabled={!has || sending}
          onPress={() => onSend({ text: text.trim(), topic: chosen, topicBy })}
        >
          {c.sendNews(partner)}
        </Button>
      </BottomBar>
      <LeaveDialog
        visible={leave}
        title={c.leaveNewsTitle}
        body={c.leaveNewsBody}
        onLeave={() => {
          setLeave(false);
          onBack();
        }}
        onStay={() => setLeave(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  gap10: { gap: 10 },
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  h2: { marginBottom: 8 },
  qBlock: { marginBottom: 22 },
  tag: { marginBottom: 10 },
  note: { paddingHorizontal: 2, marginTop: 4 },
  expired: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  expiredMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.plainBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  tabs: {
    flex: 1,
    maxWidth: 240,
    flexDirection: "row",
    padding: 3,
    borderRadius: 12,
    backgroundColor: C.plainBg,
  },
  tab: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: C.white, boxShadow: "0 1px 3px rgba(64,44,24,0.14)" },
  remove: { minHeight: 44, justifyContent: "center", paddingLeft: 20, marginVertical: -4 },
  partnerFirst: {
    backgroundColor: C.well,
    borderRadius: R.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 14,
  },
  together: { marginBottom: 6 },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 18 },
  lockEditing: { marginTop: 8 },
  examplesHead: { marginTop: 20, marginBottom: 10 },
  examples: { gap: 8, marginBottom: 24 },
  example: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: R.btn,
    borderWidth: 1.5,
  },
  newsHead: { marginBottom: 14 },
  sec: { marginTop: 18, marginBottom: 10 },
  addPhoto: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: C.border,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ownField: { marginTop: 10, marginBottom: 8 },
});
