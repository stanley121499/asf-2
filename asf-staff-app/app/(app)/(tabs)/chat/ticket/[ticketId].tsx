import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ChatWindow } from "@/components/ChatWindow";
import { useAuthContext } from "@/context/AuthContext";
import { useConversationContext } from "@/context/ConversationContext";
import { useTicketContext } from "@/context/TicketContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
  danger: "#E8453C",
  amber: "#D97706",
  green: "#22C55E",
};

function statusColor(status: string | null): string {
  switch (status?.toLowerCase()) {
    case "open":
      return C.danger;
    case "in_progress":
      return C.amber;
    case "resolved":
    case "closed":
      return C.green;
    default:
      return C.muted;
  }
}

function priorityColor(priority: string | null): string {
  switch (priority?.toLowerCase()) {
    case "high":
    case "urgent":
      return C.danger;
    case "medium":
      return C.amber;
    default:
      return C.muted;
  }
}

/**
 * Ticket detail screen rendered **inside the Chat stack** so the back button
 * correctly returns to the Chat hub (chat/index) instead of switching tabs.
 */
export default function ChatTicketDetailScreen(): React.ReactElement {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const { conversations, createConversation } = useConversationContext();
  const { tickets, updateTicket } = useTicketContext();

  const ticket = useMemo(
    () => tickets.find((t) => t.id === ticketId),
    [tickets, ticketId]
  );

  const linkedConversation = useMemo(
    () => conversations.find((c) => c.ticket_id === ticketId),
    [conversations, ticketId]
  );

  const sc = statusColor(ticket?.status ?? null);
  const pc = priorityColor(ticket?.priority ?? null);
  const isClosed =
    ticket?.status === "closed" || ticket?.status === "resolved";

  const handleResolve = async (): Promise<void> => {
    await updateTicket(ticketId, { status: "resolved" });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header (top safe area) ───────────────────────────────────────────── */}
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
            paddingHorizontal: 14,
            paddingVertical: 10,
            gap: 10,
          }}
        >
          {/* Back → always returns to Chat hub */}
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

          {/* Ticket subject + badges */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ fontSize: 15, fontWeight: "700", color: C.text }}
              numberOfLines={1}
            >
              {ticket?.subject ?? "客服工单"}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 2,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: sc,
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: sc,
                    textTransform: "capitalize",
                  }}
                >
                  {ticket?.status ?? "—"}
                </Text>
              </View>
              {ticket?.priority !== null && ticket?.priority !== undefined && (
                <View
                  style={{
                    backgroundColor: `${pc}1A`,
                    borderRadius: 5,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: pc,
                      textTransform: "capitalize",
                    }}
                  >
                    {ticket.priority}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Resolve button — hidden once closed/resolved */}
          {!isClosed && (
            <TouchableOpacity
              onPress={() => void handleResolve()}
              style={{
                backgroundColor: `${C.green}18`,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: `${C.green}40`,
                paddingHorizontal: 10,
                paddingVertical: 7,
              }}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "700", color: C.green }}
              >
                标记解决
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* ── Optional description strip ───────────────────────────────────────── */}
      {typeof ticket?.description === "string" &&
        ticket.description.length > 0 && (
          <View
            style={{
              backgroundColor: "#FFFBEB",
              borderBottomWidth: 1,
              borderBottomColor: "#FDE68A",
              paddingHorizontal: 14,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 6,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={C.amber}
              style={{ marginTop: 1 }}
            />
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                color: "#78350F",
                lineHeight: 16,
              }}
              numberOfLines={3}
            >
              {ticket.description}
            </Text>
          </View>
        )}

      {/* ── Chat area (keyboard-aware) ───────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {linkedConversation !== undefined && typeof user?.id === "string" ? (
          <ChatWindow
            conversationId={linkedConversation.id}
            staffUserId={user.id}
          />
        ) : (
          // No linked conversation yet — show a prompt to start one
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              gap: 14,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chatbubble-outline" size={28} color={C.muted} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: C.text,
                textAlign: "center",
              }}
            >
              暂无对话
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: C.muted,
                textAlign: "center",
                lineHeight: 19,
              }}
            >
              开始对话以就此工单与客户沟通。
            </Text>
            <TouchableOpacity
              onPress={() =>
                void createConversation({
                  ticket_id: ticketId,
                  type: "support",
                  active: true,
                })
              }
              style={{
                backgroundColor: C.accent,
                borderRadius: 12,
                paddingHorizontal: 24,
                paddingVertical: 13,
                marginTop: 4,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: C.panel }}
              >
                开始对话
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
