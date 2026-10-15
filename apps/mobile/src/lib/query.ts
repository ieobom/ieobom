// 서버 데이터 불러오기(TanStack Query). 인터넷이 돌아오거나 앱으로 돌아오면 다시 불러온다.
// 저장 · 답 보내기 · 초대 수락 같은 쓰기는 자동으로 다시 보내지 않는다(중복 방지는 DB 함수가 한다).
// 불러오기 · 저장이 실패하면 앱 오류 기록(11-3)에 남긴다. 서버 규칙이 거절한 저장(P0001)은 화면이 안내하므로 빼고.

import NetInfo from "@react-native-community/netinfo";
import { focusManager, MutationCache, onlineManager, QueryCache, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import { reportError } from "./errors";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (e) => reportError("load", e) }),
  mutationCache: new MutationCache({
    onError: (e) => {
      if ((e as { code?: string }).code !== "P0001") reportError("save", e);
    },
  }),
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
    mutations: { retry: 0 },
  },
});

if (Platform.OS !== "web") {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
  );
  focusManager.setEventListener((setFocused) => {
    const sub = AppState.addEventListener("change", (state) => setFocused(state === "active"));
    return () => sub.remove();
  });
}
