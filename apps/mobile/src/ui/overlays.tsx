// 화면 위에 뜨는 것. 시안의 Dialog(확인 창) · 아래 창(시트) · Toast.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "./text";
import { C, R } from "./theme";

/** 확인 창. confirmLabel이 '나가기'면 머무는 쪽(취소)을 채운 단추로 보여 준다(시안과 같음) */
export function Dialog({
  visible,
  title,
  body,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const keep = confirmLabel === "나가기";
  const plain = { bg: C.plainBg, fg: C.textSub, weight: 600 as const };
  const filled = { bg: danger ? C.danger : C.primary, fg: C.white, weight: 700 as const };
  const cancel = keep ? filled : plain;
  const confirm = keep ? plain : filled;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={[StyleSheet.absoluteFill, styles.dim36]}
        onPress={onCancel}
        accessibilityLabel={cancelLabel}
      />
      <View style={styles.dialogWrap} pointerEvents="box-none">
        <View style={styles.dialog} accessibilityViewIsModal>
          <T size={18} weight={800} ls={-0.03} style={styles.dialogTitle} accessibilityRole="header">
            {title}
          </T>
          <T size={15} lh={1.65} color={C.textSub} style={styles.dialogBody}>
            {body}
          </T>
          <View style={styles.dialogButtons}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={[styles.dialogButton, { backgroundColor: cancel.bg }]}
            >
              <T size={15} weight={cancel.weight} color={cancel.fg} align="center">
                {cancelLabel}
              </T>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={[styles.dialogButton, { backgroundColor: confirm.bg }]}
            >
              <T size={15} weight={confirm.weight} color={confirm.fg} align="center">
                {confirmLabel}
              </T>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** 아래에서 올라오는 창. 바깥을 누르면 닫힌다 */
export function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[StyleSheet.absoluteFill, styles.dim32]}
        onPress={onClose}
        accessibilityLabel="닫기"
      />
      <View
        style={[styles.sheet, { paddingBottom: Math.max(44, insets.bottom + 20) }]}
        accessibilityViewIsModal
      >
        <View style={styles.handle} />
        {children}
      </View>
    </Modal>
  );
}

type ToastItem = { message: string; onUndo?: () => void };
const ToastContext = createContext<(message: string, onUndo?: () => void) => void>(() => {});

/** 잠깐 뜨는 알림. 되돌리기가 있으면 조금 더 오래 둔다 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((message: string, onUndo?: () => void) => {
    clearTimeout(timer.current);
    setToast({ message, onUndo });
    timer.current = setTimeout(() => setToast(null), onUndo ? 5000 : 3000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const dismiss = () => setToast(null);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <View style={styles.toastWrap} pointerEvents="box-none">
          <Pressable
            onPress={dismiss}
            accessibilityLiveRegion="polite"
            style={[styles.toast, toast.onUndo ? styles.toastWithUndo : styles.toastPlain]}
          >
            <T size={14} weight={500} lh={1.45} ls={-0.01} color={C.white} style={styles.toastText}>
              {toast.message}
            </T>
            {toast.onUndo ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.onUndo?.();
                  dismiss();
                }}
                style={styles.undo}
              >
                <T size={14} weight={700} color={C.toastAction}>
                  되돌리기
                </T>
              </Pressable>
            ) : null}
          </Pressable>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  dim36: { backgroundColor: "rgba(0,0,0,0.36)" },
  dim32: { backgroundColor: "rgba(0,0,0,0.32)" },
  dialogWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  dialog: {
    backgroundColor: C.white,
    borderRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
  },
  dialogTitle: { marginBottom: 10 },
  dialogBody: { marginBottom: 24 },
  dialogButtons: { flexDirection: "row", gap: 10 },
  dialogButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: R.btn,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: R.sheet,
    borderTopRightRadius: R.sheet,
    paddingTop: 26,
    paddingHorizontal: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginBottom: 22,
  },
  toastWrap: { position: "absolute", bottom: 96, left: 20, right: 20, alignItems: "center" },
  toast: {
    backgroundColor: C.toastBg,
    borderRadius: 12,
    boxShadow: "0 6px 20px rgba(0,0,0,0.16)",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  toastPlain: { paddingVertical: 13, paddingHorizontal: 18 },
  toastWithUndo: { paddingVertical: 6, paddingLeft: 18, paddingRight: 8 },
  toastText: { flexShrink: 1 },
  undo: { minHeight: 44, paddingVertical: 8, paddingHorizontal: 10, justifyContent: "center" },
});
