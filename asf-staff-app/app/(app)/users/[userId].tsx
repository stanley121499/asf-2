import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useUserContext, type User } from "@/context/UserContext";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import type { Tables } from "@/database.types";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
} as const;

type UserPointsLog = Tables<"user_points_logs">;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899",
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6",
];

function avatarColor(id: string): string {
  return AVATAR_COLORS[(id.codePointAt(0) ?? 0) % AVATAR_COLORS.length] ?? "#6366F1";
}

function getDisplayName(user: User): string {
  const first = user.user_detail.first_name?.trim() ?? "";
  const last = user.user_detail.last_name?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  return full.length > 0 ? full : `用户 ${user.id.substring(0, 8)}`;
}

function getInitials(user: User): string {
  const f = user.user_detail.first_name?.charAt(0).toUpperCase() ?? "";
  const l = user.user_detail.last_name?.charAt(0).toUpperCase() ?? "";
  const combined = `${f}${l}`.trim();
  return combined.length > 0 ? combined : "?";
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

function fmtDate(iso: string | null): string {
  if (iso === null || iso.length === 0) return "—";
  return new Date(iso).toLocaleDateString("zh-CN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function logTypeColor(type: string | null): string {
  if (type === null) return C.muted;
  const t = type.toLowerCase();
  if (t.includes("earn") || t.includes("credit") || t.includes("add")) return "#15803D";
  if (t.includes("redeem") || t.includes("debit") || t.includes("use")) return "#B91C1C";
  return C.muted;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ text }: Readonly<{ text: string }>): React.ReactElement {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "600",
        color: C.muted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 8,
      }}
    >
      {text}
    </Text>
  );
}

interface EditRowProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  first?: boolean;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
}

function EditRow({
  label,
  value,
  onChangeText,
  placeholder = "—",
  first = false,
  keyboardType = "default",
}: Readonly<EditRowProps>): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 13,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 15, color: C.muted, minWidth: 100, flexShrink: 0 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType}
        style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
      />
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string | null;
  first?: boolean;
}

function InfoRow({
  label,
  value,
  first = false,
}: Readonly<InfoRowProps>): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 13,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <Text style={{ fontSize: 15, color: C.muted, minWidth: 100, flexShrink: 0 }}>
        {label}
      </Text>
      <Text
        style={{ fontSize: 15, color: value === null ? C.muted : C.text, textAlign: "right", flex: 1 }}
        numberOfLines={1}
      >
        {value ?? "—"}
      </Text>
    </View>
  );
}

// ─── Points Log Row ───────────────────────────────────────────────────────────
function PointsLogRow({
  log,
  first,
}: Readonly<{ log: UserPointsLog; first: boolean }>): React.ReactElement {
  const amount = log.amount ?? 0;
  const color = logTypeColor(log.type);
  const sign = amount >= 0 ? "+" : "";

  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 13,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: C.text, textTransform: "capitalize" }}>
          {log.type ?? "交易"}
        </Text>
        <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
          {fmtDate(log.created_at)}
        </Text>
      </View>
      <Text style={{ fontSize: 15, fontWeight: "700", color }}>
        {`${sign}${amount} 积分`}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function UserDetailScreen(): React.ReactElement {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { users, updateUser } = useUserContext();
  const { getUserPointsByUserId, listUserPointsLogsByPointId } = usePointsMembership();

  const user = useMemo(
    (): User | null => users.find((u) => u.id === userId) ?? null,
    [users, userId]
  );

  // Editable form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [race, setRace] = useState("");

  // Points state
  const [points, setPoints] = useState<number | null>(null);
  const [pointsId, setPointsId] = useState<string | null>(null);
  const [logs, setLogs] = useState<UserPointsLog[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(true);

  const [saving, setSaving] = useState(false);

  /** Seed form fields when user data is available. */
  useEffect(() => {
    if (user === null) return;
    setFirstName(user.user_detail.first_name ?? "");
    setLastName(user.user_detail.last_name ?? "");
    setCity(user.user_detail.city ?? "");
    setState(user.user_detail.state ?? "");
    setBirthdate(user.user_detail.birthdate ?? "");
    setRace(user.user_detail.race ?? "");
  }, [user]);

  /** Fetch points balance and recent transaction logs. */
  useEffect(() => {
    if (userId === undefined || userId.length === 0) return;
    setLoadingPoints(true);
    getUserPointsByUserId(userId)
      .then(async (row) => {
        if (row === null) {
          setPoints(0);
          return;
        }
        setPoints(row.amount ?? 0);
        setPointsId(row.id);
        const recentLogs = await listUserPointsLogsByPointId(row.id, 10);
        setLogs(recentLogs);
      })
      .catch(() => {
        setPoints(0);
      })
      .finally(() => setLoadingPoints(false));
  }, [userId, getUserPointsByUserId, listUserPointsLogsByPointId]);

  const isDirty = useMemo(() => {
    if (user === null) return false;
    return (
      firstName !== (user.user_detail.first_name ?? "") ||
      lastName !== (user.user_detail.last_name ?? "") ||
      city !== (user.user_detail.city ?? "") ||
      state !== (user.user_detail.state ?? "") ||
      birthdate !== (user.user_detail.birthdate ?? "") ||
      race !== (user.user_detail.race ?? "")
    );
  }, [user, firstName, lastName, city, state, birthdate, race]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (user === null) return;
    setSaving(true);
    try {
      await updateUser({
        ...user,
        user_detail: {
          ...user.user_detail,
          first_name: firstName.trim().length > 0 ? firstName.trim() : null,
          last_name: lastName.trim().length > 0 ? lastName.trim() : null,
          city: city.trim().length > 0 ? city.trim() : null,
          state: state.trim().length > 0 ? state.trim() : null,
          birthdate: birthdate.trim().length > 0 ? birthdate.trim() : null,
          race: race.trim().length > 0 ? race.trim() : null,
        },
      });
    } catch (err: unknown) {
    Alert.alert("错误", err instanceof Error ? err.message : "无法保存更改。");
    } finally {
      setSaving(false);
    }
  }, [user, updateUser, firstName, lastName, city, state, birthdate, race]);

  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const name = getDisplayName(user);
  const initials = getInitials(user);
  const color = avatarColor(user.id);
  const badge = roleBadge(user.user_detail.role ?? "USER");

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
        <Text style={{ fontSize: 17, fontWeight: "600", color: C.text, flex: 1 }} numberOfLines={1}>
          {name}
        </Text>
        {isDirty && (
          <Pressable onPress={() => void handleSave()} disabled={saving}>
            <View
              style={{
                backgroundColor: C.accent,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 8,
                alignItems: "center",
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>保存</Text>
              )}
            </View>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* ── Avatar + name card ── */}
          <View
            style={{
              backgroundColor: C.panel,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
              paddingVertical: 24,
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: color,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 26, fontWeight: "700", color: "#FFFFFF" }}>
                {initials}
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>
              {name}
            </Text>
            <View
              style={{
                backgroundColor: badge.bg,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 5,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: badge.color }}>
                {badge.label}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: C.muted }}>
              {`加入时间：${fmtDate(user.user_detail.created_at ?? "")}`}
            </Text>
          </View>

          <SectionLabel text="忠诚积分" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <View
              style={{
                backgroundColor: C.panel,
                paddingHorizontal: 16,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: "#FEF9C3",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="star-outline" size={20} color="#A16207" />
                </View>
                <Text style={{ fontSize: 15, color: C.text }}>当前余额</Text>
              </View>
              {loadingPoints ? (
                <ActivityIndicator size="small" color={C.muted} />
              ) : (
                <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>
                  {`${points ?? 0} 积分`}
                </Text>
              )}
            </View>
          </View>

          {/* ── Points log ── */}
          {!loadingPoints && logs.length > 0 && pointsId !== null && (
            <>
              <SectionLabel text={`近期交易记录 (${logs.length})`} />
              <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
                {logs.map((log, idx) => (
                  <PointsLogRow key={log.id} log={log} first={idx === 0} />
                ))}
              </View>
            </>
          )}

          <SectionLabel text="个人资料" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <EditRow
              label="名"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="名"
              first
            />
            <EditRow
              label="姓"
              value={lastName}
              onChangeText={setLastName}
              placeholder="姓"
            />
            <EditRow
              label="城市"
              value={city}
              onChangeText={setCity}
              placeholder="城市"
            />
            <EditRow
              label="省份"
              value={state}
              onChangeText={setState}
              placeholder="省份"
            />
            <EditRow
              label="生日"
              value={birthdate}
              onChangeText={setBirthdate}
              placeholder="YYYY-MM-DD"
            />
            <EditRow
              label="民族"
              value={race}
              onChangeText={setRace}
              placeholder="例: 马来族"
            />
          </View>

          <SectionLabel text="数据指标" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <InfoRow
              label="累计消费"
              value={`RM ${(user.user_detail.lifetime_val ?? 0).toFixed(2)}`}
              first
            />
            <InfoRow label="角色" value={user.user_detail.role ?? "USER"} />
          </View>

          <SectionLabel text="账户信息" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <View style={{ backgroundColor: C.panel, paddingHorizontal: 16, paddingVertical: 13 }}>
              <Text style={{ fontSize: 12, color: C.muted }}>用户ID</Text>
              <Text
                style={{ fontSize: 12, color: C.muted, marginTop: 2, fontFamily: "monospace" }}
                selectable
              >
                {user.id}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: C.panel,
                borderTopWidth: 1,
                borderTopColor: C.border,
                paddingHorizontal: 16,
                paddingVertical: 13,
              }}
            >
              <Text style={{ fontSize: 12, color: C.muted }}>注册时间</Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                {fmtDate(user.user_detail.created_at ?? "")}
              </Text>
            </View>
          </View>

          {/* ── Admin-only notice ── */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 20,
              backgroundColor: "#FEF9C3",
              borderRadius: 12,
              padding: 14,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <Ionicons name="information-circle-outline" size={18} color="#A16207" style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 13, color: "#A16207", flex: 1, lineHeight: 19 }}>
              密码修改、账户删除及角色分配仅可在网页端管理面板中操作。
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
