import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthContext } from "@/context/AuthContext";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

function isNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Menu row with icon, label, optional badge, and chevron */
interface MenuRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  borderBottom?: boolean;
  badge?: string;
}
function MenuRow({ icon, label, onPress, borderBottom = true, badge }: MenuRowProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: borderBottom ? 1 : 0,
        borderBottomColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.text} style={{ opacity: 0.7 }} />
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: colors.text, fontFamily: "Inter_400Regular" }}>
        {label}
      </Text>
      {badge !== undefined && (
        <View style={{ backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 2 }}>
          <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular" }}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </TouchableOpacity>
  );
}

/**
 * Profile hub (我的) — matches web settings/page.tsx:
 *   - Sticky 56px "个人中心" header
 *   - Profile card: avatar circle + name + email + points pill
 *   - Menu list: 订单, 收藏, 奖励, 账户设置 (accordion), 联系客服
 *   - "退出登录" muted text at bottom
 */
export default function ProfileIndexScreen(): React.ReactElement {
  const router = useRouter();
  const { user, user_detail, signOut, loading } = useAuthContext();
  const pointsAPI = usePointsMembership();

  const [userPoints, setUserPoints] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    if (isNonEmpty(user_detail?.first_name)) setFirstName(String(user_detail?.first_name));
    if (isNonEmpty(user_detail?.last_name)) setLastName(String(user_detail?.last_name));
    const meta = (user?.user_metadata as Record<string, unknown> | undefined) ?? {};
    if (isNonEmpty(meta["phone"])) setPhone(String(meta["phone"]));
  }, [user, user_detail]);

  useEffect(() => {
    if (user?.id) {
      void pointsAPI.getUserPointsByUserId(user.id).then((r) => setUserPoints(r?.amount ?? 0));
    }
  }, [user, pointsAPI]);

  const displayName = useMemo(() => {
    const joined = `${firstName} ${lastName}`.trim();
    return joined.length > 0 ? joined : (user?.email ?? "用户");
  }, [firstName, lastName, user?.email]);

  const handleSaveProfile = async (): Promise<void> => {
    if (user === null || !isNonEmpty(firstName) || !isNonEmpty(lastName)) return;
    setSaving(true);
    try {
      await supabase.from("user_details").update({ first_name: firstName, last_name: lastName }).eq("id", user.id);
      await supabase.auth.updateUser({ data: { display_name: `${firstName} ${lastName}`.trim(), first_name: firstName, last_name: lastName, phone } });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    await signOut();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  /** Not signed in */
  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Header */}
        <View style={{ height: 56, alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: "#FFFFFF" }}>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 18, color: colors.text }}>个人中心</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Ionicons name="person-circle-outline" size={96} color={colors.border} style={{ marginBottom: 24 }} />
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text, marginBottom: 8 }}>登录以查看个人资料</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 32 }}>管理账户、查看订单并享受会员特权</Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/sign-in")}
            style={{ width: "100%", maxWidth: 320, height: 52, backgroundColor: "#000000", borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_400Regular" }}>登录 / 注册</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/")}
            style={{ width: "100%", maxWidth: 320, height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>先逛逛，暂不登录</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Sticky header */}
      <View style={{ height: 56, alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: "#FFFFFF" }}>
        <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 18, color: colors.text }}>个人中心</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* ── Profile card ── */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: 24,
            alignItems: "center",
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.panel,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="person-outline" size={36} color={colors.muted} />
          </View>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text }}>{displayName}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, fontFamily: "Inter_400Regular" }}>{user.email ?? ""}</Text>

          {/* Points badge */}
          <View
            style={{
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: colors.panel,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 99,
              paddingHorizontal: 16,
              paddingVertical: 6,
            }}
          >
            <Ionicons name="star-outline" size={14} color={colors.accent} />
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text, fontFamily: "Inter_400Regular" }}>
              积分: {userPoints.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* ── Menu list ── */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 32,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <MenuRow icon="bag-outline" label="我的订单" onPress={() => router.push("/(tabs)/profile/orders")} />
          <MenuRow icon="heart-outline" label="我的收藏" onPress={() => router.push("/wishlist")} />
          <MenuRow icon="star-outline" label="我的奖励" onPress={() => router.push("/(tabs)/profile/rewards")} />

          {/* 账户设置 — accordion */}
          <TouchableOpacity
            onPress={() => setAccountOpen((o) => !o)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: accountOpen ? 1 : 1,
              borderBottomColor: colors.border,
            }}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} style={{ opacity: 0.7 }} />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: colors.text, fontFamily: "Inter_400Regular" }}>账户设置</Text>
            <Ionicons name={accountOpen ? "chevron-down" : "chevron-forward"} size={16} color={colors.muted} />
          </TouchableOpacity>

          {accountOpen && (
            <View style={{ backgroundColor: colors.panel, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4, fontFamily: "Inter_400Regular" }}>名</Text>
                  <TextInput
                    style={{ height: 40, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: colors.text, fontFamily: "Inter_400Regular" }}
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={!saving}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4, fontFamily: "Inter_400Regular" }}>姓</Text>
                  <TextInput
                    style={{ height: 40, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: colors.text, fontFamily: "Inter_400Regular" }}
                    value={lastName}
                    onChangeText={setLastName}
                    editable={!saving}
                  />
                </View>
              </View>
              <View>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4, fontFamily: "Inter_400Regular" }}>联系电话</Text>
                <TextInput
                  style={{ height: 40, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: colors.text, fontFamily: "Inter_400Regular" }}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!saving}
                />
              </View>
              <TouchableOpacity
                onPress={() => void handleSaveProfile()}
                disabled={saving}
                style={{ height: 40, backgroundColor: "#000000", borderRadius: 8, alignItems: "center", justifyContent: "center", opacity: saving ? 0.5 : 1 }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500", fontFamily: "Inter_400Regular" }}>保存更改</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <MenuRow icon="chatbubble-ellipses-outline" label="联系客服" onPress={() => router.push("/(tabs)/profile/support")} borderBottom={false} />
        </View>

        {/* Sign out */}
        <TouchableOpacity onPress={() => void handleLogout()} style={{ alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.muted, letterSpacing: 0.5, fontFamily: "Inter_400Regular" }}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
