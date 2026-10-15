import { router, useLocalSearchParams } from "expo-router";
import { PrivacyScreen } from "@/features/my/privacy-screen";

// 마이 > 가족에게 보이는 정보. 가족별 설정에서 열면 ?family=엄마
export default function Privacy() {
  const { family } = useLocalSearchParams<{ family?: string }>();
  return <PrivacyScreen family={family} onBack={() => router.back()} />;
}
