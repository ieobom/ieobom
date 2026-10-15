// 마이 > 연결된 가족(39차 FamilyManagementScreen) · 초대 코드 보기(InviteManageScreen) · 가족별 설정(RelationshipSettingsScreen).
import { AVOID_TOPICS, NEWS_TOPICS } from "@ieobom/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { partnerLabel } from "@/features/home/partner";
import { seoulParts } from "@/lib/dates";
import {
  Avatar,
  Button,
  C,
  CARD,
  Chip,
  Dialog,
  IcoChevronRight,
  IcoPlus,
  R,
  Screen,
  ScreenHeader,
  T,
} from "@/ui";
import { inviteLabel, isExpired, whenLabel } from "./labels";
import { BottomBar, Expand, Group, MarkList, SettingsRow } from "./parts";
import type { Freq, MyFamily, MyInvite, MyPage } from "./types";

// ── 연결된 가족 ──────────────────────────────

export function FamilyListScreen({
  data,
  now = new Date(),
  onBack,
  onFamily,
  onInviteOpen,
  onInvite,
  onCode,
}: {
  data: MyPage;
  now?: Date;
  onBack: () => void;
  onFamily: (relationshipId: string) => void;
  onInviteOpen: (inviteAs: MyInvite["invite_as"]) => void;
  onInvite: () => void;
  onCode: () => void;
}) {
  const m = ko.my;
  const parent = data.me.side === "parent";
  const taken = (kind: "mom" | "dad") =>
    data.families.some((f) => f.parent_kind === kind) || data.invites.some((i) => i.invite_as === kind);
  // 자녀는 엄마 · 아빠 중 빈 자리가 있을 때, 부모님은 기다리는 자녀 초대가 없을 때 더 초대할 수 있다
  const canInvite = parent
    ? !data.invites.some((i) => i.invite_as === "child")
    : !taken("mom") || !taken("dad");
  const empty = data.families.length === 0 && data.invites.length === 0;

  return (
    <Screen>
      <ScreenHeader title={m.families} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        {!parent && data.families.length > 1 ? (
          <T size={14} lh={1.65} color={C.textTertiary} style={styles.lead}>
            {m.perFamily}
          </T>
        ) : null}
        <View style={styles.cards}>
          {empty ? (
            <View style={[CARD, styles.emptyCard]}>
              <T size={15} lh={1.6} color={C.textSub}>
                {m.noFamily}
              </T>
            </View>
          ) : null}
          {data.families.map((f) => (
            <FamilyCard
              key={f.relationship_id}
              name={partnerLabel(f)}
              status={m.linked}
              dot={C.accent2}
              action={m.openSettings}
              label={m.settingsLabel(partnerLabel(f))}
              onPress={() => onFamily(f.relationship_id)}
            />
          ))}
          {data.invites.map((i) => {
            const expired = isExpired(i, now);
            return (
              <FamilyCard
                key={i.id}
                pending
                name={inviteLabel(i)}
                status={expired ? m.codeExpired : m.codeSentUntil(ko.time.date(seoulParts(i.expires_at)))}
                dot={expired ? C.danger : C.primary}
                danger={expired}
                action={m.openCode}
                label={m.codeLabel(inviteLabel(i))}
                onPress={() => onInviteOpen(i.invite_as)}
              />
            );
          })}
        </View>
        {canInvite ? (
          <Button variant="secondary" icon={<IcoPlus color={C.primary} size={18} />} onPress={onInvite}>
            {m.invite}
          </Button>
        ) : null}
        <Button variant="ghost" size={16} color={C.textSub} onPress={onCode} style={styles.code}>
          {m.enterCode}
        </Button>
      </ScrollView>
    </Screen>
  );
}

function FamilyCard({
  name,
  status,
  dot,
  action,
  label,
  onPress,
  pending = false,
  danger = false,
}: {
  name: string;
  status: string;
  dot: string;
  action: string;
  label: string;
  onPress: () => void;
  pending?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [CARD, styles.familyCard, pressed && styles.pressed]}
    >
      {pending ? <Avatar size={44} bg={C.plainBg} color={C.textTertiary} /> : <Avatar size={44} />}
      <View style={styles.flex}>
        <T size={17} weight={700} ls={-0.03} style={styles.familyName}>
          {name}
        </T>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: dot }]} />
          <T size={13} color={danger ? C.danger : C.textTertiary} style={styles.flex}>
            {status}
          </T>
        </View>
      </View>
      <View style={styles.action}>
        <T size={14} weight={600} color={C.textSub}>
          {action}
        </T>
        <IcoChevronRight />
      </View>
    </Pressable>
  );
}

// ── 초대 코드 보기 ──────────────────────────────

/** 초대 코드 여섯 칸 */
export function CodeDigits({ code }: { code: string }) {
  return (
    <View style={styles.digits} accessibilityLabel={code.split("").join(" ")}>
      {code
        .padEnd(6, " ")
        .split("")
        .map((d, i) => (
          <View key={i} style={styles.digit}>
            <T size={26} weight={800} style={styles.tabular}>
              {d.trim()}
            </T>
          </View>
        ))}
    </View>
  );
}

/** '이어지면 엄마에게' 보여요 · 안 보여요 */
export function ShareScope({ partner }: { partner: string }) {
  const m = ko.my;
  return (
    <View style={styles.scope}>
      <T size={14} weight={700} style={styles.scopeHead}>
        {m.scopeHead(partner)}
      </T>
      <MarkList items={[m.scopeShown]} shown />
      <MarkList items={[m.scopeHidden]} shown={false} />
    </View>
  );
}

export function InviteScreen({
  invite,
  now = new Date(),
  onBack,
  onRenew,
  onKakao,
  onCopy,
  onCancel,
}: {
  invite: MyInvite;
  now?: Date;
  onBack: () => void;
  onRenew: () => void;
  onKakao: () => void;
  onCopy: () => void;
  onCancel: () => void;
}) {
  const m = ko.my;
  const who = inviteLabel(invite);
  const expired = isExpired(invite, now);
  const [ask, setAsk] = useState(false);
  return (
    <Screen>
      <ScreenHeader onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <T size={26} weight={800} ls={-0.04} lh={1.3} style={styles.inviteTitle}>
          {expired ? m.expiredTitle : m.invited(who)}
        </T>
        <T size={16} lh={1.6} ls={-0.01} color={C.textSub} style={styles.inviteSub}>
          {expired ? m.expiredBody : m.resend(who)}
        </T>
        <View style={expired && styles.faded}>
          <CodeDigits code={invite.code} />
        </View>
        <T size={13} color={expired ? C.danger : C.textTertiary} align="center" style={styles.until}>
          {expired ? m.endedAt(whenLabel(invite.expires_at)) : m.usableUntil(whenLabel(invite.expires_at))}
        </T>
        {expired ? (
          <Button onPress={onRenew} style={styles.mb24}>
            {m.renew}
          </Button>
        ) : (
          <>
            <View style={styles.share}>
              <Button onPress={onKakao} style={styles.flex2}>
                {m.sendKakao}
              </Button>
              <Button variant="secondary" onPress={onCopy} style={styles.flex1}>
                {m.copy}
              </Button>
            </View>
            <View style={styles.waiting}>
              <View style={styles.waitDot} />
              <T size={14} color={C.textSub}>
                {m.waiting(who)}
              </T>
            </View>
          </>
        )}
        <ShareScope partner={who} />
      </ScrollView>
      <BottomBar>
        <Button variant="ghost" color={C.danger} onPress={() => setAsk(true)}>
          {m.cancelInvite}
        </Button>
      </BottomBar>
      <Dialog
        visible={ask}
        title={m.cancelTitle}
        body={m.cancelBody}
        confirmLabel={m.cancelInvite}
        cancelLabel={m.keep}
        danger
        onConfirm={() => {
          setAsk(false);
          onCancel();
        }}
        onCancel={() => setAsk(false)}
      />
    </Screen>
  );
}

// ── 가족별 설정 ──────────────────────────────

export function FamilySettingsScreen({
  family,
  onBack,
  onFreq,
  onTopics,
  onPrivacy,
  onDisconnect,
}: {
  family: MyFamily;
  onBack: () => void;
  onFreq: (freq: Freq) => void;
  onTopics: (t: { avoid_topics?: string[]; curious_topics?: string[] }) => void;
  onPrivacy: () => void;
  onDisconnect: () => void;
}) {
  const m = ko.my;
  const who = partnerLabel(family);
  const two = m.two(family.my_side === "parent");
  const [open, setOpen] = useState<"freq" | "curious" | "avoid" | null>(null);
  const [ask, setAsk] = useState(false);
  const flip = (k: typeof open) => setOpen(open === k ? null : k);
  const toggle = (list: string[], t: string) =>
    list.includes(t) ? list.filter((x) => x !== t) : [...list, t];
  const fl = (f: Freq) => m.freqs[f - 1]!;
  const same = family.applied === family.freq;

  return (
    <Screen>
      <ScreenHeader title={m.familyTitle(who)} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <Expand
          title={m.freq}
          sub={same ? fl(family.freq) : m.freqLess(fl(family.applied), two)}
          open={open === "freq"}
          onToggle={() => flip("freq")}
        >
          <View style={styles.chips}>
            {([1, 2, 3] as const).map((f) => (
              <Chip
                key={f}
                label={m.freqChip(fl(f), m.freqDays[f - 1]!)}
                selected={family.freq === f}
                onPress={() => onFreq(f)}
              />
            ))}
          </View>
          <T size={14} lh={1.6} color={same ? C.textTertiary : C.textSub} style={styles.note}>
            {(same ? m.freqSame(two) : m.freqDiff(fl(family.freq), two, fl(family.applied))) + m.freqNext}
          </T>
        </Expand>

        <Expand
          title={m.curious}
          sub={family.curious_topics.length ? family.curious_topics.join(", ") : m.none}
          open={open === "curious"}
          onToggle={() => flip("curious")}
        >
          <View style={styles.chips}>
            {NEWS_TOPICS.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={family.curious_topics.includes(t)}
                onPress={() => onTopics({ curious_topics: toggle(family.curious_topics, t) })}
              />
            ))}
          </View>
          <T size={14} lh={1.6} color={C.textTertiary} style={styles.note}>
            {m.curiousNote(who)}
          </T>
        </Expand>

        <Expand
          title={m.avoid}
          sub={family.avoid_topics.length ? family.avoid_topics.join(", ") : m.none}
          open={open === "avoid"}
          onToggle={() => flip("avoid")}
        >
          <View style={styles.chips}>
            {AVOID_TOPICS.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={family.avoid_topics.includes(t)}
                onPress={() => onTopics({ avoid_topics: toggle(family.avoid_topics, t) })}
              />
            ))}
          </View>
          <T size={13} lh={1.6} color={C.textTertiary} style={styles.note}>
            {m.avoidNote(who)}
          </T>
        </Expand>

        <Group>
          <SettingsRow label={m.shownTo(who)} onPress={onPrivacy} />
        </Group>
        <Group last>
          <SettingsRow label={m.disconnect(who)} danger chevron={false} onPress={() => setAsk(true)} />
        </Group>
      </ScrollView>
      <Dialog
        visible={ask}
        title={m.disconnectTitle(who)}
        body={m.disconnectBody}
        confirmLabel={m.disconnectOk}
        danger
        onConfirm={() => {
          setAsk(false);
          onDisconnect();
        }}
        onCancel={() => setAsk(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  flex1: { flex: 1, width: "auto" },
  flex2: { flex: 2, width: "auto" },
  body: { paddingHorizontal: 24, paddingBottom: 48 },
  lead: { marginHorizontal: 4, marginBottom: 16 },
  cards: { gap: 12, marginBottom: 16 },
  emptyCard: { paddingVertical: 18, paddingHorizontal: 18 },
  familyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 16,
  },
  pressed: { opacity: 0.9 },
  familyName: { marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  action: { flexDirection: "row", alignItems: "center", gap: 2 },
  code: { marginTop: 8 },
  digits: { flexDirection: "row", gap: 8, justifyContent: "center" },
  digit: {
    width: 44,
    height: 56,
    borderRadius: R.sm,
    backgroundColor: C.digitBg,
    alignItems: "center",
    justifyContent: "center",
  },
  tabular: { fontVariant: ["tabular-nums"] },
  scope: {
    backgroundColor: C.well,
    borderRadius: R.sm,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scopeHead: { marginBottom: 12 },
  inviteTitle: { marginBottom: 8 },
  inviteSub: { marginBottom: 24 },
  faded: { opacity: 0.35 },
  until: { marginTop: 12, marginBottom: 20 },
  mb24: { marginBottom: 24 },
  share: { flexDirection: "row", gap: 10, marginBottom: 16 },
  waiting: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 },
  waitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  note: { marginTop: 10 },
});
