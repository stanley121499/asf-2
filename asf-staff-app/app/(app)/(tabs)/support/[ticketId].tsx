import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ChatWindow } from "@/components/ChatWindow";
import { useAuthContext } from "@/context/AuthContext";
import { useConversationContext } from "@/context/ConversationContext";
import { useTicketContext } from "@/context/TicketContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#FAF9F6",
  panel: "#FFFFFF",
  border: "#E5E7EB",
  text: "#1A1A1A",
  muted: "#6B7280",
  accent: "#000000",
  danger: "#EF4444",
  amber: "#D97706",
  green: "#15803D",
};

function statusColor(status: string | null): string {
  switch (status?.toLowerCase()) {
    case "open": return C.danger;
    case "in_progress": return C.amber;
    case "resolved": case "closed": return C.green;
    default: return C.muted;
  }
}

function priorityColor(priority: string | null): string {
  switch (priority?.toLowerCase()) {
    case "high": case "urgent": return C.danger;
    case "medium": return C.amber;
    default: return C.muted;
  }
}

export default function TicketDetailScreen(): React.ReactElement {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const { conversations, createConversation } = useConversationContext();
  const { tickets } = useTicketContext();

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

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={{ backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="arrow-back" size={18} color={C.text} />
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }} numberOfLines={1}>
            {ticket?.subject ?? "客服工单"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
            {/* Status badge */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sc }} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: sc, textTransform: "capitalize" }}>
                {ticket?.status ?? "—"}
              </Text>
            </View>
            {/* Priority badge */}
            {ticket?.priority !== null && ticket?.priority !== undefined && (
              <View style={{ backgroundColor: pc + "18", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: pc, textTransform: "capitalize" }}>
                  {ticket.priority}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Description strip (collapsed, only if present) ─────────────────── */}
      {typeof ticket?.description === "string" && ticket.description.length > 0 && (
        <View style={{ backgroundColor: "#FFFBEB", borderBottomWidth: 1, borderBottomColor: "#FDE68A", paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          <Ionicons name="information-circle-outline" size={15} color={C.amber} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 12, color: "#78350F", lineHeight: 17 }} numberOfLines={3}>
            {ticket.description}
          </Text>
        </View>
      )}

      {/* ── Chat window or start conversation ───────────────────────────────── */}
      {linkedConversation !== undefined && typeof user?.id === "string" ? (
        <ChatWindow conversationId={linkedConversation.id} staffUserId={user.id} />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="chatbubble-outline" size={28} color={C.muted} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "600", color: C.text, textAlign: "center" }}>暂无对话</Text>
          <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 19 }}>
            开始对话以就此工单与客户沟通。
          </Text>
          <TouchableOpacity
            onPress={() => void createConversation({ ticket_id: ticketId, type: "support", active: true })}
            style={{ backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13, marginTop: 4 }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: C.panel }}>开始对话</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
