// 기록 상세(39차 ArchiveDetailSheet · NewsDetailSheet · AskToggle). 목록과 달력에서 같은 창이 뜬다.
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { seoulParts } from "@/lib/dates";
import { Button, C, Dialog, IcoEdit, IcoTickBig, R, Sheet, SheetHead, T, Tag } from "@/ui";
import { OnlyMe } from "@/features/home/cards";
import { PhotoRow, type ThumbUrl } from "./rows";
import type { RecordItem, TalkRef } from "./types";

function Well({
  who,
  whoColor,
  text,
  muted,
}: {
  who?: string;
  whoColor?: string;
  text: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.well}>
      {who ? (
        <T size={13} weight={600} color={whoColor} style={styles.mb6}>
          {who}
        </T>
      ) : null}
      <T size={16} lh={1.65} color={muted ? C.textTertiary : C.text}>
        {text}
      </T>
    </View>
  );
}

export function AskToggle({
  talk,
  parent,
  onToggle,
}: {
  talk: TalkRef;
  parent: boolean;
  onToggle: () => void;
}) {
  const a = ko.archive;
  const asked = !!talk.asked_on;
  return (
    <View style={styles.ask}>
      <View style={styles.askHead}>
        <T size={14} weight={700} color={C.textSub}>
          {a.talkHead(parent)}
        </T>
        {talk.made_by === "original" ? <Tag tone="plain">{a.fromMemo}</Tag> : <Tag>{a.ai}</Tag>}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ checked: asked }}
        accessibilityLabel={asked ? a.askUndo(parent) : a.asked(parent)}
        onPress={onToggle}
        style={styles.askRow}
      >
        <View style={[styles.check, asked && styles.checkOn]}>{asked ? <IcoTickBig /> : null}</View>
        <View style={styles.flex}>
          <T size={16} lh={1.5} color={asked ? C.textTertiary : C.text}>
            {talk.text}
          </T>
          <T
            size={13}
            weight={asked ? 600 : 400}
            color={asked ? C.accent2Deep : C.textTertiary}
            style={styles.mt3}
          >
            {asked && talk.asked_on
              ? a.askedOn(ko.time.date(seoulParts(talk.asked_on)), parent)
              : a.askHint(parent)}
          </T>
        </View>
      </Pressable>
    </View>
  );
}

export type DetailActions = {
  onAsk: (talk: TalkRef) => void;
  onEditMemo: (memoId: string) => void;
  onDeleteMemo: (memoId: string) => void;
  onDeleteNews: (newsId: string) => void;
  onRetryTalk: (memoId: string) => void;
};

export function RecordDetail({
  item,
  partner,
  parent,
  thumbUrl,
  actions,
  onClose,
}: {
  item: RecordItem | null;
  partner: string;
  parent: boolean;
  thumbUrl?: ThumbUrl;
  actions: DetailActions;
  onClose: () => void;
}) {
  const [ask, setAsk] = useState(false);
  const a = ko.archive;
  if (!item) return null;
  const date = ko.time.dateDay(seoulParts(item.at));

  let body;
  if (item.kind === "question") {
    const made =
      item.made_by === "me" ? a.madeMe : item.made_by === "partner" ? a.madePartner(partner) : a.madeAi;
    body = (
      <>
        <SheetHead
          kind="question"
          label={ko.kind.question}
          date={date}
          right={<Tag tone={item.made_by === "ai" ? "primary" : "family"}>{made}</Tag>}
        />
        <T size={18} weight={700} ls={-0.03} lh={1.5} style={styles.mb14}>
          {item.text}
        </T>
        {item.partner_answer ? (
          <Well who={partner} whoColor={C.accent2Deep} text={item.partner_answer} />
        ) : (
          <T size={14} lh={1.6} color={C.textTertiary} style={styles.note}>
            {item.status === "sent_first" ? a.sentFirstLine(partner) : a.endedLine}
          </T>
        )}
        {item.my_answer ? (
          <View style={styles.mt8}>
            <Well who={a.me} whoColor={C.primary} text={item.my_answer} />
          </View>
        ) : item.status === "their_first" ? (
          <T size={14} lh={1.6} color={C.textTertiary} style={styles.note}>
            {a.theirFirstLine(partner)}
          </T>
        ) : null}
        <View style={styles.mt20}>
          <Button variant="secondary" onPress={onClose}>
            {a.close}
          </Button>
        </View>
      </>
    );
  } else if (item.kind === "memo") {
    body = (
      <>
        <SheetHead
          kind="memo"
          label={item.mood ? `${ko.kind.memo} · ${ko.mood[item.mood]}` : ko.kind.memo}
          date={date}
          right={<OnlyMe />}
        />
        <Well text={item.text || a.moodOnly} muted={!item.text} />
        {item.talk ? (
          <AskToggle
            talk={item.talk}
            parent={parent}
            onToggle={() => item.talk && actions.onAsk(item.talk)}
          />
        ) : item.suggest_status === "failed" ? (
          <View style={styles.ask}>
            <View style={styles.askHead}>
              <T size={14} weight={700} color={C.textSub}>
                {a.talkHead(parent)}
              </T>
              <Tag>{a.ai}</Tag>
            </View>
            <T size={15} lh={1.6} color={C.textTertiary} style={styles.retryText}>
              {a.talkFailed}
            </T>
            <Button variant="secondary" onPress={() => actions.onRetryTalk(item.id)}>
              {a.talkRetry}
            </Button>
          </View>
        ) : item.suggest_status === "making" ? (
          <View style={styles.ask}>
            <T size={15} lh={1.6} color={C.textTertiary}>
              {a.talkMaking}
            </T>
          </View>
        ) : null}
        <View style={styles.memoButtons}>
          <View style={styles.row}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.half, styles.plain]}>
              <T size={16} weight={600} color={C.textSub}>
                {a.close}
              </T>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => actions.onEditMemo(item.id)}
              style={[styles.half, styles.soft]}
            >
              <IcoEdit />
              <T size={16} weight={600} color={C.primary}>
                {a.editMemo}
              </T>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setAsk(true)} style={styles.danger}>
            <T size={15} weight={500} color={C.danger}>
              {a.deleteMemo}
            </T>
          </Pressable>
        </View>
      </>
    );
  } else {
    body = (
      <>
        <SheetHead
          kind="news"
          label={item.mine ? a.myNews : a.partnerNews(partner)}
          date={date}
          right={
            item.mine ? (
              <T size={13} color={C.textTertiary}>
                {a.sentTo(partner)}
              </T>
            ) : item.curious ? (
              <Tag tone="family">{a.curious}</Tag>
            ) : undefined
          }
        />
        <View style={styles.well}>
          {item.text ? (
            <T size={16} lh={1.65}>
              {item.text}
            </T>
          ) : null}
          {item.photos.length > 0 ? (
            <View style={styles.mt12}>
              <PhotoRow paths={item.photos.map((p) => p.thumb)} size={88} thumbUrl={thumbUrl} />
            </View>
          ) : null}
        </View>
        {!item.mine && item.talk ? (
          <AskToggle
            talk={item.talk}
            parent={parent}
            onToggle={() => item.talk && actions.onAsk(item.talk)}
          />
        ) : null}
        <View style={styles.newsButtons}>
          <Button variant="secondary" onPress={onClose}>
            {a.close}
          </Button>
          {item.mine ? (
            <Pressable accessibilityRole="button" onPress={() => setAsk(true)} style={styles.danger}>
              <T size={15} weight={500} color={C.danger}>
                {a.deleteNews}
              </T>
            </Pressable>
          ) : null}
        </View>
      </>
    );
  }

  // 아이폰은 창 위에 창을 띄울 때 안쪽에서 띄워야 해서 확인 창을 아래 창 안에 둔다
  return (
    <Sheet visible onClose={onClose}>
      {body}
      <Dialog
        visible={ask}
        title={item.kind === "news" ? a.deleteNewsTitle : a.deleteMemoTitle}
        body={item.kind === "news" ? a.deleteNewsBody(partner) : a.deleteMemoBody}
        confirmLabel={a.remove}
        danger
        onConfirm={() => {
          setAsk(false);
          if (item.kind === "news") actions.onDeleteNews(item.id);
          else actions.onDeleteMemo(item.id);
          onClose();
        }}
        onCancel={() => setAsk(false)}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", gap: 10 },
  well: { backgroundColor: C.well, borderRadius: R.sm, paddingVertical: 14, paddingHorizontal: 16 },
  mb6: { marginBottom: 6 },
  mb14: { marginBottom: 14 },
  mt3: { marginTop: 3 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt20: { marginTop: 20 },
  note: { marginHorizontal: 2, marginBottom: 8, marginTop: 4 },
  ask: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16, marginTop: 18 },
  askHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  askRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingTop: 12, paddingBottom: 4 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkOn: { borderColor: C.accent2, backgroundColor: C.accent2 },
  retryText: { paddingTop: 6, paddingBottom: 10 },
  memoButtons: { gap: 8, marginTop: 20 },
  newsButtons: { gap: 8, marginTop: 20 },
  half: {
    flex: 1,
    minHeight: 54,
    borderRadius: R.btn,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  plain: { backgroundColor: C.plainBg },
  soft: { backgroundColor: C.surface2 },
  danger: { minHeight: 44, alignItems: "center", justifyContent: "center" },
});
