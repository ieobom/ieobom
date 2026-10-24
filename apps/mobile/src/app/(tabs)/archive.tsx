import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ko } from "@/copy/ko";
import { ArchiveScreen, type ArchiveMode } from "@/features/archive/archive-screen";
import type { YM } from "@/features/archive/calendar";
import type { Filter } from "@/features/archive/types";
import { useCalendar, useDayRecords, useRecordAction, useRecords } from "@/features/archive/use-records";
import { partnerLabel } from "@/features/home/partner";
import { useHome } from "@/features/home/use-home";
import { seoulParts } from "@/lib/dates";
import { useSession } from "@/lib/session";
import { Placeholder, useToast } from "@/ui";

const MODE_KEY = "archive.view";
const FILTERS: Filter[] = ["all", "memo", "question", "news"];
const pad = (n: number) => String(n).padStart(2, "0");

// 기록. 홈의 '지난 질문 보기'는 ?kind=question&family=연결ID로 연다
export default function Archive() {
  const session = useSession();
  const params = useLocalSearchParams<{ kind?: string; family?: string }>();
  if (session === undefined) return null;
  if (!session) return <Placeholder title={ko.tabs.archive} body={ko.app.signedOut} />;
  // 다른 걸러 보기로 열면 처음부터 다시 그린다
  return (
    <SignedInArchive
      key={`${params.kind}-${params.family}`}
      userId={session.user.id}
      kind={params.kind}
      family={params.family}
    />
  );
}

function SignedInArchive({
  userId,
  kind,
  family: familyParam,
}: {
  userId: string;
  kind?: string;
  family?: string;
}) {
  const toast = useToast();
  const home = useHome(userId);
  const act = useRecordAction(userId);
  const families = home.data?.families ?? [];
  const [picked, setPicked] = useState(familyParam);
  const family =
    families.find((f) => f.relationship_id === picked) ??
    families.find((f) => f.status === "connected") ??
    families[0];
  const [filter, setFilter] = useState<Filter>(FILTERS.includes(kind as Filter) ? (kind as Filter) : "all");
  const [mode, setMode] = useState<ArchiveMode>("list");
  useEffect(() => {
    // 마지막에 본 방식(목록 · 달력)을 기억한다. 못 읽으면 목록
    AsyncStorage.getItem(MODE_KEY)
      .then((v) => (v === "cal" || v === "list") && setMode(v))
      .catch(() => {});
  }, []);
  const pickMode = (m: ArchiveMode) => {
    setMode(m);
    AsyncStorage.setItem(MODE_KEY, m).catch(() => {});
  };

  const now = seoulParts(new Date());
  const today = { y: now.year, m: now.month, d: now.day };
  const [view, setView] = useState<YM>({ y: today.y, m: today.m });
  const [day, setDay] = useState<string | undefined>(undefined);
  const rel = family?.relationship_id;
  const records = useRecords(userId, rel, filter);
  const cal = useCalendar(userId, rel, `${view.y}-${pad(view.m)}-01`);
  const thisMonth = view.y === today.y && view.m === today.m;
  const marked = Object.keys(cal.data?.days ?? {}).sort();
  const selected =
    day ?? (thisMonth ? `${today.y}-${pad(today.m)}-${pad(today.d)}` : marked[marked.length - 1]);
  const dayRecords = useDayRecords(userId, rel, selected);

  if (!home.data) return null;
  const partner = family ? partnerLabel(family) : "";
  return (
    <ArchiveScreen
      state={!family ? "none" : family.status === "left" ? "left" : "connected"}
      partner={partner}
      parent={family?.my_side === "parent"}
      families={families
        .filter((f) => f.status === "connected")
        .map((f) => ({ id: f.relationship_id, label: partnerLabel(f) }))}
      familyId={rel}
      onFamily={setPicked}
      filter={filter}
      onFilter={setFilter}
      mode={mode}
      onMode={pickMode}
      items={records.data?.pages.flat() ?? []}
      onMore={() => records.hasNextPage && !records.isFetchingNextPage && records.fetchNextPage()}
      calendar={{
        view,
        today,
        data: cal.data,
        selected,
        onSelect: setDay,
        onMove: (step) => {
          setDay(undefined);
          const m = view.m - 1 + step;
          setView({ y: view.y + Math.floor(m / 12), m: (((m % 12) + 12) % 12) + 1 });
        },
        dayItems: (dayRecords.data ?? []).filter((i) => filter === "all" || i.kind === filter),
      }}
      actions={{
        onAsk: (talk) =>
          rel && act.mutate({ type: "ask", relationship: rel, suggestion: talk.id, asked: !!talk.asked_on }),
        onDeleteMemo: (memo) =>
          act.mutate({ type: "delete_memo", memo }, { onSuccess: () => toast(ko.archive.memoDeleted) }),
        onDeleteNews: (news) =>
          act.mutate({ type: "delete_news", news }, { onSuccess: () => toast(ko.archive.newsDeleted) }),
        onOpenNews: (item) => act.mutate({ type: "see_news", news: item.id }),
        onEditMemo: (memo) => router.push({ pathname: "/memo", params: { edit: memo } }),
        // 이야기 다시 만들기(7-9, AI)는 아직 없다
      }}
      onInvite={() => router.push("/invite")}
      onCode={() => router.push("/invite/code")}
    />
  );
}
