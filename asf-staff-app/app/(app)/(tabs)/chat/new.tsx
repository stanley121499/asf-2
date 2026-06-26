import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuthContext } from "@/context/AuthContext";
import { useUserContext, type User } from "@/context/UserContext";
import { useConversationContext } from "@/context/ConversationContext";

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

export default function NewChatScreen(): React.ReactElement {
  const router = useRouter();
  const { user: currentUser } = useAuthContext();
  const { users } = useUserContext();
  const { createConversation, addParticipant, conversations } = useConversationContext();

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  // Only show staff members (exclude "USER" role) and exclude current user
  const staffUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.id !== currentUser?.id &&
        u.user_detail.role !== "USER" &&
        u.user_detail.role !== "PREMIUM"
    );
  }, [users, currentUser]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return staffUsers;
    return staffUsers.filter((u) => {
      const name = getDisplayName(u).toLowerCase();
      const email = u.email.toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [staffUsers, query]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleCreate = async () => {
    if (selectedIds.size === 0 || !currentUser) return;
    setCreating(true);

    try {
      const isGroup = selectedIds.size > 1;

      // If it's a direct message, check if one already exists
      if (!isGroup) {
        const targetId = Array.from(selectedIds)[0];
        const existingDirect = conversations.find((c) => {
          if (c.type !== "direct") return false;
          const pIds = c.participants.map((p) => p.user_id);
          return pIds.length === 2 && pIds.includes(currentUser.id) && pIds.includes(targetId);
        });

        if (existingDirect) {
          router.replace(`/(app)/(tabs)/chat/${existingDirect.id}`);
          return;
        }
      }

      const conv = await createConversation({
        type: isGroup ? "group" : "direct",
        active: true,
      });

      if (conv) {
        // Add current user
        await addParticipant({
          conversation_id: conv.id,
          user_id: currentUser.id,
        });

        // Add selected users
        for (const id of selectedIds) {
          await addParticipant({
            conversation_id: conv.id,
            user_id: id,
          });
        }

        // Navigate to the new chat
        router.replace(`/(app)/(tabs)/chat/${conv.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView
        edges={["top"]}
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 10,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>
              发起新聊天
            </Text>
          </View>
          <Pressable
            onPress={() => void handleCreate()}
            disabled={selectedIds.size === 0 || creating}
            style={({ pressed }) => ({
              backgroundColor: selectedIds.size === 0 || creating ? "#E5E5E3" : "#0A0A0A",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: selectedIds.size === 0 || creating ? C.muted : "#FFFFFF",
                }}
              >
                创建
              </Text>
            )}
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: C.bg,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <Ionicons name="search" size={18} color={C.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="搜索团队成员…"
              placeholderTextColor={C.muted}
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 15,
                color: C.text,
              }}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={16} color={C.muted} />
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={filteredUsers}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Ionicons name="people-outline" size={40} color={C.border} />
              <Text style={{ marginTop: 12, fontSize: 14, color: C.muted }}>
                未找到成员
              </Text>
            </View>
          }
          renderItem={({ item: u }) => {
            const isSelected = selectedIds.has(u.id);
            const name = getDisplayName(u);
            const initials = getInitials(u);
            const color = avatarColor(u.id);

            return (
              <Pressable
                onPress={() => toggleSelect(u.id)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: C.panel,
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: isSelected ? C.accent : C.border,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: color,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                    {initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: C.text }}>
                    {name}
                  </Text>
                  <Text style={{ fontSize: 13, color: C.muted }}>
                    {u.user_detail.role}
                  </Text>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? C.accent : C.border,
                    backgroundColor: isSelected ? C.accent : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
              </Pressable>
            );
          }}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
