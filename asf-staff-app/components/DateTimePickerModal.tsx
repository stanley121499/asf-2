import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { WheelPicker } from "@/components/WheelPicker";

// ─── Static picker data ───────────────────────────────────────────────────────
const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => String(THIS_YEAR + i));

function daysInMonth(year: number, month: number): string[] {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

/**
 * Formats a Date as a readable locale string, e.g. "Mon, 21 Apr 2026, 09:00 am".
 */
export function formatPickerDate(d: Date): string {
  return d.toLocaleString("zh-CN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface DateTimePickerModalProps {
  visible: boolean;
  /** Pre-selected date; defaults to now when null. */
  initial: Date | null;
  /** Modal header title. */
  title?: string;
  /** Confirm button label. */
  confirmLabel?: string;
  /** Whether to warn when the picked date is in the past. Defaults to true. */
  warnPast?: boolean;
  onConfirm: (date: Date) => void;
  onClear: () => void;
  onDismiss: () => void;
}

export function DateTimePickerModal({
  visible,
  initial,
  title = "选择日期和时间",
  confirmLabel = "确认",
  warnPast = true,
  onConfirm,
  onClear,
  onDismiss,
}: Readonly<DateTimePickerModalProps>): React.ReactElement {
  const [yearIdx, setYearIdx] = useState(0);
  const [monthIdx, setMonthIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [hourIdx, setHourIdx] = useState(9);
  const [minIdx, setMinIdx] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const d = initial ?? new Date();
    setYearIdx(Math.max(0, YEARS.indexOf(String(d.getFullYear()))));
    setMonthIdx(d.getMonth());
    setDayIdx(d.getDate() - 1);
    setHourIdx(d.getHours());
    setMinIdx(Math.min(11, Math.round(d.getMinutes() / 5)));
  }, [visible, initial]);

  const year = Number(YEARS[yearIdx] ?? THIS_YEAR);
  const days = daysInMonth(year, monthIdx);
  const safeDayIdx = Math.min(dayIdx, days.length - 1);

  const selectedDate = new Date(year, monthIdx, safeDayIdx + 1, hourIdx, minIdx * 5);
  const isPast = warnPast && selectedDate < new Date();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      {/*
       * Root View + absolutely-positioned backdrop Pressable keeps touch events
       * from being intercepted before they reach the WheelPicker FlatLists.
       */}
      <View style={{ flex: 1 }}>
        <Pressable onPress={onDismiss} style={StyleSheet.absoluteFillObject}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} />
        </Pressable>

        {/* Sheet */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: "#D1D5DB",
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#1C1C1E" }}>
              {title}
            </Text>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <Ionicons name="close" size={22} color="#8E8E93" />
            </Pressable>
          </View>

          {/* Pickers */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
              paddingHorizontal: 8,
              gap: 2,
            }}
          >
            <WheelPicker items={days} selectedIndex={safeDayIdx} onChange={setDayIdx} width={52} />
            <WheelPicker items={MONTHS} selectedIndex={monthIdx} onChange={setMonthIdx} width={68} />
            <WheelPicker items={YEARS} selectedIndex={yearIdx} onChange={setYearIdx} width={72} />

            <View style={{ width: 16 }} />

            <WheelPicker items={HOURS} selectedIndex={hourIdx} onChange={setHourIdx} width={52} />
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: "#1C1C1E",
                marginHorizontal: 2,
                marginBottom: 2,
              }}
            >
              :
            </Text>
            <WheelPicker items={MINUTES} selectedIndex={minIdx} onChange={setMinIdx} width={52} />
          </View>

          {/* Past-date warning */}
          {isPast && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#FEF9C3",
                borderRadius: 8,
                padding: 10,
              }}
            >
              <Ionicons name="warning-outline" size={14} color="#A16207" />
              <Text style={{ fontSize: 12, color: "#A16207", flex: 1 }}>
                所选时间已过期。
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16 }}>
            {initial !== null && (
              <Pressable
                onPress={onClear}
                style={{
                  flex: 1,
                  backgroundColor: "#FEF2F2",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#FECACA",
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#EF4444" }}>
                  清除
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => onConfirm(selectedDate)}
              style={{
                flex: initial === null ? 1 : 2,
                backgroundColor: "#000000",
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
