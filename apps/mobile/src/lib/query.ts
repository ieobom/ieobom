// 서버 데이터 불러오기(TanStack Query). 인터넷이 돌아오거나 앱으로 돌아오면 다시 불러온다.
// 저장 · 답 보내기 · 초대 수락 같은 쓰기는 자동으로 다시 보내지 않는다(중복 방지는 DB 함수가 한다).

import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

export const queryClient = new QueryClient({
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
