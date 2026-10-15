// 마이 첫 화면(39차 SettingsScreen): 이름 → 연결된 가족 · 통화 편한 시간 → 알림 · 통화 메모 초안 · 글자 크게 보기
// → 개인정보와 안내 → 도움말 · 문의 → 로그아웃 · 탈퇴하기.
// '가족 전화 받기'(알림 · 마이크 권한)는 6-8에서 더한다. 도움말 · 문의는 아래 창(help-sheet).
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ko, type HelpGo } from "@/copy/ko";
import { partnerLabel } from "@/features/home/partner";
import { seoulParts } from "@/lib/dates";
import { callName } from "@/lib/korean";
import { Avatar, Button, C, CARD, Dialog, Divider, IcoChevronRight, Screen, Sheet, T, TextField } from "@/ui";
import { HelpSheet } from "./help-sheet";
import { familiesDesc, scheduleDesc } from "./labels";
import { Group, SettingsRow } from "./parts";
import type { MyPage } from "./types";
import type { Inquiry } from "./use-help";

export type DocKey = keyof typeof ko.my.docs;

export type MyHandlers = {
  onSurvey: () => void;
  onFamilies: () => void;
  onSchedule: () => void;
  onNotify: () => void;
  onPrivacy: () => void;
  onDoc: (key: DocKey) => void;
  /** 도움말을 열 때 (새로 온 답을 봤다고 적는다) */
  onHelpOpen: () => void;
  /** 도움말 답 아래 단추. 할 일을 한 뒤 도움말은 닫힌다 */
  onHelpGo: (go: HelpGo) => void;
  onSendInquiry: (body: string, helpItem: string) => void;
  onRename: (name: string) => void;
  onMemoDraft: (on: boolean) => void;
  onBigText: (on: boolean) => void;
  onLogout: () => void;
  onWithdraw: () => void;
};

const DOC_KEYS = Object.keys(ko.my.docs) as DocKey[];

export function SettingsScreen({
  data,
  inquiries,
  handlers: h,
}: {
  data: MyPage;
  inquiries: Inquiry[];
  handlers: MyHandlers;
}) {
  const m = ko.my;
  const me = data.me;
  const parent = me.side === "parent";
  const [naming, setNaming] = useState(false);
  const [askOut, setAskOut] = useState(false);
  const [askWithdraw, setAskWithdraw] = useState(false);
  const [help, setHelp] = useState(false);

  const agreed = me.agreed_at ? ko.time.date(seoulParts(me.agreed_at)) : null;
  const notify = me.notify_on ? m.notifyAt(m.notifyTimes[me.notify_time]) : m.notifyOff;
  const connected = data.families.map(partnerLabel).join(" · ");
  // 부모님 이름은 자녀 화면에 '엄마 · 아빠'로 보인다. 자녀가 한 명이면 그 이름으로 알려 준다
  const [first] = data.families;
  const example = first ? partnerLabel(first) : ko.family.someone;
  const renameHint = !parent
    ? m.renameHintChild
    : first
      ? m.renameHintParent(
          data.families.length === 1 && first.partner_name ? callName(first.partner_name) : m.child,
          first.parent_kind === "mom" ? ko.family.mom : ko.family.dad,
        )
      : m.renameHintAlone;

  return (
    <Screen>
      <View style={styles.head}>
        <T size={22} weight={800} ls={-0.04} accessibilityRole="header">
          {m.title}
        </T>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.profile}>
          <Avatar size={52} />
          <View style={styles.flex}>
            <T size={18} weight={700} ls={-0.03}>
              {me.name}
            </T>
            <View style={styles.login}>
              {me.provider === "apple" ? null : <View style={styles.kakaoDot} />}
              <T size={14} color={C.textTertiary}>
                {me.provider === "apple" ? m.loginApple : m.loginKakao}
              </T>
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setNaming(true)} style={styles.rename}>
            <T size={15} weight={700} color={C.textSub}>
              {m.rename}
            </T>
          </Pressable>
        </View>

        {/* 이용 설문은 이름 바로 아래(39차 2회) */}
        {data.survey ? (
          <Pressable
            accessibilityRole="button"
            onPress={h.onSurvey}
            style={({ pressed }) => [CARD, styles.survey, pressed && styles.pressed]}
          >
            <View style={styles.flex}>
              <T size={16} weight={700} ls={-0.02} style={styles.surveyTitle}>
                {ko.survey.cardTitle(data.survey.round)}
              </T>
              <T size={13} color={C.textTertiary}>
                {ko.survey.cardSub}
              </T>
            </View>
            <IcoChevronRight />
          </Pressable>
        ) : null}

        <Group>
          <SettingsRow label={m.families} desc={familiesDesc(data)} onPress={h.onFamilies} />
          <Divider />
          <SettingsRow label={m.schedule} desc={scheduleDesc(data.call_times)} onPress={h.onSchedule} />
        </Group>

        <Group>
          <SettingsRow label={m.notify} desc={notify} onPress={h.onNotify} />
          <Divider />
          <SettingsRow
            label={m.memoDraft}
            desc={me.memo_draft_on ? m.memoDraftOn : m.memoDraftOff}
            toggled={me.memo_draft_on}
            onPress={() => h.onMemoDraft(!me.memo_draft_on)}
          />
          <Divider />
          <SettingsRow
            label={m.bigText}
            desc={m.bigTextSub}
            toggled={me.large_text}
            onPress={() => h.onBigText(!me.large_text)}
          />
        </Group>

        <T size={14} weight={700} color={C.textSub} style={styles.section}>
          {m.infoHead}
        </T>
        <Group>
          <SettingsRow label={m.privacy} onPress={h.onPrivacy} />
          {DOC_KEYS.map((k) => (
            <View key={k}>
              <Divider />
              <SettingsRow label={m.docs[k]} onPress={() => h.onDoc(k)} />
            </View>
          ))}
        </Group>
        {agreed ? (
          <T size={13} lh={1.6} color={C.textTertiary} style={styles.agreed}>
            {m.agreed(agreed, me.doc_version ?? "")}
          </T>
        ) : null}

        <Group>
          <SettingsRow
            label={m.help}
            desc={m.helpSub}
            onPress={() => {
              setHelp(true);
              h.onHelpOpen();
            }}
          />
        </Group>

        <View style={styles.out}>
          <Button variant="ghost" size={16} onPress={() => setAskOut(true)}>
            {m.logout}
          </Button>
          <Button variant="ghost" size={14} onPress={() => setAskWithdraw(true)}>
            {m.withdraw}
          </Button>
        </View>
      </ScrollView>

      {/* 열 때마다 지금 이름으로 다시 시작한다 */}
      {naming ? (
        <NameSheet
          visible
          name={me.name}
          hint={renameHint}
          onClose={() => setNaming(false)}
          onSave={(v) => {
            setNaming(false);
            h.onRename(v);
          }}
        />
      ) : null}
      <HelpSheet
        visible={help}
        big={me.large_text}
        example={example}
        inquiries={inquiries}
        onClose={() => setHelp(false)}
        onGo={(go) => {
          setHelp(false);
          h.onHelpGo(go);
        }}
        onSend={h.onSendInquiry}
      />
      <Dialog
        visible={askOut}
        title={m.logoutTitle}
        body={m.logoutBody}
        confirmLabel={m.logout}
        onConfirm={() => {
          setAskOut(false);
          h.onLogout();
        }}
        onCancel={() => setAskOut(false)}
      />
      <Dialog
        visible={askWithdraw}
        title={m.withdrawTitle}
        body={m.withdrawBody(connected)}
        confirmLabel={m.withdraw}
        danger
        onConfirm={() => {
          setAskWithdraw(false);
          h.onWithdraw();
        }}
        onCancel={() => setAskWithdraw(false)}
      />
    </Screen>
  );
}

function NameSheet({
  visible,
  name,
  hint,
  onClose,
  onSave,
}: {
  visible: boolean;
  name: string;
  hint: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [v, setV] = useState(name);
  const m = ko.my;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <T size={21} weight={800} ls={-0.04} style={styles.sheetTitle}>
        {m.rename}
      </T>
      <T size={15} lh={1.6} color={C.textSub} style={styles.sheetHint}>
        {hint}
      </T>
      <View style={styles.field}>
        <TextField value={v} onChangeText={(t) => setV(t.slice(0, 20))} maxLength={20} label={m.nameLabel} />
      </View>
      <Button onPress={() => onSave(v.trim())} disabled={!v.trim()}>
        {m.save}
      </Button>
      <Button variant="ghost" onPress={onClose} style={styles.sheetClose}>
        {ko.common.close}
      </Button>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  head: { paddingTop: 20, paddingHorizontal: 24 },
  body: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 40 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 4,
    paddingHorizontal: 4,
    paddingBottom: 24,
  },
  login: { flexDirection: "row", alignItems: "center", gap: 6 },
  kakaoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.kakao,
    boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
  },
  rename: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  survey: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 18,
    marginBottom: 16,
  },
  surveyTitle: { marginBottom: 3 },
  pressed: { opacity: 0.9 },
  section: { marginTop: 12, marginHorizontal: 4, marginBottom: 10 },
  agreed: { marginTop: -6, marginHorizontal: 4, marginBottom: 20 },
  out: { alignItems: "center", gap: 2 },
  sheetTitle: { marginBottom: 6 },
  sheetHint: { marginBottom: 16 },
  field: { marginBottom: 20 },
  sheetClose: { marginTop: 6 },
});
