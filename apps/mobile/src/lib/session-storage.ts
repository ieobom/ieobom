// 로그인 세션 저장소. SecureStore는 값 하나가 약 2KB를 넘으면 iOS에서 저장이 안 될 수 있는데,
// 카카오 로그인 세션은 그보다 크다. 그래서 세션은 암호화해서 AsyncStorage에 두고,
// 암호 열쇠(32바이트)만 SecureStore에 둔다. 저장할 때마다 열쇠를 새로 만든다.
// 웹(개발 확인용)에는 SecureStore가 없어서 AsyncStorage(localStorage)에 그대로 둔다.

import AsyncStorage from "@react-native-async-storage/async-storage";
import aesjs from "aes-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const keyName = (key: string) => `${key}.key`.replace(/[^A-Za-z0-9._-]/g, "_");

async function encrypt(key: string, value: string): Promise<string> {
  const secret = Crypto.getRandomBytes(32);
  const cipher = new aesjs.ModeOfOperation.ctr(secret, new aesjs.Counter(1));
  const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
  await SecureStore.setItemAsync(keyName(key), aesjs.utils.hex.fromBytes(secret));
  return aesjs.utils.hex.fromBytes(encrypted);
}

async function decrypt(key: string, hex: string): Promise<string | null> {
  const secretHex = await SecureStore.getItemAsync(keyName(key));
  if (!secretHex) return null;
  const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(secretHex), new aesjs.Counter(1));
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(hex)));
}

const nativeStorage = {
  async getItem(key: string): Promise<string | null> {
    const hex = await AsyncStorage.getItem(key);
    return hex ? decrypt(key, hex) : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, await encrypt(key, value));
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(keyName(key));
  },
};

export const sessionStorage = Platform.OS === "web" ? AsyncStorage : nativeStorage;
