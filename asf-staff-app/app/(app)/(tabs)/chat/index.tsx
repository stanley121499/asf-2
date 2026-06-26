import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useConversationContext } from "@/context/ConversationContext";
import { useTicketContext } from "@/context/TicketContext";
import { useAuthContext } from "@/context/AuthContext";
import { useUserContext } from "@/context/UserContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Stable pastel colour pair from a seed string (like WhatsApp's random avatar colours). */
function avatarColor(seed: string): { bg: string; fg: string } {
  const palette: Array<{ bg: string; fg: string }> = [
    { bg: "#D1FAE5", fg: "#065F46" },
    { bg: "#DBEAFE", fg: "#1D4ED8" },
    { bg: "#FEF3C7", fg: "#92400E" },
    { bg: "#FCE7F3", fg: "#9D174D" },
    { bg: "#EDE9FE", fg: "#5B21B6" },
    { bg: "#FFEDD5", fg: "#9A3412" },
    { bg: "#E0F2FE", fg: "#075985" },
    { bg: "#FEE2E2", fg: "#991B1B" },
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

/** WhatsApp-style timestamp: HH:MM today, weekday this week, DD Mon otherwise. */
function fmtTs(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const isoDay = iso.slice(0, 10);
    const todayStr = now.toISOString().slice(0, 10);
    if (isoDay === todayStr)
      return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
    const msSince = now.getTime() - d.getTime();
    if (msSince < 7 * 86400000)
      return d.toLocaleDateString("zh-CN", { weekday: "short" });
    return d.toLocaleDateString("zh-CN", { day: "numeric", month: "short" });
  } catch { return ""; }
}

function statusDotColor(status: string | null): string {
  switch (status?.toLowerCase()) {
    case "open":        return "#E8453C";
    case "in_progress": return "#D97706";
    case "resolved":
    case "closed":      return "#22C55E";
    default:            return "#9CA3AF";
  }
}

type Tab = "team" | "tickets";

// ─── Shared row component ─────────────────────────────────────────────────────

type RowProps = {
  seed: string;
  avatarContent: React.ReactNode;  /** icon or initial inside the circle */
  title: string;
  preview: string;
  timestamp: string;
  badge?: React.ReactNode;          /** optional right-side badge */
  onPress: () => void;
};

function ChatRow({ seed, avatarContent, title, preview, timestamp, badge, onPress }: RowProps): React.ReactElement {
  const colors = avatarColor(seed);
  return (
    <TouchableOpacity activeOpacity={0.65} onPress={onPress}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Circular avatar */}
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: colors.bg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {avatarContent}
        </View>

        {/* Text block (fills remaining width) */}
        <View style={{ flex: 1 }}>
          {/* Top row: name + timestamp */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "600", color: "#000000", flexShrink: 1 }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text style={{ fontSize: 12, color: "#8E8E93", marginLeft: 6, flexShrink: 0 }}>
              {timestamp}
            </Text>
          </View>

          {/* Bottom row: preview + optional badge */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text
              style={{ fontSize: 14, color: "#8E8E93", flex: 1 }}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {badge}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/** Hairline divider that starts after the avatar (matches WhatsApp). */
function Divider(): React.ReactElement {
  return (
    <View
      style={{
        height: 0.5,
        backgroundColor: "#E5E7EB",
        marginLeft: 78, // 16 padding + 50 avatar + 12 gap
      }}
    />
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatIndexScreen(): React.ReactElement {
  const router = useRouter();
  const { conversations, loading: convLoading } = useConversationContext();
  const { tickets, loading: ticketLoading } = useTicketContext();
  const { user: currentUser } = useAuthContext();
  const { users } = useUserContext();
  const [activeTab, setActiveTab] = useState<Tab>("team");

  const teamConvs = useMemo(
    () => conversations.filter((c) => c.ticket_id === null),
    [conversations]
  );

  const sortedTickets = useMemo(
    () => [...tickets].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
    [tickets]
  );

  const openCount = useMemo(
    () => tickets.filter((t) => t.status === "open").length,
    [tickets]
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#FFFFFF" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#000000" }}>聊天</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {openCount > 0 && (
              <View style={{ backgroundColor: "#E8453C", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
                  {openCount} 待处理
                </Text>
              </View>
            )}
            {activeTab === "team" && (
              <TouchableOpacity onPress={() => router.push("/(app)/(tabs)/chat/new")}>
                <View style={{ backgroundColor: "#000000", width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Segmented control */}
        <View style={{ flexDirection: "row", backgroundColor: "#F0F0F0", borderRadius: 10, padding: 3 }}>
          {([["team", "内部聊天"], ["tickets", "客服工单"]] as [Tab, string][]).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor: activeTab === key ? "#FFFFFF" : "transparent",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: activeTab === key ? "#000000" : "#8E8E93" }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 0.5, backgroundColor: "#E5E7EB" }} />

      {/* ── Team Chat list ──────────────────────────────────────────────────── */}
      {activeTab === "team" && (
        <FlatList
          data={teamConvs}
          keyExtractor={(c) => c.id}
          ItemSeparatorComponent={Divider}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 80 }}>
              <Ionicons name="chatbubbles-outline" size={44} color="#D1D5DB" />
              <Text style={{ marginTop: 10, fontSize: 14, color: "#9CA3AF" }}>
                {convLoading ? "加载中…" : "暂无群组对话"}
              </Text>
            </View>
          }
          renderItem={({ item: conv }) => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const preview = lastMsg !== undefined ? (lastMsg.content ?? "📎 媒体文件") : "暂无消息";
            const ts = fmtTs(lastMsg?.created_at ?? conv.created_at);
            const memberCount = conv.participants?.length ?? 0;
            const colors = avatarColor(conv.id);

            let title = memberCount > 0 ? `群组 · ${memberCount}人` : "群组聊天";
            let avatarIcon = <Ionicons name="people" size={22} color={colors.fg} />;

            if (conv.type === "direct" && memberCount === 2) {
              const otherParticipant = conv.participants.find(p => p.user_id !== currentUser?.id);
              if (otherParticipant) {
                const otherUser = users.find(u => u.id === otherParticipant.user_id);
                if (otherUser) {
                  const first = otherUser.user_detail.first_name?.trim() ?? "";
                  const last = otherUser.user_detail.last_name?.trim() ?? "";
                  const full = `${first} ${last}`.trim();
                  title = full.length > 0 ? full : `用户 ${otherUser.id.substring(0, 8)}`;
                  
                  const f = otherUser.user_detail.first_name?.charAt(0).toUpperCase() ?? "";
                  const l = otherUser.user_detail.last_name?.charAt(0).toUpperCase() ?? "";
                  const initials = `${f}${l}`.trim() || "?";
                  
                  avatarIcon = <Text style={{ fontSize: 20, fontWeight: "700", color: colors.fg }}>{initials}</Text>;
                }
              }
            }

            return (
              <ChatRow
                seed={conv.id}
                avatarContent={avatarIcon}
                title={title}
                preview={preview}
                timestamp={ts}
                onPress={() => router.push(`/(app)/(tabs)/chat/${conv.id}`)}
              />
            );
          }}
        />
      )}

      {/* ── Support Tickets list ────────────────────────────────────────────── */}
      {activeTab === "tickets" && (
        <FlatList
          data={sortedTickets}
          keyExtractor={(t) => t.id}
          ItemSeparatorComponent={Divider}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 80 }}>
              <Ionicons name="ticket-outline" size={44} color="#D1D5DB" />
              <Text style={{ marginTop: 10, fontSize: 14, color: "#9CA3AF" }}>
                {ticketLoading ? "加载中…" : "暂无工单"}
              </Text>
            </View>
          }
          renderItem={({ item: ticket }) => {
            const sc = statusDotColor(ticket.status);
            const ts = fmtTs(ticket.created_at);
            const initial = (ticket.subject ?? "?").charAt(0).toUpperCase();
            const colors = avatarColor(ticket.id);
            const isClosed = ticket.status === "closed" || ticket.status === "resolved";

            // Preview: description snippet, or status if no description
            const preview = typeof ticket.description === "string" && ticket.description.length > 0
              ? ticket.description
              : ticket.status ?? "—";

            // Badge: red pill for open tickets (like WhatsApp unread count)
            const badge = !isClosed && ticket.status === "open" ? (
              <View style={{ backgroundColor: "#E8453C", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5, marginLeft: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}>!</Text>
              </View>
            ) : undefined;

            return (
              <ChatRow
                seed={ticket.id}
                avatarContent={
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.fg }}>{initial}</Text>
                }
                title={ticket.subject ?? "无主题"}
                preview={preview}
                timestamp={ts}
                badge={badge}
                onPress={() => router.push(`/(app)/(tabs)/chat/ticket/${ticket.id}`)}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
