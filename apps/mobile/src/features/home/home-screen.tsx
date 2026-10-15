// 홈 화면(39차): 머리말 → 공지 → 카드 줄 → 네모 둘(통화 · 질문 만들기).
// 화면은 그리기만 하고, 카드가 무엇이고 어떤 순서인지는 홈 함수(home())가 정한다.
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { Button, C, CARD, IcoChevronRight, IcoPen, IcoPhone, R, Screen, Sheet, T } from "@/ui";
import { CardDeck, type DeckCard } from "./card-deck";
import {
  DraftCard,
  MissedCard,
  NewsCard,
  QuestionCard,
  SoloCard,
  TimingCard,
  type QuestionActions,
} from "./cards";
import { HomeHeader } from "./home-header";
import { partnerLabel } from "./partner";
import type { HomeCard, HomeData, HomeFamily, Talk } from "./types";

export type HomeHandlers = {
  onCall: (family: HomeFamily) => void;
  onMissedOk: (callId: string) => void;
  onNewsOk: (ids: string[]) => void;
  onAnswer: (family: HomeFamily, questionId: string, voice: boolean) => void;
  onChoose: (questionId: string, choice: "send" | "keep") => void;
  onQuestionSeen: (questionId: string) => void;
  onPast: (family: HomeFamily) => void;
  onDraftOpen: (draftId: string) => void;
  onDraftDelete: (draftId: string) => void;
  onMakeQuestion: (family: HomeFamily) => void;
  onCallScreen: (family: HomeFamily) => void;
  onInvite: () => void;
  /** 보내 둔 초대의 코드 보기 */
  onInviteOpen: (inviteAs: "mom" | "dad" | "child") => void;
  onCode: () => void;
  onNoticeOk: (noticeId: string) => void;
};

function cardKey(c: HomeCard): string {
  return c.kind === "question" ? "question" : c.kind;
}

function Tile({
  label,
  sub,
  icon,
  onPress,
}: {
  label: string;
  sub?: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[CARD, styles.tile]}
    >
      <View style={styles.tileIcon}>{icon}</View>
      <View style={styles.flex}>
        <T size={16} weight={700} ls={-0.03}>
          {label}
        </T>
        {sub ? (
          <T size={12.5} ls={-0.03} lh={1.3} color={C.textTertiary} style={styles.tileSub}>
            {sub}
          </T>
        ) : null}
      </View>
    </Pressable>
  );
}

export function HomeScreen({
  data,
  handlers,
  talk,
  startCard,
  now,
  thumbUrl,
}: {
  data: HomeData;
  handlers: HomeHandlers;
  /** 지금 편한 시간 카드의 '이번 통화 때 여쭤볼 이야기'(첫 번째) */
  talk?: (relationshipId: string) => Talk | undefined;
  /** 알림을 누르고 들어오면 그 카드부터 */
  startCard?: string;
  now?: Date;
  thumbUrl?: (path: string) => string | undefined;
}) {
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const families = data.families;
  // 고른 가족 → 이어진 첫 가족 → (이어진 가족이 없으면) 탈퇴로 끊긴 가족
  const family =
    families.find((f) => f.relationship_id === picked) ??
    families.find((f) => f.status === "connected") ??
    families[0];
  // 머리말 가족 고르기에는 이어진 가족만(시안 linkedFams). 이어진 가족이 없으면 이름 · 초대 단추를 두지 않는다
  const options = families
    .filter((f) => f.status === "connected")
    .map((f) => ({ id: f.relationship_id, label: partnerLabel(f) }));
  const parent = family?.my_side === "parent";
  // 자녀는 엄마 · 아빠가 이어졌거나 초대를 보내 두었으면 더 초대할 사람이 없다(그때는 'OO 초대 중').
  // 부모님은 다른 자녀도 초대할 수 있고, 보내 둔 자녀 초대가 있으면 '자녀 초대 중'(기다리는 자녀 초대는 하나뿐)
  const pending = data.pending_invites ?? [];
  const taken = new Set<string>([
    ...families.filter((f) => f.status === "connected").map((f) => f.parent_kind),
    ...pending.map((p) => p.invite_as),
  ]);
  const canInvite =
    options.length > 0 && (parent ? !taken.has("child") : !taken.has("mom") || !taken.has("dad"));
  const firstPending = pending[0];
  const inviting =
    options.length > 0 && firstPending
      ? firstPending.invite_as === "mom"
        ? ko.family.mom
        : firstPending.invite_as === "dad"
          ? ko.family.dad
          : ko.home.child
      : undefined;

  const deck: DeckCard[] = [];
  if (family && family.status === "connected") {
    const partner = partnerLabel(family);
    const qa = (id: string | undefined): QuestionActions => ({
      onAnswer: (voice) => id && handlers.onAnswer(family, id, voice),
      onChoose: (choice) => id && handlers.onChoose(id, choice),
      onSeen: () => id && handlers.onQuestionSeen(id),
      onPast: () => handlers.onPast(family),
    });
    for (const c of family.cards) {
      const node =
        c.kind === "missed_call" ? (
          <MissedCard
            card={c}
            partner={partner}
            onCall={() => handlers.onCall(family)}
            onOk={() => handlers.onMissedOk(c.call_id)}
          />
        ) : c.kind === "free_now" ? (
          <TimingCard
            card={c}
            partner={partner}
            parent={parent}
            talk={talk?.(family.relationship_id)}
            onCall={() => handlers.onCall(family)}
          />
        ) : c.kind === "question" ? (
          <QuestionCard
            card={c}
            partner={partner}
            parent={parent}
            family={family}
            actions={qa(c.question_id)}
          />
        ) : c.kind === "news" ? (
          <NewsCard
            card={c}
            partner={partner}
            parent={parent}
            thumbUrl={thumbUrl}
            onOk={() => handlers.onNewsOk(c.news_ids)}
          />
        ) : c.kind === "memo_draft" ? (
          <DraftCard
            card={c}
            partner={partner}
            onOpen={() => handlers.onDraftOpen(c.draft_id)}
            onDelete={() => handlers.onDraftDelete(c.draft_id)}
          />
        ) : null;
      if (node) deck.push({ key: cardKey(c), node });
    }
  }

  return (
    <Screen>
      <HomeHeader
        family={options.find((o) => o.id === family?.relationship_id)}
        families={options}
        onFamily={setPicked}
        canInvite={canInvite}
        inviting={inviting}
        onInvite={handlers.onInvite}
        onInviting={firstPending ? () => handlers.onInviteOpen(firstPending.invite_as) : undefined}
        now={now}
      />
      <ScrollView contentContainerStyle={styles.body}>
        {data.notice ? (
          <Pressable accessibilityRole="button" onPress={() => setNoticeOpen(true)} style={styles.notice}>
            <T size={13} weight={700} color={C.primary}>
              {ko.home.notice}
            </T>
            <T size={15} weight={600} lh={1.45} style={styles.flex}>
              {data.notice.title}
            </T>
            <IcoChevronRight />
          </Pressable>
        ) : null}
        {!family || family.status === "left" ? (
          <SoloCard
            leftName={family ? partnerLabel(family) : undefined}
            onInvite={handlers.onInvite}
            onCode={handlers.onCode}
          />
        ) : (
          <>
            <CardDeck key={family.relationship_id} cards={deck} parent={parent} startKey={startCard} />
            <View style={styles.tiles}>
              <Tile
                label={ko.home.tiles.call}
                icon={<IcoPhone size={22} />}
                onPress={() => handlers.onCallScreen(family)}
              />
              <Tile
                label={ko.home.tiles.make}
                sub={ko.home.tiles.makeSub}
                icon={<IcoPen />}
                onPress={() => handlers.onMakeQuestion(family)}
              />
            </View>
            {/* '다음 질문' 카드에 이어진 지 며칠이 이미 있으면 다시 쓰지 않는다(시안) */}
            {family.cards.some((c) => c.kind === "question" && c.state === "next") ? null : (
              <T size={14} ls={-0.02} color={C.textTertiary} align="center" style={styles.together}>
                {ko.home.together(partnerLabel(family), family.days_together)}
              </T>
            )}
          </>
        )}
      </ScrollView>
      {data.notice ? (
        <Sheet visible={noticeOpen} onClose={() => setNoticeOpen(false)}>
          <T size={13} weight={700} color={C.primary} style={styles.mb6}>
            {ko.home.notice}
          </T>
          <T size={21} weight={800} ls={-0.04} lh={1.4} style={styles.mb10}>
            {data.notice.title}
          </T>
          <T size={16} lh={1.65} color={C.textSub} style={styles.mb24}>
            {data.notice.body}
          </T>
          {data.notice.note ? (
            <T size={14} lh={1.6} color={C.textTertiary} style={styles.noticeNote}>
              {data.notice.note}
            </T>
          ) : null}
          <Button
            onPress={() => {
              setNoticeOpen(false);
              if (data.notice) handlers.onNoticeOk(data.notice.id);
            }}
          >
            {ko.home.noticeOk}
          </Button>
        </Sheet>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 24 },
  notice: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: R.sm,
    backgroundColor: "#F6F3EF",
  },
  tiles: { flexDirection: "row", gap: 10, marginTop: 12 },
  tile: {
    flex: 1,
    minHeight: 68,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  tileSub: { marginTop: 2 },
  together: { marginTop: 28 },
  mb6: { marginBottom: 6 },
  mb10: { marginBottom: 10 },
  mb24: { marginBottom: 24 },
  noticeNote: { marginTop: 10, marginBottom: 24 },
  noticeOk: {
    minHeight: 54,
    borderRadius: R.btn,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
});
