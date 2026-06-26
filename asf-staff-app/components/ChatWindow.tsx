import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  type ChatMessageRow,
  useConversationContext,
} from "@/context/ConversationContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F0F0F0",            // WhatsApp-style grey background
  panel: "#FFFFFF",
  border: "#E5E7EB",
  text: "#1A1A1A",
  muted: "#8E8E93",
  sent: "#1A1A1A",          // dark bubble for sent
  sentText: "#FFFFFF",
  received: "#FFFFFF",      // white bubble for received
  receivedText: "#1A1A1A",
  inputBg: "#FFFFFF",
  sendBtn: "#1A1A1A",
};

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function fmtDay(iso: string): string {
  try {
    const d = new Date(iso);
    const todayStr = new Date().toISOString().slice(0, 10);
    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yestStr = yestDate.toISOString().slice(0, 10);
    const isoDay = iso.slice(0, 10);
    if (isoDay === todayStr) return "今天";
    if (isoDay === yestStr) return "昨天";
    return d.toLocaleDateString("zh-CN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export type ChatWindowProps = {
  conversationId: string;
  staffUserId: string;
};

type Item =
  | { kind: "msg"; message: ChatMessageRow }
  | { kind: "day"; label: string; key: string };

/**
 * WhatsApp-style chat window.
 * – Inverted FlatList so newest messages sit at the bottom.
 * – Loads historical messages from the DB on mount.
 * – Parent must wrap this in a KeyboardAvoidingView.
 */
export function ChatWindow({
  conversationId,
  staffUserId,
}: ChatWindowProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { conversations, createMessage, listMessagesByConversationId } =
    useConversationContext();

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // ── Load historical messages on mount (context starts with messages: []) ──
  useEffect(() => {
    void listMessagesByConversationId(conversationId);
  }, [conversationId, listMessagesByConversationId]);

  // Newest-first for the inverted FlatList
  const sorted = useMemo(() => {
    const conv = conversations.find((c) => c.id === conversationId);
    const msgs = conv?.messages ?? [];
    return [...msgs].sort(
      (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
    );
  }, [conversations, conversationId]);

  // Inject day-separator rows between date groups (inverted: separators appear below groups)
  const items = useMemo((): Item[] => {
    const result: Item[] = [];
    let lastDay = "";
    for (const msg of sorted) {
      const day = msg.created_at.slice(0, 10);
      result.push({ kind: "msg", message: msg });
      if (day !== lastDay) {
        result.push({
          kind: "day",
          label: fmtDay(msg.created_at),
          key: `day-${day}`,
        });
        lastDay = day;
      }
    }
    return result;
  }, [sorted]);

  const send = useCallback(async (): Promise<void> => {
    const text = draft.trim();
    if (text.length === 0 || sending) return;
    setSending(true);
    setDraft("");
    try {
      await createMessage({
        conversation_id: conversationId,
        content: text,
        user_id: staffUserId,
        media_url: null,
        type: "text",
      });
    } finally {
      setSending(false);
    }
  }, [draft, sending, conversationId, staffUserId, createMessage]);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      if (item.kind === "day") {
        return (
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.18)",
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{ fontSize: 11, color: "#FFFFFF", fontWeight: "600" }}
              >
                {item.label}
              </Text>
            </View>
          </View>
        );
      }

      const msg = item.message;
      const isSent = msg.user_id === staffUserId;

      return (
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 2,
            alignItems: isSent ? "flex-end" : "flex-start",
          }}
        >
          <View
            style={{
              maxWidth: "78%",
              backgroundColor: isSent ? C.sent : C.received,
              borderRadius: 16,
              borderBottomRightRadius: isSent ? 4 : 16,
              borderBottomLeftRadius: isSent ? 16 : 4,
              paddingHorizontal: 12,
              paddingTop: 8,
              paddingBottom: 6,
              // Shadow for received bubbles
              ...(!isSent
                ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 1,
                  }
                : {}),
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: isSent ? C.sentText : C.receivedText,
                lineHeight: 20,
              }}
            >
              {msg.content ?? ""}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                marginTop: 3,
                gap: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: isSent ? "rgba(255,255,255,0.6)" : C.muted,
                }}
              >
                {fmtTime(msg.created_at)}
              </Text>
              {isSent && (
                <Ionicons
                  name="checkmark-done"
                  size={12}
                  color="rgba(255,255,255,0.55)"
                />
              )}
            </View>
          </View>
        </View>
      );
    },
    [staffUserId]
  );

  const keyExtractor = useCallback(
    (item: Item) => (item.kind === "day" ? item.key : item.message.id),
    []
  );

  return (
    <View style={{ flex: 1 }}>
      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        inverted
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 60,
            }}
          >
            <Ionicons name="chatbubbles-outline" size={40} color={C.muted} />
            <Text
              style={{ marginTop: 10, fontSize: 13, color: C.muted }}
            >
              暂无消息，打个招呼吧！
            </Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* ── Input bar ────────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingHorizontal: 10,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 8,
          flexDirection: "row",
          alignItems: "flex-end",
        }}
      >
        {/* Text input */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#F3F4F6",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 14,
            paddingVertical: 8,
            minHeight: 40,
            justifyContent: "center",
            marginRight: 8,
          }}
        >
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            placeholder="发消息…"
            placeholderTextColor={C.muted}
            multiline
            maxLength={2000}
            style={{
              fontSize: 15,
              color: C.text,
              maxHeight: 120,
              padding: 0,
              margin: 0,
            }}
            returnKeyType="default"
            blurOnSubmit={false}
          />
        </View>

        {/* Send button — always visible, grey when empty */}
        <TouchableOpacity
          onPress={() => void send()}
          disabled={draft.trim().length === 0 || sending}
          activeOpacity={0.7}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: draft.trim().length === 0 ? "#D1D5DB" : C.sendBtn,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="send" size={17} color="#FFFFFF" style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
