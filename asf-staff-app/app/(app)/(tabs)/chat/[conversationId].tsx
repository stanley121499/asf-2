import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ChatWindow } from "@/components/ChatWindow";
import { useAuthContext } from "@/context/AuthContext";
import { useConversationContext } from "@/context/ConversationContext";
import { useUserContext } from "@/context/UserContext";

const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
};

export default function ChatConversationScreen(): React.ReactElement {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const { users } = useUserContext();
  const { conversations } = useConversationContext();

  const conv = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId]
  );

  const participantCount = conv?.participants?.length ?? 0;

  let title = "内部聊天";
  let subtitle = `${participantCount} 位成员`;

  if (conv?.type === "direct" && participantCount === 2) {
    const otherParticipant = conv.participants.find(p => p.user_id !== user?.id);
    if (otherParticipant) {
      const otherUser = users.find(u => u.id === otherParticipant.user_id);
      if (otherUser) {
        const first = otherUser.user_detail.first_name?.trim() ?? "";
        const last = otherUser.user_detail.last_name?.trim() ?? "";
        const full = `${first} ${last}`.trim();
        title = full.length > 0 ? full : `用户 ${otherUser.id.substring(0, 8)}`;
        subtitle = otherUser.user_detail.role ?? "员工";
      }
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header (safe area top only) ─────────────────────────────────────── */}
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
            <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
              {title}
            </Text>
            <Text style={{ fontSize: 11, color: C.muted }}>
              {subtitle}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Chat area (keyboard-aware) ───────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {typeof user?.id === "string" && typeof conversationId === "string" ? (
          <ChatWindow conversationId={conversationId} staffUserId={user.id} />
        ) : (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: C.muted }}>
              无法加载对话。
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
