import { Redirect, router, useLocalSearchParams } from "expo-router";
import { DOCS } from "@/copy/docs";
import { DocScreen } from "@/features/docs/doc-screen";

// 동의 문서. /doc/terms · /doc/privacy · /doc/ai
export default function DocPage() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const doc = key && key in DOCS ? DOCS[key as keyof typeof DOCS] : undefined;
  if (!doc) return <Redirect href="/" />;
  return <DocScreen doc={doc} onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))} />;
}
