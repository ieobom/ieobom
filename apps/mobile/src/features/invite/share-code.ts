// 초대 코드 보내기 · 복사 (계획 4-3 전까지). 보내기는 휴대폰의 공유 창을 열어서 카카오톡 등을 고르게 한다.
// 공유 창을 못 여는 곳(일부 웹 브라우저)은 보낼 글을 복사해 두고 알려 준다.
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";
import { ko } from "@/copy/ko";
import { useToast } from "@/ui";

export function useShareCode() {
  const toast = useToast();
  return {
    share: async (code: string | undefined) => {
      if (!code) return;
      const message = ko.invite.shareMessage(code);
      try {
        await Share.share({ message });
      } catch {
        await Clipboard.setStringAsync(message);
        toast(ko.invite.shareCopied);
      }
    },
    copy: async (code: string | undefined) => {
      if (!code) return;
      await Clipboard.setStringAsync(code);
      toast(ko.invite.copied);
    },
  };
}
