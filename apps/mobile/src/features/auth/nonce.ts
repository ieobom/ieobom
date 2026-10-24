// 카카오 ID 토큰을 다른 곳에서 다시 쓰지 못하게 하는 일회용 값(nonce).
// 카카오에는 SHA-256으로 바꾼 값을 보내고, 서버(Supabase Auth)에는 원래 값을 보내면 서버가 둘을 맞춰 본다.
import * as Crypto from "expo-crypto";

export async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = Array.from(Crypto.getRandomBytes(16), (b) => b.toString(16).padStart(2, "0")).join("");
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return { raw, hashed };
}
