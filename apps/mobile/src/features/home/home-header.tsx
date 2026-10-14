// 홈 맨 위(39차 HomeHeader · FamilyPicker): '이어봄' 글자와 오늘 날짜, 가족 고르기, 초대.
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { ko } from "@/copy/ko";
import { seoulParts } from "@/lib/dates";
import { C, IcoChevronDown, IcoChevronRight, IcoPlus, T, WORDMARK } from "@/ui";

export type FamilyOption = { id: string; label: string };

function FamilyPicker({
  value,
  options,
  onChange,
}: {
  value: FamilyOption;
  options: FamilyOption[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const one = options.length < 2;
  const title = (
    <T size={24} weight={800} ls={-0.03}>
      {value.label}
    </T>
  );
  if (one) return <View style={styles.picker}>{title}</View>;
  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={styles.picker}>
        {title}
        <IcoChevronDown />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
          accessibilityLabel={ko.common.close}
        />
        <View style={styles.menu}>
          {options.map((o) => {
            const on = o.id === value.id;
            return (
              <Pressable
                key={o.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                style={[styles.menuItem, on && styles.menuOn]}
              >
                <T size={17} weight={on ? 700 : 500} ls={-0.02} color={on ? C.primary : C.text}>
                  {o.label}
                </T>
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

export function HomeHeader({
  family,
  families,
  onFamily,
  canInvite,
  inviting,
  onInvite,
  now = new Date(),
}: {
  family?: FamilyOption;
  families: FamilyOption[];
  onFamily: (id: string) => void;
  canInvite: boolean;
  /** 더 초대할 사람이 없고 보내 둔 초대가 있으면 '아빠 초대 중' */
  inviting?: string;
  onInvite: () => void;
  now?: Date;
}) {
  return (
    <View style={styles.head}>
      <View style={styles.top}>
        <T size={24} ls={-0.02} color={C.primary} style={{ fontFamily: WORDMARK }}>
          {ko.appName}
        </T>
        <T size={13} ls={-0.01} color={C.textTertiary}>
          {ko.time.dateDay(seoulParts(now))}
        </T>
      </View>
      <View style={styles.row}>
        {family ? <FamilyPicker value={family} options={families} onChange={onFamily} /> : null}
        {canInvite ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ko.home.inviteLabel}
            onPress={onInvite}
            style={styles.invite}
          >
            <IcoPlus />
            <T size={15} weight={600} color={C.textSub}>
              {ko.home.invite}
            </T>
          </Pressable>
        ) : inviting ? (
          <Pressable accessibilityRole="button" onPress={onInvite} style={styles.invite}>
            <T size={15} weight={600} color={C.textSub}>
              {ko.home.inviting(inviting)}
            </T>
            <IcoChevronRight color={C.textSub} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: 14, paddingHorizontal: 24, paddingBottom: 6 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  row: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  picker: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  invite: {
    minHeight: 44,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 22,
    backgroundColor: C.plainBg,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  menu: {
    position: "absolute",
    top: 140,
    left: 24,
    minWidth: 180,
    backgroundColor: C.white,
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.12)",
  },
  menuItem: { paddingVertical: 14, paddingHorizontal: 20, backgroundColor: C.white },
  menuOn: { backgroundColor: C.primaryLight },
});
