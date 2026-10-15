// 통화 후 메모(39차 MemoEditorScreen 'after') · 메모 고치기('edit') · 저장 뒤 '기록에 남겼어요'.
// 통화 후 메모: 기분 → 여쭤본 이야기 표시 → 통화 메모(초안이 있으면 고쳐서, 없으면 직접). 39차 3회부터 글로만 쓴다.
// 초안은 저장하지 않고 나가도 지우지 않는다(홈 카드로 3일 남음). 저장 뒤 '다음 통화 때 여쭤볼 이야기' 후보(7-9, AI)는 그 함수가 생기면 붙인다.
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { OnlyMe } from "@/features/home/cards";
import { BottomBar } from "@/features/my/parts";
import { seoulParts } from "@/lib/dates";
import {
  Button,
  C,
  Dialog,
  IcoCheck,
  IcoCheckRound,
  IcoTick,
  R,
  Screen,
  ScreenHeader,
  T,
  Tag,
  TextField,
} from "@/ui";

export type Mood = "good" | "okay" | "hard";
export type DraftStatus =
  "making" | "ready" | "saved" | "discarded" | "off_self" | "off_partner" | "too_short" | "failed";
export type TalkItem = { id: string | null; source: string; text: string };

const MOODS: Mood[] = ["good", "okay", "hard"];

function MoodPick({ mood, onMood }: { mood: Mood | null; onMood: (m: Mood | null) => void }) {
  return (
    <View style={styles.moods} accessibilityRole="radiogroup">
      {MOODS.map((m) => {
        const on = mood === m;
        return (
          <Pressable
            key={m}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onMood(on ? null : m)}
            style={[
              styles.mood,
              { borderColor: on ? C.primary : C.border, backgroundColor: on ? C.primaryLight : C.white },
            ]}
          >
            <T size={16} weight={on ? 700 : 500} color={on ? C.primary : C.text}>
              {ko.mood[m]}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 초안 상태 → 메모 칸 아래 한 줄 */
function noteOf(status: DraftStatus | "none", partner: string): string {
  const n = ko.memo.notes;
  return status === "ready"
    ? n.draft
    : status === "too_short"
      ? n.short
      : status === "off_self"
        ? n.off
        : status === "off_partner"
          ? n.partnerOff(partner)
          : status === "failed"
            ? n.fail
            : "";
}

type Saved = { mood: Mood | null; text: string };

export function AfterCallMemoScreen({
  partner,
  parent,
  draft,
  talks,
  saving = false,
  onToggleAsk,
  onSave,
  onKeep,
  onSkip,
  onDone,
}: {
  partner: string;
  parent: boolean;
  /** 이 통화의 내 초안. 없으면 none(내가 꺼 두었으면 off_self로 넘긴다) */
  draft: { status: DraftStatus | "none"; text: string | null };
  /** 이번 통화 때 여쭤볼 이야기(통화 전 목록) */
  talks: TalkItem[];
  saving?: boolean;
  onToggleAsk: (item: TalkItem, on: boolean) => void;
  /** 저장. 성공하면 then으로 '기록에 남겼어요'를 보여 준다 */
  onSave: (mood: Mood | null, text: string) => Promise<void>;
  /** 초안을 두고 나가기(홈 카드로 남음) */
  onKeep: (making: boolean) => void;
  /** 메모 없이 마치기 */
  onSkip: () => void;
  onDone: () => void;
}) {
  const m = ko.memo;
  const making = draft.status === "making";
  const hasDraft = draft.status === "ready" || making;
  const init = draft.status === "ready" ? (draft.text ?? "") : "";
  const [text, setText] = useState(init);
  const [mood, setMood] = useState<Mood | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [leave, setLeave] = useState(false);
  const dirty = text.trim() !== init.trim() || mood !== null;
  const note = noteOf(draft.status, partner);
  const key = (t: TalkItem) => t.id ?? t.text;

  if (saved) return <SavedScreen saved={saved} parent={parent} asked={checked.length} onDone={onDone} />;

  const back = () => (hasDraft ? onKeep(making) : dirty ? setLeave(true) : onSkip());
  const save = () => onSave(mood, text.trim()).then(() => setSaved({ mood, text: text.trim() }));

  return (
    <Screen>
      <ScreenHeader middle={<SmallTitle text={m.afterTitle} />} right={<OnlyMe />} onBack={back} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <T size={24} weight={800} ls={-0.04} lh={1.35} style={styles.how}>
          {m.howWas(partner)}
        </T>
        <MoodPick mood={mood} onMood={setMood} />
        {talks.length > 0 ? (
          <>
            <T size={15} weight={700} style={styles.askedHead}>
              {m.askedHead(parent)}
            </T>
            {talks.map((t) => {
              const on = checked.includes(key(t));
              return (
                <Pressable
                  key={key(t)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={m.askedLabel(parent, t.text)}
                  onPress={() => {
                    setChecked(on ? checked.filter((x) => x !== key(t)) : [...checked, key(t)]);
                    onToggleAsk(t, !on);
                  }}
                  style={styles.askRow}
                >
                  <View style={[styles.askMark, on && styles.askMarkOn]}>
                    {on ? <IcoTick size={13} /> : null}
                  </View>
                  <T size={16} lh={1.5} color={on ? C.textTertiary : C.text} style={styles.flex}>
                    {t.text}
                  </T>
                </Pressable>
              );
            })}
          </>
        ) : null}
        <View style={styles.memoHead}>
          <T size={15} weight={700}>
            {m.memoHead}
          </T>
          {draft.status === "ready" ? <Tag>{m.aiDraft}</Tag> : null}
        </View>
        {making ? (
          <View style={styles.drafting}>
            <T size={16} lh={1.6} color={C.textTertiary}>
              {m.drafting1}
            </T>
            <T size={14} lh={1.6} color={C.textSub} style={styles.drafting2}>
              {m.drafting2}
            </T>
          </View>
        ) : (
          <>
            <TextField
              value={text}
              onChangeText={setText}
              label={m.label}
              placeholder={m.placeholder(parent)}
              lines={hasDraft ? 5 : 3}
              size={17}
              card
              borderColor={draft.status === "ready" ? C.primarySoft : undefined}
            />
            {note ? (
              <T size={13} lh={1.55} color={C.textTertiary} style={styles.note}>
                {note}
              </T>
            ) : null}
          </>
        )}
      </ScrollView>
      <BottomBar>
        {making ? (
          <Button variant="secondary" onPress={() => onKeep(true)}>
            {m.toHome}
          </Button>
        ) : hasDraft ? (
          <View style={styles.gap4}>
            <Button disabled={saving || !(text.trim() || mood)} onPress={save}>
              {m.save}
            </Button>
            <Button variant="ghost" size={16} color={C.textSub} onPress={() => onKeep(false)}>
              {m.later}
            </Button>
          </View>
        ) : !text.trim() && !mood ? (
          <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}>
            <T size={16} weight={600} align="center">
              {checked.length ? m.skipAsked : m.skip}
            </T>
          </Pressable>
        ) : (
          <Button disabled={saving || !dirty} onPress={save}>
            {m.save}
          </Button>
        )}
      </BottomBar>
      <Dialog
        visible={leave}
        title={m.leaveNewTitle}
        body={m.leaveNewBody}
        confirmLabel={ko.common.leave}
        cancelLabel={ko.compose.keep}
        onConfirm={() => {
          setLeave(false);
          onSkip();
        }}
        onCancel={() => setLeave(false)}
      />
    </Screen>
  );
}

function SavedScreen({
  saved,
  parent,
  asked,
  onDone,
}: {
  saved: Saved;
  parent: boolean;
  asked: number;
  onDone: () => void;
}) {
  const m = ko.memo;
  const askedBox =
    asked > 0 ? (
      <View style={styles.askedBox}>
        <IcoCheckRound />
        <T size={14} weight={600} color={C.accent2Deep} style={styles.flex}>
          {m.askedCount(parent, asked)}
        </T>
      </View>
    ) : null;
  if (!saved.text) {
    return (
      <Screen>
        <View style={styles.center}>
          <View style={styles.checkBig}>
            <IcoCheck />
          </View>
          <T size={24} weight={800} ls={-0.04} lh={1.38} align="center" style={styles.savedTitle}>
            {m.savedTitle}
          </T>
          <T size={16} color={C.textSub} align="center" style={styles.moodOnly}>
            {m.moodOnly(saved.mood ? ko.mood[saved.mood] : "")}
          </T>
          {askedBox}
        </View>
        <BottomBar>
          <Button onPress={onDone}>{m.finish}</Button>
        </BottomBar>
      </Screen>
    );
  }
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.savedBody}>
        <View style={styles.savedHead}>
          <View style={styles.check}>
            <IcoCheck />
          </View>
          <T size={23} weight={800} ls={-0.04}>
            {m.savedTitle}
          </T>
        </View>
        <View style={styles.savedLabel}>
          <T size={16} weight={700}>
            {m.savedMemo}
          </T>
          <OnlyMe />
        </View>
        <View style={styles.savedWell}>
          <T size={16} lh={1.6}>
            {saved.text}
          </T>
        </View>
        {askedBox}
      </ScrollView>
      <BottomBar>
        <Button onPress={onDone}>{m.finish}</Button>
      </BottomBar>
    </Screen>
  );
}

export function EditMemoScreen({
  memo,
  saving = false,
  onBack,
  onSave,
  onDelete,
}: {
  memo: { text: string; mood: Mood | null; created_at: string };
  saving?: boolean;
  onBack: () => void;
  onSave: (mood: Mood | null, text: string) => void;
  onDelete: () => void;
}) {
  const m = ko.memo;
  const [text, setText] = useState(memo.text);
  const [mood, setMood] = useState<Mood | null>(memo.mood);
  const [leave, setLeave] = useState(false);
  const [askDel, setAskDel] = useState(false);
  const dirty = text.trim() !== memo.text.trim() || mood !== memo.mood;
  return (
    <Screen>
      <ScreenHeader
        middle={<SmallTitle text={m.editTitle} />}
        right={
          <Pressable accessibilityRole="button" onPress={() => setAskDel(true)} style={styles.remove}>
            <T size={15} weight={600} color={C.danger}>
              {ko.compose.remove}
            </T>
          </Pressable>
        }
        onBack={() => (dirty ? setLeave(true) : onBack())}
      />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <T size={22} weight={800} ls={-0.04} style={styles.date}>
          {ko.time.dateDay(seoulParts(memo.created_at))}
        </T>
        <TextField value={text} onChangeText={setText} label={m.label} lines={5} size={17} card />
        <T size={15} weight={700} style={styles.moodHead}>
          {m.moodHead}
          <T size={15} weight={500} color={C.textTertiary}>
            {m.optional}
          </T>
        </T>
        <MoodPick mood={mood} onMood={setMood} />
      </ScrollView>
      <BottomBar>
        <Button
          disabled={saving || !dirty || !(text.trim() || mood)}
          onPress={() => onSave(mood, text.trim())}
        >
          {m.save}
        </Button>
      </BottomBar>
      <Dialog
        visible={leave}
        title={m.leaveEditTitle}
        body={m.leaveEditBody}
        confirmLabel={ko.common.leave}
        cancelLabel={ko.compose.keep}
        onConfirm={() => {
          setLeave(false);
          onBack();
        }}
        onCancel={() => setLeave(false)}
      />
      <Dialog
        visible={askDel}
        title={ko.archive.deleteMemoTitle}
        body={ko.archive.deleteMemoBody}
        confirmLabel={ko.compose.remove}
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

function SmallTitle({ text }: { text: string }) {
  return (
    <T size={16} weight={700} ls={-0.02} accessibilityRole="header">
      {text}
    </T>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  gap4: { gap: 4 },
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  how: { marginBottom: 16 },
  moods: { flexDirection: "row", gap: 8 },
  mood: {
    flex: 1,
    minHeight: 50,
    borderRadius: R.btn,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  askedHead: { marginTop: 26, marginBottom: 4 },
  askRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 },
  askMark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  askMarkOn: { borderColor: C.accent2, backgroundColor: C.accent2 },
  memoHead: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 26, marginBottom: 10 },
  drafting: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: R.card,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 170,
    marginBottom: 12,
  },
  drafting2: { marginTop: 10 },
  note: { marginTop: 8, marginHorizontal: 2, marginBottom: 12 },
  skip: {
    minHeight: 54,
    borderRadius: R.btn,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  checkBig: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  savedTitle: { marginBottom: 10 },
  moodOnly: { marginBottom: 28 },
  askedBox: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: R.sm,
    backgroundColor: C.accent2Light,
    marginTop: 18,
  },
  savedBody: { paddingTop: 22, paddingHorizontal: 24, paddingBottom: 20 },
  savedHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  check: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  savedLabel: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  savedWell: { backgroundColor: C.well, borderRadius: R.sm, paddingVertical: 15, paddingHorizontal: 16 },
  remove: { minHeight: 44, justifyContent: "center", paddingLeft: 20, marginVertical: -4 },
  date: { marginBottom: 16 },
  moodHead: { marginTop: 20, marginBottom: 10 },
});
