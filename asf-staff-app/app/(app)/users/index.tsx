import { Redirect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useUserContext, type User } from "@/context/UserContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899",
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6",
];

function avatarColor(id: string): string {
  return AVATAR_COLORS[(id.codePointAt(0) ?? 0) % AVATAR_COLORS.length] ?? "#6366F1";
}

function getInitials(user: User): string {
  const f = user.user_detail.first_name?.charAt(0).toUpperCase() ?? "";
  const l = user.user_detail.last_name?.charAt(0).toUpperCase() ?? "";
  const combined = `${f}${l}`.trim();
  return combined.length > 0 ? combined : "?";
}

function getDisplayName(user: User): string {
  const first = user.user_detail.first_name?.trim() ?? "";
  const last = user.user_detail.last_name?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  return full.length > 0 ? full : `用户 ${user.id.substring(0, 8)}`;
}

function roleBadge(role: string): { label: string; bg: string; color: string } {
  switch (role.toUpperCase()) {
    case "ADMIN":
      return { label: "管理员", bg: "#F3E8FF", color: "#7C3AED" };
    case "PREMIUM":
      return { label: "高级会员", bg: "#FDFBF7", color: "#C9A96E" };
    default:
      return { label: "普通用户", bg: "#F3F4F6", color: "#4B5563" };
  }
}

function joinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-CN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({
  item,
  onPress,
}: Readonly<{ item: User; onPress: () => void }>): React.ReactElement {
  const name = getDisplayName(item);
  const initials = getInitials(item);
  const color = avatarColor(item.id);
  const badge = roleBadge(item.user_detail.role ?? "USER");

  const location = [item.user_detail.city, item.user_detail.state]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(", ");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 14,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          backgroundColor: C.panel,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 14,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: color,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
            {initials}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 3 }}>
          {/* Name + role badge */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: C.text, flex: 1 }}
              numberOfLines={1}
            >
              {name}
            </Text>
            <View
              style={{
                backgroundColor: badge.bg,
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: badge.color }}>
                {badge.label}
              </Text>
            </View>
          </View>

          {/* Location + joined */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>
              {location.length > 0 ? location : "暂无地址"}
            </Text>
            <Text style={{ fontSize: 12, color: C.muted }}>
              {joinedDate(item.user_detail.created_at ?? "")}
            </Text>
          </View>

          {/* Lifetime value */}
          {item.user_detail.lifetime_val !== undefined && item.user_detail.lifetime_val > 0 && (
            <Text style={{ fontSize: 12, color: "#15803D", fontWeight: "600" }}>
              {`RM ${item.user_detail.lifetime_val.toFixed(2)} 累计消费`}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function UsersListScreen(): React.ReactElement {
  const router = useRouter();
  const { isEnabled } = useFeatureFlags();
  const { users, loading } = useUserContext();

  if (!isEnabled("user_management")) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (search.trim().length === 0) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      const name = getDisplayName(u).toLowerCase();
      const city = u.user_detail.city?.toLowerCase() ?? "";
      const state = u.user_detail.state?.toLowerCase() ?? "";
      return name.includes(q) || city.includes(q) || state.includes(q);
    });
  }, [users, search]);

  const totalLifetime = useMemo(
    () => users.reduce((sum, u) => sum + (u.user_detail.lifetime_val ?? 0), 0),
    [users]
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: "700", color: C.text, flex: 1 }}>
          用户管理
        </Text>
        <Text style={{ fontSize: 14, color: C.muted }}>
          {users.length}
        </Text>
      </View>

      {/* ── Summary bar ── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          flexDirection: "row",
        }}
      >
        <View style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 14, justifyContent: "center" }}>
          <Text style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            累计消费总额
          </Text>
          <Text
            style={{ fontSize: 24, fontWeight: "700", color: C.text, marginTop: 2 }}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {`RM ${totalLifetime.toFixed(2)}`}
          </Text>
        </View>
        <View style={{ width: 1, backgroundColor: C.border }} />
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              客户总数
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>
              {users.length}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: C.border }} />
          <View style={{ flex: 1, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              高级会员
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>
              {users.filter((u) => u.user_detail.role?.toUpperCase() === "PREMIUM").length}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Search ── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
        <View
          style={{
            backgroundColor: C.panel,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: C.border,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={16} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="按姓名或地址搜索…"
            placeholderTextColor={C.muted}
            style={{ flex: 1, fontSize: 15, color: C.text, paddingVertical: 10 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={C.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── List ── */}
      {loading && users.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <UserCard
              item={item}
              onPress={() => router.push(`/(app)/users/${item.id}` as never)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 10 }}>
              <Ionicons name="people-outline" size={36} color="#9CA3AF" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: C.muted }}>
                {search.length > 0 ? "暂无匹配的用户" : "暂无用户"}
              </Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>
                {search.length > 0 ? "请换个关键词搜索" : "客户注册后将显示在此处"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
