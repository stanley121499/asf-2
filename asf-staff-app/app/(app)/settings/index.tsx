import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { StaffRole } from "@/constants/roles";
import { useAuthContext } from "@/context/AuthContext";
import { useStaffRole } from "@/context/StaffRoleContext";
import { supabase } from "@/lib/supabase";

// ─── Design tokens — matches orders / products pages ─────────────────────────

const C = {
  bg: "#F2F2F7",
  panel: "#FFFFFF",
  border: "#E5E7EB",
  text: "#1A1A1A",
  muted: "#6B7280",
  accent: "#000000",
  danger: "#EF4444",
  dangerTint: "#FEE2E2",
  success: "#22C55E",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives up-to-two initials from name parts or falls back to the first
 * character of the email address.
 */
function deriveInitials(
  firstName: string,
  lastName: string,
  email: string
): string {
  const f = firstName.trim();
  const l = lastName.trim();
  if (f.length > 0 && l.length > 0) return `${f[0]}${l[0]}`.toUpperCase();
  if (f.length > 0) return f[0].toUpperCase();
  return (email.trim()[0] ?? "?").toUpperCase();
}

/** Maps the DB role slug to a Chinese display label. */
function roleDisplayLabel(role: StaffRole | null): string {
  if (role === null) return "—";
  const map: Record<StaffRole, string> = {
    owner:     "总监",
    manager:   "经理",
    staff:     "员工",
    warehouse: "仓管",
    support:   "客服",
  };
  return map[role];
}

/** Returns background + text colours for the role badge. */
function roleBadgeColors(role: StaffRole | null): { bg: string; text: string } {
  switch (role) {
    case "owner":   return { bg: "#FFF4E5", text: "#B45309" };
    case "manager": return { bg: "#DBEAFE", text: "#1D4ED8" };
    default:        return { bg: "#F3F4F6", text: "#374151" };
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

/**
 * Staff settings screen.
 *
 * Layout:
 *   1. Sticky header
 *   2. Profile card — avatar initials, name, email, role badge
 *   3. Edit profile — first / last name + save
 *   4. Account — sign-out row
 */
export default function SettingsScreen(): React.ReactElement {
  const router = useRouter();
  const { user, user_detail, signOut } = useAuthContext();
  const { role } = useStaffRole();

  const [firstName, setFirstName] = useState(
    typeof user_detail?.first_name === "string" ? user_detail.first_name : ""
  );
  const [lastName, setLastName] = useState(
    typeof user_detail?.last_name === "string" ? user_detail.last_name : ""
  );
  const [busy, setBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const email = typeof user?.email === "string" ? user.email : "—";
  const initials = deriveInitials(firstName, lastName, email);
  const displayName =
    `${firstName.trim()} ${lastName.trim()}`.trim().length > 0
      ? `${firstName.trim()} ${lastName.trim()}`.trim()
      : email;
  const badgeColors = roleBadgeColors(role);

  const saveName = async (): Promise<void> => {
    if (typeof user?.id !== "string") return;
    setBusy(true);
    setSaveStatus("idle");
    try {
      const { error } = await supabase
        .from("user_details")
        .update({
          first_name: firstName.trim().length > 0 ? firstName.trim() : null,
          last_name:  lastName.trim().length > 0  ? lastName.trim()  : null,
        })
        .eq("id", user.id);
      setSaveStatus(error ? "error" : "saved");
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = async (): Promise<void> => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>
          设置
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Profile card ─────────────────────────────────────────────────── */}
        <Text style={{ fontSize: 12, fontWeight: "500", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, marginTop: 20, marginBottom: 8 }}>
          我的账号
        </Text>
        <View
          style={{
            backgroundColor: C.panel,
            borderRadius: 12,
            marginHorizontal: 16,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 14 }}>
            {/* Avatar circle with initials */}
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: C.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>
                {initials}
              </Text>
            </View>

            {/* Name + email */}
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: C.text, marginBottom: 2 }}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text style={{ fontSize: 13, color: C.muted }} numberOfLines={1}>
                {email}
              </Text>
            </View>

            {/* Role badge */}
            <View
              style={{
                backgroundColor: badgeColors.bg,
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: badgeColors.text }}>
                {roleDisplayLabel(role)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Edit profile ─────────────────────────────────────────────────── */}
        <Text style={{ fontSize: 12, fontWeight: "500", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, marginTop: 24, marginBottom: 8 }}>
          编辑资料
        </Text>

        {/* Form fields grouped in a card — clearly inputs, not actions */}
        <View
          style={{
            backgroundColor: C.panel,
            borderRadius: 12,
            marginHorizontal: 16,
            borderWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          {/* 名 row */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
            <Text style={{ fontSize: 15, color: C.muted, width: 28 }}>名</Text>
            <TextInput
              value={firstName}
              onChangeText={(v) => { setFirstName(v); setSaveStatus("idle"); }}
              placeholder="未设置"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </View>

          <View style={{ height: 1, backgroundColor: C.border, marginLeft: 16 }} />

          {/* 姓 row */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
            <Text style={{ fontSize: 15, color: C.muted, width: 28 }}>姓</Text>
            <TextInput
              value={lastName}
              onChangeText={(v) => { setLastName(v); setSaveStatus("idle"); }}
              placeholder="未设置"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </View>
        </View>

        {/* Save feedback — shown between the card and the button */}
        {saveStatus !== "idle" && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 16, marginTop: 8 }}>
            <Ionicons
              name={saveStatus === "saved" ? "checkmark-circle" : "alert-circle"}
              size={15}
              color={saveStatus === "saved" ? C.success : C.danger}
            />
            <Text style={{ fontSize: 13, color: saveStatus === "saved" ? C.success : C.danger }}>
              {saveStatus === "saved" ? "已保存" : "保存失败，请重试"}
            </Text>
          </View>
        )}

        {/* Save button — unmistakably a button, not a row */}
        <Pressable
          disabled={busy}
          onPress={() => void saveName()}
          style={({ pressed }) => ({ opacity: pressed || busy ? 0.7 : 1 })}
        >
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              height: 52,
              borderRadius: 12,
              backgroundColor: "#000000",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.2 }}>
                  保存姓名
                </Text>
              </>
            )}
          </View>
        </Pressable>

        {/* ── Account / danger zone ─────────────────────────────────────────── */}
        <Text style={{ fontSize: 12, fontWeight: "500", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, marginTop: 24, marginBottom: 8 }}>
          账号
        </Text>
        <View
          style={{
            backgroundColor: C.panel,
            borderRadius: 12,
            marginHorizontal: 16,
            borderWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <Pressable
            onPress={() => void onSignOut()}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            {/* Row layout inside a View — more reliable than flexDirection on Pressable */}
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: C.dangerTint,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="log-out-outline" size={18} color={C.danger} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: "500", color: C.danger }}>
                退出登录
              </Text>
              <Ionicons name="chevron-forward" size={16} color={C.muted} />
            </View>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
