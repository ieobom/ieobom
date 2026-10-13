// 기능 켜고 끄기(app_config)를 앱을 열 때 한 번 읽어 둔다(계획 1-10).
// 표 값을 바꾸면 앱을 다시 열 때 반영된다. 앱을 오래 켜 두었으면 한 시간마다 앱으로 돌아올 때 다시 읽는다.
// 화면에서 숨기는 것은 보기 좋으라고 하는 것이고, 실제로 막는 것은 서버(feature_enabled)가 한다.

import type { Feature } from "@ieobom/shared";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type Flags = Partial<Record<string, boolean>>;

export function useFeatureFlags() {
  return useQuery({
    queryKey: ["app_config"],
    queryFn: async (): Promise<Flags> => {
      const { data, error } = await supabase.from("app_config").select("key, enabled");
      if (error) throw error;
      return Object.fromEntries(data.map((row) => [row.key, row.enabled]));
    },
    staleTime: 60 * 60 * 1000,
  });
}

/** 기능이 켜졌는지. 읽기 전이나 못 읽었을 때는 켜진 것으로 본다(기본값이 모두 켬) */
export function useFeature(name: Feature): boolean {
  const { data } = useFeatureFlags();
  return data?.[name] ?? true;
}

/** 꺼진 기능은 그리지 않는다 */
export function IfFeature({ name, children }: { name: Feature; children: ReactNode }) {
  return useFeature(name) ? children : null;
}
