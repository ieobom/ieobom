// 가족 초대(39차 '누구와 이어볼까요' → '나는 엄마 / 아빠' → 'OO를 초대해요')와 받은 코드 넣기('받은 초대 코드를 넣어 주세요').
// 단계마다 몸통(PickBody · ParentAsBody · InviteShowBody · CodeBody)을 따로 두고, 앱 안 흐름(InviteFlow · CodeEntryScreen)과
// 가입 흐름(3-4, signup)이 같이 쓴다. 앱 안에서는 고를 수 있는 가족이 하나면 첫 단계를 건너뛴다(시안 startInvite).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type TextStyle } from "react-native";
import { ko } from "@/copy/ko";
import { CodeDigits, ShareScope } from "@/features/my/family-screens";
import { whenLabel } from "@/features/my/labels";
import { BottomBar } from "@/features/my/parts";
import type { MyPage } from "@/features/my/types";
import {
  BowMark,
  Button,
  C,
  CARD,
  FAMILY,
  IcoChevronRight,
  Option,
  R,
  Screen,
  ScreenHeader,
  T,
  useTextScale,
} from "@/ui";
import { asLabel, lookupError, previewLines } from "./labels";
import type { InviteAs, Issued, Kind, Lookup } from "./use-invite";

export type Choice = { key: InviteAs; label: string; desc?: string; taken?: string };

/** 고를 수 있는 가족: 자녀는 엄마 · 아빠, 부모님은 자녀. 이미 이어졌거나 코드를 보낸 자리는 막는다 */
export function inviteOptions(d: MyPage): Choice[] {
  const i = ko.invite;
  const sent = (a: InviteAs) => d.invites.some((x) => x.invite_as === a);
  if (d.me.side === "parent") {
    return [
      { key: "child", label: ko.my.child, desc: i.childDesc, taken: sent("child") ? i.takenSent : undefined },
    ];
  }
  return (["mom", "dad"] as const).map((k) => ({
    key: k,
    label: asLabel(k),
    taken: d.families.some((f) => f.parent_kind === k) ? i.takenLinked : sent(k) ? i.takenSent : undefined,
  }));
}

/** 가입 때는 엄마 · 아빠 · 자녀 셋 다 고른다 */
export const ALL_CHOICES: Choice[] = [
  { key: "mom", label: ko.family.mom },
  { key: "dad", label: ko.family.dad },
  { key: "child", label: ko.my.child, desc: ko.invite.childDesc },
];

function Heading({ title, sub, subGap = 28 }: { title: string; sub?: string; subGap?: number }) {
  return (
    <>
      <T size={26} weight={800} ls={-0.04} lh={1.3} style={styles.h2}>
        {title}
      </T>
      {sub ? (
        <T size={16} lh={1.6} ls={-0.01} color={C.textSub} style={{ marginBottom: subGap }}>
          {sub}
        </T>
      ) : null}
    </>
  );
}

// ── 단계 몸통 ──────────────────────────────

export function PickBody({
  options,
  sub,
  onPick,
  onHaveCode,
}: {
  options: Choice[];
  sub: string;
  onPick: (key: InviteAs) => void;
  onHaveCode: () => void;
}) {
  const i = ko.invite;
  return (
    <>
      <Heading title={i.pickTitle} sub={sub} />
      <View style={styles.options}>
        {options.map((o) => (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!o.taken }}
            disabled={!!o.taken}
            onPress={() => onPick(o.key)}
            style={[CARD, styles.option, !!o.taken && styles.taken]}
          >
            <View style={styles.flex}>
              <T size={19} weight={700} ls={-0.03}>
                {o.label}
              </T>
              {o.taken || o.desc ? (
                <T size={14} color={C.textSub} style={styles.optionDesc}>
                  {o.taken ?? o.desc}
                </T>
              ) : null}
            </View>
            {o.taken ? null : <IcoChevronRight />}
          </Pressable>
        ))}
      </View>
      <Button variant="ghost" onPress={onHaveCode} style={styles.haveCode}>
        {i.haveCode}
      </Button>
    </>
  );
}

export function ParentAsBody({
  value,
  saved,
  onChange,
}: {
  value?: Kind;
  /** 전에 고른 값을 골라 두었는지(앱 안에서 더 초대할 때) */
  saved: boolean;
  onChange: (k: Kind) => void;
}) {
  const i = ko.invite;
  return (
    <>
      <Heading title={i.asTitle} sub={saved ? i.asSubSaved : i.asSubNew} />
      <View style={styles.options}>
        {(["mom", "dad"] as const).map((k) => (
          <Option
            key={k}
            label={i.asOption(asLabel(k))}
            selected={value === k}
            mark
            onPress={() => onChange(k)}
          />
        ))}
      </View>
    </>
  );
}

export function InviteShowBody({
  who,
  issued,
  onKakao,
  onCopy,
  extra,
}: {
  who: string;
  issued?: Issued;
  onKakao: () => void;
  onCopy: () => void;
  /** 기다림 아래 더 보일 것(가입 때 '알림 받기') */
  extra?: ReactNode;
}) {
  const i = ko.invite;
  return (
    <>
      <Heading title={i.title(who)} sub={i.sub(who)} subGap={24} />
      {issued ? (
        <>
          <CodeDigits code={issued.code} />
          <T size={13} color={C.textTertiary} align="center" style={styles.until}>
            {ko.my.usableUntil(whenLabel(issued.expires_at))}
          </T>
          <View style={styles.share}>
            <Button onPress={onKakao} style={styles.flex2}>
              {ko.my.sendKakao}
            </Button>
            <Button variant="secondary" onPress={onCopy} style={styles.flex1}>
              {ko.my.copy}
            </Button>
          </View>
          <View style={[styles.waiting, extra ? styles.mb6 : styles.mb24]}>
            <View style={styles.waitDot} />
            <T size={14} color={C.textSub}>
              {ko.my.waiting(who)}
            </T>
          </View>
          {extra}
        </>
      ) : (
        <View style={styles.codeSpace} />
      )}
      <ShareScope partner={who} />
    </>
  );
}

// 큰 숫자 칸(시안의 letter-spacing 0.5em). 웹에서는 파란 테두리를 없앤다
const noOutline: TextStyle = Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as TextStyle) : {};

export function CodeBody({
  code,
  onChange,
  result,
}: {
  code: string;
  onChange: (code: string) => void;
  result?: Lookup;
}) {
  const i = ko.invite;
  const scale = useTextScale();
  const size = 28 * scale;
  const ok = result?.ok ? result : undefined;
  const err = result && !result.ok ? lookupError(result) : undefined;
  const lines = ok ? previewLines(ok) : undefined;
  return (
    <>
      <Heading title={i.codeTitle} sub={i.codeSub} />
      <TextInput
        accessibilityLabel={i.codeLabel}
        value={code}
        onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="······"
        placeholderTextColor={C.disabledText}
        autoFocus
        style={[
          noOutline,
          styles.codeInput,
          {
            fontFamily: FAMILY[600],
            fontSize: size,
            letterSpacing: size * 0.5,
            borderColor: err ? C.danger : ok ? C.primary : C.border,
          },
        ]}
      />
      {err ? (
        <T size={14} lh={1.6} color={C.danger} style={styles.err}>
          {err}
        </T>
      ) : null}
      {lines ? (
        <View style={[CARD, styles.preview]}>
          <View style={styles.knot} aria-hidden>
            <BowMark width={30} knot />
          </View>
          <View style={styles.flex}>
            <T size={15} ls={-0.02} color={C.textSub}>
              {lines.by}
            </T>
            <T size={17} weight={800} ls={-0.03} style={styles.previewAs}>
              {lines.as}
            </T>
            <T size={13} color={C.textTertiary} style={styles.previewAsk}>
              {lines.ask}
            </T>
          </View>
        </View>
      ) : null}
    </>
  );
}

// ── 앱 안 흐름 ──────────────────────────────

type Step = "pick" | "as" | "show";

export function InviteFlow({
  data,
  issued,
  onIssue,
  onKakao,
  onCopy,
  onClose,
  onHaveCode,
  onExit,
}: {
  data: MyPage;
  /** 만든 코드(onIssue 뒤 채워진다) */
  issued?: Issued;
  onIssue: (inviteAs: InviteAs, myKind?: Kind) => void;
  onKakao: () => void;
  onCopy: () => void;
  onClose: () => void;
  onHaveCode: () => void;
  onExit: () => void;
}) {
  const i = ko.invite;
  const options = inviteOptions(data);
  const open = options.filter((o) => !o.taken);
  const only = open.length === 1 ? open[0] : undefined;
  // 부모님이 전에 고른 엄마 · 아빠
  const saved = data.families.find((f) => f.my_side === "parent")?.parent_kind;
  const [relation, setRelation] = useState<InviteAs | undefined>(only?.key);
  const [step, setStep] = useState<Step>(only ? (only.key === "child" ? "as" : "show") : "pick");
  const [kind, setKind] = useState<Kind | undefined>(saved);

  // 처음부터 코드 화면이면(엄마 · 아빠 중 하나만 남음) 들어오자마자 코드를 만든다
  const asked = useRef(false);
  useEffect(() => {
    if (step === "show" && relation && !asked.current) {
      asked.current = true;
      onIssue(relation, relation === "child" ? kind : undefined);
    }
  }, [step, relation, kind, onIssue]);

  const go = (next: Step) => {
    asked.current = false;
    setStep(next);
  };
  const back = () => {
    if (step === "pick") return onExit();
    if (step === "as") return only ? onExit() : go("pick");
    if (relation === "child") return go("as");
    return only ? onExit() : go("pick");
  };

  return (
    <Screen>
      <ScreenHeader onBack={back} />
      <ScrollView contentContainerStyle={styles.body}>
        {step === "pick" ? (
          <PickBody
            options={options}
            sub={data.me.side === "parent" ? i.pickSubChild : i.pickSubParents}
            onPick={(k) => {
              setRelation(k);
              go(k === "child" ? "as" : "show");
            }}
            onHaveCode={onHaveCode}
          />
        ) : step === "as" ? (
          <ParentAsBody value={kind} saved={!!saved} onChange={setKind} />
        ) : (
          <InviteShowBody
            who={relation ? asLabel(relation) : ""}
            issued={issued}
            onKakao={onKakao}
            onCopy={onCopy}
          />
        )}
      </ScrollView>
      {step === "as" ? (
        <BottomBar>
          <Button disabled={!kind} onPress={() => go("show")}>
            {i.next}
          </Button>
        </BottomBar>
      ) : step === "show" ? (
        <BottomBar>
          <Button variant="secondary" onPress={onClose}>
            {i.close}
          </Button>
        </BottomBar>
      ) : null}
    </Screen>
  );
}

export function CodeEntryScreen({
  code,
  onChange,
  result,
  connecting = false,
  onConnect,
  onBack,
}: {
  code: string;
  onChange: (code: string) => void;
  /** 여섯 자리를 다 넣으면 서버가 확인한 결과 */
  result?: Lookup;
  connecting?: boolean;
  onConnect: () => void;
  onBack: () => void;
}) {
  return (
    <Screen>
      <ScreenHeader onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <CodeBody code={code} onChange={onChange} result={result} />
      </ScrollView>
      <BottomBar>
        <Button disabled={!result?.ok || connecting} onPress={onConnect}>
          {ko.invite.connect}
        </Button>
      </BottomBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  flex1: { flex: 1, width: "auto" },
  flex2: { flex: 2, width: "auto" },
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  h2: { marginBottom: 8 },
  options: { gap: 12 },
  option: {
    minHeight: 76,
    paddingVertical: 18,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taken: { opacity: 0.5 },
  optionDesc: { marginTop: 4 },
  haveCode: { marginTop: 18 },
  until: { marginTop: 12, marginBottom: 20 },
  share: { flexDirection: "row", gap: 10, marginBottom: 16 },
  waiting: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  mb6: { marginBottom: 6 },
  mb24: { marginBottom: 24 },
  waitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent2 },
  codeSpace: { height: 56 + 12 + 20 + 54 + 16 + 24 + 20 },
  codeInput: {
    width: "100%",
    height: 64,
    borderWidth: 1.5,
    borderRadius: R.btn,
    paddingHorizontal: 16,
    color: C.text,
    backgroundColor: C.bg,
    textAlign: "center",
    marginBottom: 16,
  },
  err: { paddingHorizontal: 4, paddingBottom: 12 },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  knot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  previewAs: { marginTop: 2 },
  previewAsk: { marginTop: 4 },
});
