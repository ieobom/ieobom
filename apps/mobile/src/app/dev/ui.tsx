// 개발 확인용: 공통 부품을 한 화면에 모아 39차 시안과 비교한다. 출시 빌드에서는 열리지 않는다.

import { Redirect } from "expo-router";
import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Avatar,
  BIG_TEXT_SCALE,
  Button,
  C,
  Card,
  CardHead,
  Chip,
  Dialog,
  Divider,
  IcoCheck,
  Option,
  RecordRow,
  Sheet,
  SheetHead,
  T,
  TabBar,
  Tag,
  TextScaleProvider,
  Toggle,
  useToast,
  type TabKey,
} from "@/ui";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <T size={13} weight={700} color={C.textTertiary}>
        {title}
      </T>
      {children}
    </View>
  );
}

function Gallery({ big, setBig }: { big: boolean; setBig: (v: boolean) => void }) {
  const toast = useToast();
  const [chip, setChip] = useState("건강");
  const [on, setOn] = useState(true);
  const [option, setOption] = useState(2);
  const [dialog, setDialog] = useState<null | "plain" | "danger" | "leave">(null);
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState<TabKey>("home");

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.row}>
          <T size={22} weight={800} ls={-0.03} style={styles.flex}>
            공통 부품
          </T>
          <T size={14} color={C.textSub}>
            글자 크게
          </T>
          <Toggle on={big} onChange={() => setBig(!big)} label="글자 크게 보기" />
        </View>

        <Section title="버튼">
          <Button onPress={() => toast("저장했어요")}>저장하기</Button>
          <Button disabled>저장하기</Button>
          <Button variant="secondary" icon={<IcoCheck />}>
            확인했어요
          </Button>
          <Button variant="ghost" onPress={() => toast("메모를 지웠어요", () => toast("되돌렸어요"))}>
            나중에 하기
          </Button>
        </Section>

        <Section title="칩 · 꼬리표 · 켜고 끄기">
          <View style={styles.wrap}>
            {["일·학교", "건강", "취미·운동", "+ 직접 쓰기"].map((label) => (
              <Chip key={label} label={label} selected={chip === label} onPress={() => setChip(label)} />
            ))}
          </View>
          <View style={styles.wrap}>
            <Tag>새 질문</Tag>
            <Tag tone="family">엄마</Tag>
            <Tag tone="plain">답 기다림</Tag>
            <Toggle on={on} onChange={() => setOn(!on)} label="통화 메모 초안" />
            <Toggle on={false} display />
          </View>
        </Section>

        <Section title="선택지">
          {[1, 2, 3].map((n) => (
            <Option
              key={n}
              label={`일주일에 ${n}번`}
              sub={n === 1 ? "목요일" : n === 2 ? "월 · 목요일" : "월 · 수 · 금요일"}
              selected={option === n}
              onPress={() => setOption(n)}
              mark
            />
          ))}
        </Section>

        <Section title="카드">
          <Card style={styles.card}>
            <CardHead label="오늘의 질문 #12" tone="primary" right={<Tag tone="family">엄마</Tag>} />
            <T size={20} weight={700} lh={1.45} ls={-0.03}>
              어릴 때 가장 좋아했던 반찬은 뭐예요?
            </T>
          </Card>
          <View style={styles.row}>
            <Avatar />
            <Avatar size={56} bg={C.plainBg} color={C.textTertiary} />
          </View>
        </Section>

        <Section title="기록 줄">
          <RecordRow
            kind="memo"
            meta="10월 12일 · 통화 뒤"
            text="엄마가 이번 주에 병원에 다녀오셨다고 했어요. 결과는 다음 주에 나온대요."
          />
          <RecordRow kind="question" meta="#11 · 둘 다 답함" text="요즘 가장 자주 듣는 노래는 뭐예요?" />
          <RecordRow kind="news" meta="엄마 · 10월 10일" text="뒷산에 단풍이 들기 시작했어" highlight />
        </Section>

        <Section title="창">
          <Button variant="secondary" onPress={() => setDialog("plain")}>
            확인 창
          </Button>
          <Button variant="secondary" onPress={() => setDialog("danger")}>
            지우기 확인 창
          </Button>
          <Button variant="secondary" onPress={() => setDialog("leave")}>
            나가기 확인 창
          </Button>
          <Button variant="secondary" onPress={() => setSheet(true)}>
            아래 창
          </Button>
        </Section>

        <Section title="아래 탭">
          <TabBar active={tab} onTab={setTab} />
        </Section>
        <Divider />
      </ScrollView>

      <Dialog
        visible={dialog !== null}
        title={
          dialog === "leave"
            ? "쓰던 답이 있어요"
            : dialog === "danger"
              ? "메모를 지울까요?"
              : "연결을 끊을까요?"
        }
        body={
          dialog === "leave"
            ? "지금 나가면 쓰던 답이 지워져요."
            : dialog === "danger"
              ? "지운 메모는 되돌릴 수 없어요."
              : "끊어도 지금까지의 기록은 남아요."
        }
        confirmLabel={dialog === "leave" ? "나가기" : dialog === "danger" ? "지우기" : "끊기"}
        danger={dialog === "danger"}
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
      <Sheet visible={sheet} onClose={() => setSheet(false)}>
        <SheetHead kind="memo" label="메모" date="10월 12일 (일)" />
        <T size={16} lh={1.65} color={C.textSub} style={styles.sheetBody}>
          아래 창은 바깥을 누르면 닫혀요.
        </T>
        <Button onPress={() => setSheet(false)}>확인했어요</Button>
      </Sheet>
    </SafeAreaView>
  );
}

export default function UiGallery() {
  const [big, setBig] = useState(false);
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <TextScaleProvider scale={big ? BIG_TEXT_SCALE : 1}>
      <Gallery big={big} setBig={setBig} />
    </TextScaleProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, gap: 28, paddingBottom: 60 },
  section: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  wrap: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  flex: { flex: 1 },
  card: { padding: 20 },
  sheetBody: { marginBottom: 24 },
});
