// 가입(39차 OnboardingScreen 'signup' · 'signupCode'): 로그인 → 이름 → 동의 → 누구와 이어볼까요 → (자녀면 나는 엄마 / 아빠)
// → 초대 코드 보내고 기다리기 또는 받은 코드 넣기 → 이어졌어요 → 통화 편한 시간 → 질문 → 알림.
// 서버 일(로그인 · 가입 마무리 · 코드 · 저장)은 부르는 쪽이 한다. 카카오 로그인은 3-1 · 3-2, 알림 · 마이크 권한은 6-2에서 붙인다.
// 부모님이 되면(자녀를 고르거나 부모님으로 이어지면) 그 뒤 화면은 글자를 크게 그린다(시안 onBig).
import { AVOID_TOPICS } from "@ieobom/shared";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ko } from "@/copy/ko";
import {
  ALL_CHOICES,
  CodeBody,
  InviteShowBody,
  ParentAsBody,
  PickBody,
} from "@/features/invite/invite-screens";
import { asLabel } from "@/features/invite/labels";
import type { InviteAs, Issued, Kind, Lookup } from "@/features/invite/use-invite";
import { BottomBar, MarkList } from "@/features/my/parts";
import { startSlots, TimesEditor, type Slot } from "@/features/my/schedule-screen";
import type { DocKey } from "@/features/my/settings-screen";
import type { CallTime, Freq, NotifyTime } from "@/features/my/types";
import {
  BIG_TEXT_SCALE,
  BowMark,
  Button,
  C,
  Chip,
  Divider,
  IcoBack,
  IcoPhone,
  IcoTick,
  Option,
  R,
  Screen,
  Sheet,
  T,
  TextField,
  TextScaleProvider,
  Toggle,
} from "@/ui";

export type SignupStep =
  "login" | "profile" | "family" | "as" | "invite" | "code" | "success" | "times" | "questions" | "notify";

export type SignupProps = {
  /** 처음 보일 단계(로그인했지만 가입을 마치지 않았으면 profile) */
  start?: SignupStep;
  loggedIn: boolean;
  loggingIn: boolean;
  loginError: boolean;
  /** 카카오에서 받아 온 이름 */
  kakaoName: string;
  onLogin: () => void;
  onCancelLogin: () => void;
  onDoc: (key: DocKey) => void;
  /** 가입 마무리(이름 · 동의). 성공하면 다음 단계 */
  onSignup: (name: string, agreed: string[]) => Promise<void>;
  issued?: Issued;
  onIssue: (inviteAs: InviteAs, myKind?: Kind) => void;
  onKakaoShare: () => void;
  onCopy: () => void;
  /** 상대가 코드를 넣으면 알림 받기(알림 권한, 6-2). 없으면 그 줄을 숨긴다 */
  onEarlyNotify?: () => void;
  /** 이어진 가족을 부르는 말. 생기면 '이어졌어요'로 간다(보낸 코드를 상대가 넣었을 때) */
  linked?: string;
  /** 받은 코드 확인 결과 */
  lookup?: Lookup;
  onCode: (code: string) => void;
  /** 연결하기. 이어진 가족을 부르는 말과 내가 부모님인지를 돌려준다 */
  onConnect: (code: string) => Promise<{ name: string; parent: boolean }>;
  onTimes: (times: CallTime[]) => void;
  onQuestions: (freq: Freq, avoid: string[]) => void;
  onFinish: (notifyOn: boolean, time: NotifyTime, parent: boolean) => void;
};

const NOTIFY_TIMES = Object.keys(ko.my.notifyTimes) as NotifyTime[];

export function SignupFlow(p: SignupProps) {
  const s = ko.signup;
  const [picked, setStep] = useState<SignupStep>(p.start ?? "login");
  // 보낸 코드를 상대가 넣으면(linked가 생기면) 기다리던 화면은 '이어졌어요'가 된다
  const step: SignupStep = picked === "invite" && p.linked ? "success" : picked;
  // 고치기 전에는 카카오에서 받아 온 이름(로그인한 뒤에 온다)
  const [typed, setName] = useState<string | null>(null);
  const name = typed ?? p.kakaoName;
  const [terms, setTerms] = useState(false);
  // 동의 화면에서 문서를 보러 갔다 오면 동의 화면을 다시 연다(문서는 다른 화면이라 동의 창을 잠깐 닫는다)
  const reopenTerms = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!reopenTerms.current) return;
      reopenTerms.current = false;
      setTerms(true);
    }, []),
  );
  const [relation, setRelation] = useState<InviteAs | undefined>(undefined);
  const [kind, setKind] = useState<Kind | undefined>(undefined);
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState<{ name: string; parent: boolean } | undefined>(undefined);
  const [slots, setSlots] = useState<Slot[]>(() => startSlots([]).map((x, i) => ({ ...x, on: i === 0 })));
  const [freq, setFreq] = useState<Freq>(1);
  const [avoid, setAvoid] = useState<string[]>([]);
  const [notifyOn, setNotifyOn] = useState(true);
  const [time, setTime] = useState<NotifyTime>("19:00");
  const [busy, setBusy] = useState(false);
  // 이름 · 동의로 가입을 마쳤는지. 마친 뒤에는 그 단계로 돌아가지 않는다
  const [joinedApp, setJoinedApp] = useState(false);

  const partner = joined?.name ?? p.linked ?? (relation ? asLabel(relation) : ko.family.someone);
  const parent = joined ? joined.parent : relation === "child";

  const flow: SignupStep[] = [
    "login",
    "profile",
    "family",
    ...(relation === "child" ? (["as"] as const) : []),
    step === "code" ? "code" : "invite",
    "times",
    "questions",
    "notify",
  ];
  const at = flow.indexOf(step);
  const linkedNow = !!joined || !!p.linked;
  // 가입을 마친 뒤에는 이름 · 동의로, 이어진 뒤에는 연결 단계로 돌아가지 않는다
  const showBack =
    step !== "success" &&
    step !== "login" &&
    !(step === "family" && joinedApp) &&
    !(step === "times" && linkedNow);
  const showSkip = step === "times" || step === "questions";
  const big = parent && step !== "code" && step !== "family";

  const back = () => {
    if (step === "profile") return setStep("login");
    if (step === "family") return setStep("profile");
    if (step === "as") return setStep("family");
    if (step === "invite") return setStep(relation === "child" ? "as" : "family");
    if (step === "code") return setStep("family");
    if (step === "questions") return setStep("times");
    if (step === "notify") return setStep("questions");
  };
  const pick = (k: InviteAs) => {
    setRelation(k);
    if (k === "child") return setStep("as");
    setStep("invite");
    p.onIssue(k);
  };

  const body = (() => {
    switch (step) {
      case "login":
        return (
          <>
            <Title text={s.loginTitle} />
            <Sub text={s.loginSub} />
            {p.loggedIn ? (
              <View style={styles.done}>
                <View style={styles.doneMark}>
                  <IcoTick />
                </View>
                <T size={16} weight={700} color={C.accent2Deep}>
                  {s.loginDone}
                </T>
              </View>
            ) : null}
            <View style={styles.well}>
              <T size={15} weight={700} style={styles.wellHead}>
                {s.scopeHead}
              </T>
              <MarkList items={s.scope.filter(([y]) => y).map(([, t]) => t)} shown />
              <MarkList items={s.scope.filter(([y]) => !y).map(([, t]) => t)} shown={false} />
            </View>
          </>
        );
      case "profile":
        return (
          <>
            <Title text={s.nameTitle} />
            <Sub text={name.trim() ? s.nameSubKakao : s.nameSubEmpty} />
            <TextField
              value={name}
              onChangeText={(v) => setName(v.slice(0, 20))}
              label={ko.my.nameLabel}
              placeholder={s.namePlaceholder}
              maxLength={20}
              size={17}
            />
          </>
        );
      case "family":
        return (
          <PickBody
            options={ALL_CHOICES}
            sub={ko.invite.pickSubAll}
            onPick={pick}
            onHaveCode={() => {
              setCode("");
              setStep("code");
            }}
          />
        );
      case "as":
        return <ParentAsBody value={kind} saved={false} onChange={setKind} />;
      case "invite":
        return (
          <InviteShowBody
            who={asLabel(relation ?? "mom")}
            issued={p.issued}
            onKakao={p.onKakaoShare}
            onCopy={p.onCopy}
            extra={
              p.onEarlyNotify ? (
                <View style={styles.early}>
                  <T size={14} lh={1.55} color={C.textSub} style={styles.flex}>
                    {s.earlyBody(asLabel(relation ?? "mom"))}
                  </T>
                  <Pressable accessibilityRole="button" onPress={p.onEarlyNotify} style={styles.earlyButton}>
                    <T size={15} weight={700} color={C.primary}>
                      {s.earlyButton}
                    </T>
                  </Pressable>
                </View>
              ) : undefined
            }
          />
        );
      case "code":
        return (
          <CodeBody
            code={code}
            onChange={(c) => {
              setCode(c);
              p.onCode(c);
            }}
            result={code.length === 6 ? p.lookup : undefined}
          />
        );
      case "success":
        return (
          <View style={styles.success}>
            <View style={styles.bow} aria-hidden>
              <BowMark />
            </View>
            <T size={26} weight={800} ls={-0.04} lh={1.45} align="center" style={styles.successTitle}>
              {s.successTitle(partner)}
            </T>
            <T size={16} lh={1.7} ls={-0.01} color={C.textSub} align="center" style={styles.successBody}>
              {s.successBody}
            </T>
            <View style={styles.full}>
              <Button onPress={() => setStep("times")}>{s.successTimes}</Button>
              <Button
                variant="ghost"
                size={16}
                color={C.textSub}
                onPress={() => p.onFinish(true, "19:00", parent)}
                style={styles.successSkip}
              >
                {s.successSkip}
              </Button>
            </View>
          </View>
        );
      case "times":
        return (
          <>
            <Title text={s.timesTitle} />
            <Sub text={s.timesSub(partner)} gap={24} />
            <TimesEditor slots={slots} onChange={setSlots} />
          </>
        );
      case "questions":
        return (
          <>
            <Title text={s.questionsTitle} />
            <Sub text={s.questionsSub(partner)} gap={24} />
            <T size={15} weight={700} style={styles.secLabel}>
              {s.freqHead}
            </T>
            <View style={styles.freqs}>
              {([1, 2, 3] as const).map((f) => (
                <View key={f} style={styles.flex}>
                  <Option
                    label={ko.my.freqs[f - 1]!}
                    sub={ko.my.freqDays[f - 1]! + (f === 1 ? s.freqBase : "")}
                    selected={freq === f}
                    onPress={() => setFreq(f)}
                  />
                </View>
              ))}
            </View>
            <T size={15} weight={700} style={[styles.secLabel, styles.mt28]}>
              {s.avoidHead}
              <T size={13} color={C.textTertiary}>
                {s.optional}
              </T>
            </T>
            <View style={styles.chips}>
              {AVOID_TOPICS.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  selected={avoid.includes(t)}
                  onPress={() => setAvoid(avoid.includes(t) ? avoid.filter((x) => x !== t) : [...avoid, t])}
                />
              ))}
            </View>
            <T size={14} lh={1.6} color={C.textTertiary} style={styles.mt10}>
              {ko.my.avoidNote(partner)}
            </T>
          </>
        );
      case "notify":
        return (
          <>
            <Title text={s.notifyTitle} />
            <Sub text={s.notifySub} gap={20} />
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: notifyOn }}
              accessibilityLabel={ko.my.notifyOn}
              onPress={() => setNotifyOn(!notifyOn)}
              style={styles.switchRow}
            >
              <View style={styles.flex}>
                <T size={16} weight={600} ls={-0.02}>
                  {ko.my.notifyOn}
                </T>
                <T size={14} color={C.textTertiary} style={styles.mt3}>
                  {ko.my.notifyOnSub}
                </T>
              </View>
              <Toggle display on={notifyOn} />
            </Pressable>
            <Divider />
            <T size={15} weight={700} style={styles.timesHead}>
              {ko.my.notifyTimeHead}
            </T>
            <View style={[styles.grid, !notifyOn && styles.off]} pointerEvents={notifyOn ? "auto" : "none"}>
              {NOTIFY_TIMES.map((t) => (
                <View key={t} style={styles.cell}>
                  <Option label={ko.my.notifyTimes[t]} selected={time === t} onPress={() => setTime(t)} />
                </View>
              ))}
            </View>
            <T size={14} lh={1.6} color={C.textTertiary} style={styles.mt16}>
              {s.notifyNote}
            </T>
            <View style={styles.callBox}>
              <View style={styles.callIcon}>
                <IcoPhone size={18} />
              </View>
              <View style={styles.flex}>
                <T size={16} weight={700} ls={-0.02} style={styles.mb4}>
                  {s.callHead}
                </T>
                <T size={14} lh={1.6} color={C.textSub}>
                  {s.callBody}
                </T>
              </View>
            </View>
          </>
        );
    }
  })();

  const bottom = (() => {
    switch (step) {
      case "login":
        return (
          <>
            {p.loginError ? (
              <T
                size={15}
                lh={1.6}
                color={C.danger}
                align="center"
                style={styles.mb12}
                accessibilityRole="alert"
              >
                {s.loginError}
              </T>
            ) : null}
            {p.loggedIn ? (
              <Button onPress={() => setStep("profile")}>{s.next}</Button>
            ) : (
              <KakaoButton onPress={p.onLogin} />
            )}
          </>
        );
      case "profile":
        return (
          <Button disabled={!name.trim()} onPress={() => setTerms(true)}>
            {s.next}
          </Button>
        );
      case "as":
        return (
          <Button
            disabled={!kind}
            onPress={() => {
              setStep("invite");
              p.onIssue("child", kind);
            }}
          >
            {s.next}
          </Button>
        );
      case "code":
        return (
          <Button
            disabled={busy || code.length !== 6 || !p.lookup?.ok}
            onPress={() => {
              setBusy(true);
              p.onConnect(code)
                .then((j) => {
                  setJoined(j);
                  setStep("success");
                })
                .finally(() => setBusy(false));
            }}
          >
            {ko.invite.connect}
          </Button>
        );
      case "times":
        return (
          <Button
            disabled={!slots.some((x) => x.on)}
            onPress={() => {
              p.onTimes(slots.filter((x) => x.on).map((x) => x.t));
              setStep("questions");
            }}
          >
            {s.next}
          </Button>
        );
      case "questions":
        return (
          <Button
            onPress={() => {
              p.onQuestions(freq, avoid);
              setStep("notify");
            }}
          >
            {s.next}
          </Button>
        );
      case "notify":
        return <Button onPress={() => p.onFinish(notifyOn, time, parent)}>{s.start}</Button>;
      default:
        return null;
    }
  })();

  return (
    <TextScaleProvider scale={big ? BIG_TEXT_SCALE : 1}>
      <Screen>
        {step !== "success" ? (
          <View style={styles.head}>
            <View style={styles.side}>
              {showBack ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={ko.my.back}
                  onPress={back}
                  style={styles.back}
                >
                  <IcoBack />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.progressWrap}>
              {at >= 0 ? (
                <View
                  style={styles.progress}
                  accessibilityRole="progressbar"
                  accessibilityLabel={s.progress(at + 1, flow.length)}
                >
                  <View style={[styles.progressFill, { width: `${((at + 1) / flow.length) * 100}%` }]} />
                </View>
              ) : null}
            </View>
            <View style={[styles.side, styles.sideRight]}>
              {showSkip ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStep(step === "times" ? "questions" : "notify")}
                  style={styles.skip}
                >
                  <T size={16} weight={600} color={C.textSub}>
                    {s.skip}
                  </T>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
        <ScrollView
          contentContainerStyle={step === "success" ? styles.successScroll : styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
        {bottom ? <BottomBar>{bottom}</BottomBar> : null}
        <TermsSheet
          visible={terms}
          onClose={() => setTerms(false)}
          onDoc={(k) => {
            reopenTerms.current = true;
            setTerms(false);
            p.onDoc(k);
          }}
          onAgree={(agreed) => {
            setTerms(false);
            setBusy(true);
            p.onSignup(name.trim(), agreed)
              .then(() => {
                setJoinedApp(true);
                setStep("family");
              })
              // 실패 안내는 onSignup 쪽이 띄운다
              .catch(() => undefined)
              .finally(() => setBusy(false));
          }}
        />
        {p.loggingIn ? <LoginBusy onCancel={p.onCancelLogin} /> : null}
      </Screen>
    </TextScaleProvider>
  );
}

function Title({ text }: { text: string }) {
  return (
    <T size={26} weight={800} ls={-0.04} lh={1.3} style={styles.h2}>
      {text}
    </T>
  );
}

function Sub({ text, gap = 28 }: { text: string; gap?: number }) {
  return (
    <T size={16} lh={1.6} ls={-0.01} color={C.textSub} style={{ marginBottom: gap }}>
      {text}
    </T>
  );
}

/** 카카오 노란 단추 '카카오로 계속하기' */
export function KakaoButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.kakao, pressed && styles.pressed]}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
        <Path
          d="M12 4C7.03 4 3 7.13 3 11c0 2.43 1.6 4.57 4.03 5.83L6.2 20.4l4.14-2.54c.54.07 1.1.11 1.66.11 4.97 0 9-3.13 9-6.97S16.97 4 12 4z"
          fill="#000"
        />
      </Svg>
      <T size={17} weight={700} ls={-0.02} color="rgba(0,0,0,0.85)">
        {ko.signup.kakao}
      </T>
    </Pressable>
  );
}

function Check({ on }: { on: boolean }) {
  return <View style={[styles.check, on && styles.checkOn]}>{on ? <IcoTick size={12} /> : null}</View>;
}

const REQUIRED = ["age14", "terms", "privacy", "ai"] as const;

function TermsSheet({
  visible,
  onClose,
  onDoc,
  onAgree,
}: {
  visible: boolean;
  onClose: () => void;
  onDoc: (key: DocKey) => void;
  onAgree: (agreed: string[]) => void;
}) {
  const s = ko.signup;
  const [on, setOn] = useState<Record<string, boolean>>({});
  const all = REQUIRED.every((k) => on[k]);
  const everything = all && !!on.memo_draft;
  const flip = (k: string) => setOn({ ...on, [k]: !on[k] });
  const row = (k: string, label: string, doc?: DocKey, sub?: string) => (
    <View key={k} style={styles.termRow}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!on[k] }}
        onPress={() => flip(k)}
        style={styles.termTap}
      >
        <Check on={!!on[k]} />
        <View style={styles.flex}>
          <T size={15}>{label}</T>
          {sub ? (
            <T size={13} lh={1.5} color={C.textTertiary} style={styles.mt3}>
              {sub}
            </T>
          ) : null}
        </View>
      </Pressable>
      {doc ? (
        <Pressable accessibilityRole="button" onPress={() => onDoc(doc)} style={styles.view}>
          <T size={14} color={C.textTertiary}>
            {s.view}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
  return (
    <Sheet visible={visible} onClose={onClose}>
      <T size={22} weight={800} lh={1.35} style={styles.termsTitle}>
        {s.termsTitle}
      </T>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: everything }}
        onPress={() => {
          const v = !everything;
          setOn({ age14: v, terms: v, privacy: v, ai: v, memo_draft: v });
        }}
        style={styles.allRow}
      >
        <Check on={everything} />
        <T size={17} weight={700}>
          {s.termsAll}
        </T>
      </Pressable>
      {row("age14", s.age14)}
      {(Object.keys(ko.my.docs) as DocKey[]).map((k) => row(k, ko.my.docs[k], k))}
      {row("memo_draft", s.memoDraft, "ai", s.memoDraftSub)}
      <T size={13} lh={1.6} color={C.textTertiary} style={styles.termsNote}>
        {s.termsNote}
      </T>
      <Button
        disabled={!all}
        onPress={() => onAgree([...REQUIRED, ...(on.memo_draft ? (["memo_draft"] as const) : [])])}
      >
        {s.agree}
      </Button>
    </Sheet>
  );
}

function LoginBusy({ onCancel }: { onCancel: () => void }) {
  const s = ko.signup;
  return (
    <View style={styles.busy} accessibilityRole="progressbar">
      <View style={styles.busyCenter}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === 1 ? C.accent2 : C.primary }]} />
          ))}
        </View>
        <T size={24} weight={800} ls={-0.04} align="center" style={styles.mb12}>
          {s.busyTitle}
        </T>
        <T size={16} lh={1.6} color={C.textSub} align="center">
          {s.busyBody}
        </T>
      </View>
      <BottomBar>
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.busyCancel}>
          <T size={16} weight={600} color={C.textSub}>
            {s.cancel}
          </T>
        </Pressable>
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  full: { alignSelf: "stretch" },
  pressed: { opacity: 0.9 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 36,
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  side: { width: 50, flexDirection: "row" },
  sideRight: { justifyContent: "flex-end" },
  back: {
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 20,
    marginVertical: -4,
    marginLeft: -10,
    marginRight: -14,
  },
  progressWrap: { flex: 1, alignItems: "center" },
  progress: {
    width: "100%",
    maxWidth: 160,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F0EBE5",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2, backgroundColor: C.primary },
  skip: { minHeight: 44, justifyContent: "center", paddingLeft: 12 },
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  h2: { marginBottom: 8 },
  done: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.accent2Light,
    borderRadius: R.sm,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  doneMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accent2,
    alignItems: "center",
    justifyContent: "center",
  },
  well: {
    backgroundColor: C.well,
    borderRadius: R.sm,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  wellHead: { marginBottom: 12 },
  early: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F6F3EF",
    borderRadius: R.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  earlyButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: C.white,
    justifyContent: "center",
  },
  successScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  success: { alignItems: "center", alignSelf: "stretch" },
  bow: { marginBottom: 40 },
  successTitle: { marginBottom: 14 },
  successBody: { marginBottom: 52 },
  successSkip: { marginTop: 14 },
  secLabel: { marginBottom: 12 },
  mt28: { marginTop: 28 },
  mt10: { marginTop: 10 },
  mt16: { marginTop: 16 },
  mt3: { marginTop: 3 },
  mb4: { marginBottom: 4 },
  mb12: { marginBottom: 12 },
  freqs: { flexDirection: "row", gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 18,
  },
  timesHead: { marginTop: 22, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cell: { width: "48%", flexGrow: 1 },
  off: { opacity: 0.45 },
  callBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.well,
    borderRadius: R.sm,
    padding: 16,
    marginTop: 20,
  },
  callIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  kakao: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: C.kakao,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { borderColor: C.primary, backgroundColor: C.primary },
  termsTitle: { marginBottom: 20 },
  allRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    marginBottom: 6,
    borderRadius: R.btn,
    backgroundColor: "#F6F3EF",
  },
  termRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 16, paddingRight: 6 },
  termTap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 11,
  },
  view: { paddingVertical: 12, paddingLeft: 14, paddingRight: 6 },
  termsNote: { marginTop: 10, marginHorizontal: 4, marginBottom: 20 },
  busy: { ...StyleSheet.absoluteFill, backgroundColor: C.bg },
  busyCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  dots: { flexDirection: "row", gap: 8, marginBottom: 28 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  busyCancel: {
    minHeight: 54,
    borderRadius: R.btn,
    backgroundColor: C.plainBg,
    alignItems: "center",
    justifyContent: "center",
  },
});
