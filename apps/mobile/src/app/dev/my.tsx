// 개발 확인용: 마이 화면들을 가짜 데이터로 그려 39차 시안과 나란히 본다. 바꾸면 가짜 데이터가 바뀐다. 출시 빌드에서는 열리지 않는다.
import { Redirect } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { ANSWERED, applyFixture, MY_CASES, SURVEY_QUESTIONS } from "@/features/dev/my-fixtures";
import { partnerLabel } from "@/features/home/partner";
import { FamilyListScreen, FamilySettingsScreen, InviteScreen } from "@/features/my/family-screens";
import { NotifyScreen } from "@/features/my/notify-screen";
import { PrivacyScreen } from "@/features/my/privacy-screen";
import { ScheduleScreen } from "@/features/my/schedule-screen";
import { SettingsScreen } from "@/features/my/settings-screen";
import { SurveyScreen } from "@/features/my/survey-screen";
import type { Inquiry } from "@/features/my/use-help";
import type { MyAction } from "@/features/my/use-my";
import { BIG_TEXT_SCALE, C, Chip, T, TextScaleProvider, useToast } from "@/ui";

const SCREENS = [
  ["my", "마이"],
  ["families", "연결된 가족"],
  ["invite", "초대 코드"],
  ["family", "가족별 설정"],
  ["schedule", "통화 편한 시간"],
  ["notify", "알림 받는 시각"],
  ["privacy", "보이는 정보"],
  ["survey", "설문"],
] as const;
type ScreenKey = (typeof SCREENS)[number][0];

export default function DevMy() {
  const toast = useToast();
  const [caseKey, setCaseKey] = useState(MY_CASES[0]!.key);
  const [data, setData] = useState(MY_CASES[0]!.data);
  const [screen, setScreen] = useState<ScreenKey>("my");
  const [privacyFor, setPrivacyFor] = useState<string | undefined>(undefined);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  if (!__DEV__) return <Redirect href="/" />;

  const act = (a: MyAction, message?: string) => {
    setData((d) => applyFixture(d, a));
    if (message) toast(message);
  };
  const home = () => setScreen("my");
  const say = (what: string) => () => toast(what);
  const family = data.families[0];
  const invite = data.invites[0];
  const nothing = (what: string) => (
    <View style={styles.nothing}>
      <T size={15} color={C.textSub}>
        {what}
      </T>
    </View>
  );

  const body =
    screen === "my" ? (
      <SettingsScreen
        data={data}
        inquiries={inquiries}
        handlers={{
          onSurvey: () => setScreen("survey"),
          onFamilies: () => setScreen("families"),
          onSchedule: () => setScreen("schedule"),
          onNotify: () => setScreen("notify"),
          onPrivacy: () => {
            setPrivacyFor(undefined);
            setScreen("privacy");
          },
          onDoc: (k) => toast(ko.my.docs[k]),
          onHelpOpen: () => {},
          onHelpGo: (go) => {
            if (go === "big") act({ type: "profile", patch: { large_text: true } }, ko.help.bigDone);
            else if (go === "privacy") setScreen("privacy");
            else if (go === "schedule") setScreen("schedule");
            else if (go === "family") setScreen("families");
            else toast("가족 전화 받기 (6-8)");
          },
          onSendInquiry: (body, item) => {
            setInquiries((xs) => [
              {
                id: String(xs.length),
                help_item: item,
                body,
                created_at: new Date().toISOString(),
                answer: null,
                answered_at: null,
                answer_seen_at: null,
              },
              ...xs,
            ]);
            toast(ko.help.sentToast);
          },
          onLogout: say("로그아웃"),
          onWithdraw: say("탈퇴"),
          onRename: (name) => act({ type: "profile", patch: { name } }, ko.my.renamed),
          onMemoDraft: (on) =>
            act({ type: "memo_draft", on }, on ? ko.my.memoDraftTurnedOn : ko.my.memoDraftTurnedOff),
          onBigText: (on) => act({ type: "profile", patch: { large_text: on } }),
        }}
      />
    ) : screen === "families" ? (
      <FamilyListScreen
        data={data}
        onBack={home}
        onFamily={() => setScreen("family")}
        onInviteOpen={() => setScreen("invite")}
        onInvite={say("가족 초대하기")}
        onCode={say("받은 초대 코드 넣기")}
      />
    ) : screen === "invite" ? (
      invite ? (
        <InviteScreen
          invite={invite}
          onBack={() => setScreen("families")}
          onRenew={() => act({ type: "renew_invite", invite_as: invite.invite_as }, ko.my.renewed)}
          onKakao={say("카카오톡으로 보내기")}
          onCopy={say("코드 복사")}
          onCancel={() => {
            act({ type: "cancel_invite", invite: invite.id }, ko.my.canceled);
            setScreen("families");
          }}
        />
      ) : (
        nothing("기다리는 초대가 없어요")
      )
    ) : screen === "family" ? (
      family ? (
        <FamilySettingsScreen
          family={family}
          onBack={() => setScreen("families")}
          onFreq={(freq) => act({ type: "freq", relationship: family.relationship_id, freq })}
          onTopics={(t) => act({ type: "topics", relationship: family.relationship_id, ...t })}
          onPrivacy={() => {
            setPrivacyFor(partnerLabel(family));
            setScreen("privacy");
          }}
          onDisconnect={() => {
            act(
              { type: "end", relationship: family.relationship_id },
              ko.my.disconnected(partnerLabel(family)),
            );
            setScreen("families");
          }}
        />
      ) : (
        nothing("이어진 가족이 없어요")
      )
    ) : screen === "schedule" ? (
      <ScheduleScreen
        saved={data.call_times}
        onBack={home}
        onSave={(times) => {
          act({ type: "call_times", times }, ko.my.saved);
          home();
        }}
      />
    ) : screen === "notify" ? (
      <NotifyScreen
        on={data.me.notify_on}
        time={data.me.notify_time}
        onBack={home}
        onSave={(on, time) => {
          act({ type: "profile", patch: { notify_on: on, notify_time: time } }, ko.my.saved);
          home();
        }}
      />
    ) : screen === "survey" ? (
      data.survey ? (
        <SurveyScreen
          round={data.survey.round}
          questions={SURVEY_QUESTIONS}
          onBack={home}
          onSend={() => {
            setData((d) => ({ ...d, survey: null }));
            toast(ko.survey.sent);
            home();
          }}
        />
      ) : (
        nothing("받을 설문이 없어요")
      )
    ) : (
      <PrivacyScreen family={privacyFor} onBack={home} />
    );

  return (
    <TextScaleProvider scale={data.me.large_text ? BIG_TEXT_SCALE : 1}>
      <View style={styles.root}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bar}
          contentContainerStyle={styles.barRow}
        >
          {MY_CASES.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              selected={c.key === caseKey}
              onPress={() => {
                setCaseKey(c.key);
                setData(c.data);
                setInquiries(c.key === "answered" ? ANSWERED : []);
                setScreen("my");
              }}
            />
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bar}
          contentContainerStyle={styles.barRow}
        >
          {SCREENS.map(([k, label]) => (
            <Chip key={k} label={label} selected={k === screen} onPress={() => setScreen(k)} />
          ))}
        </ScrollView>
        {/* 경우를 바꾸면 화면 안의 고르던 값도 처음부터 */}
        <View style={styles.flex} key={`${caseKey}-${screen}`}>
          {body}
        </View>
      </View>
    </TextScaleProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  bar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: C.border },
  barRow: { gap: 6, padding: 8, alignItems: "center" },
  nothing: { flex: 1, alignItems: "center", justifyContent: "center" },
});
