import { Redirect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubPageHeader } from "@/components/SubPageHeader";
import { ChatWindow } from "@/components/ChatWindow";
import { useConversationContext, type Conversation } from "@/context/ConversationContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTicketContext } from "@/context/TicketContext";
import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/context/LocaleContext";
import type { TablesInsert } from "@/database.types";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

type IssueTypeKey = "order" | "product" | "account" | "other";

const TYPE_KEYS: ReadonlyArray<IssueTypeKey> = ["order", "product", "account", "other"];

function formatTicketLabel(ticketId: string): string {
  return `TK-${ticketId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function resolveConversation(
  conversations: Conversation[],
  fallback: Conversation | null,
  id: string | null
): Conversation | null {
  if (id === null) return null;
  return conversations.find((c) => c.id === id) ?? (fallback?.id === id ? fallback : null);
}

/**
 * Maps an issue-type key to its translated label for display and persistence.
 */
function typeLabel(
  key: IssueTypeKey,
  translate: (key: string) => string
): string {
  switch (key) {
    case "order":
      return translate("support.typeOrder");
    case "product":
      return translate("support.typeProduct");
    case "account":
      return translate("support.typeAccount");
    case "other":
      return translate("support.typeOther");
  }
}

/**
 * Support screen — sticky header, issue-type pills, subject + description form, post-submit chat.
 * Matches web support-chat layout.
 */
export default function SupportScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { createTicket } = useTicketContext();

  if (!isEnabled("support_chat")) {
    return <Redirect href="/(tabs)/profile" />;
  }
  const { conversations, createConversation, addParticipant, createMessage, listMessagesByConversationId } = useConversationContext();

  type FormState = { type: IssueTypeKey; subject: string; description: string };
  const [formData, setFormData] = useState<FormState>({ type: "order", subject: "", description: "" });
  const [submitted, setSubmitted] = useState(false);
  const [createdTicketLabel, setCreatedTicketLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localConversation, setLocalConversation] = useState<Conversation | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const displayConversation = useMemo(
    () => resolveConversation(conversations, localConversation, activeConversationId),
    [conversations, localConversation, activeConversationId]
  );

  useEffect(() => {
    if (activeConversationId) void listMessagesByConversationId(activeConversationId);
  }, [activeConversationId, listMessagesByConversationId]);

  const handleSendMessage = useCallback(async (): Promise<void> => {
    if (displayConversation === null || user === null) return;
    const text = draft.trim();
    if (text.length === 0) return;
    setSendingReply(true);
    try {
      await createMessage({
        conversation_id: displayConversation.id,
        content: text,
        created_at: new Date().toISOString(),
        user_id: user.id,
        type: "text",
        media_url: null,
      });
      setDraft("");
      void listMessagesByConversationId(displayConversation.id);
    } finally {
      setSendingReply(false);
    }
  }, [createMessage, displayConversation, draft, listMessagesByConversationId, user]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    setError(null);
    const subjectTrimmed = formData.subject.trim();
    const descriptionTrimmed = formData.description.trim();
    if (subjectTrimmed.length === 0 || descriptionTrimmed.length === 0) {
      setError(t("support.fillSubjectDescription"));
      return;
    }
    if (user === null) {
      setError(t("support.alerts.loginRequired"));
      return;
    }
    setIsSubmitting(true);
    try {
      const issueTypeLabel = typeLabel(formData.type, t);
      const ticket = await createTicket({
        user_id: user.id,
        type: issueTypeLabel,
        subject: subjectTrimmed,
        description: descriptionTrimmed,
        status: "open",
      });
      if (ticket === undefined) {
        setError(t("support.createTicketFailed"));
        return;
      }
      const label = formatTicketLabel(ticket.id);
      setCreatedTicketLabel(label);
      const conversation = await createConversation({
        type: "support",
        ticket_id: ticket.id,
        active: true,
        created_at: new Date().toISOString(),
      });
      if (conversation === undefined) {
        setError(t("support.ticketCreatedChatFailedShort"));
        return;
      }
      await addParticipant({ conversation_id: conversation.id, user_id: user.id });
      const seedBody = [
        `${t("support.seedSubject")}${subjectTrimmed}`,
        `${t("support.seedType")}${issueTypeLabel}`,
        "",
        descriptionTrimmed,
      ].join("\n");
      const msgRow = await createMessage({
        conversation_id: conversation.id,
        content: seedBody,
        created_at: new Date().toISOString(),
        user_id: user.id,
        type: "text",
        media_url: null,
      });
      const messages = msgRow !== undefined ? [msgRow] : [];
      setLocalConversation({ ...conversation, messages });
      setActiveConversationId(conversation.id);
      const row: TablesInsert<"notifications"> = {
        user_id: user.id,
        type: "ticket_created",
        title: t("support.notifTitle"),
        body: t("support.notifBody", { label }),
      };
      const { error: notifErr } = await supabase.from("notifications").insert(row);
      if (notifErr !== null) {
        setError(t("support.alerts.notificationFailedShort", { message: notifErr.message }));
      }
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [addParticipant, createConversation, createMessage, createTicket, formData, user, t]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SubPageHeader title={t("support.title")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (user === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SubPageHeader title={t("support.title")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>
            {t("support.loginRequired")}
          </Text>
        </View>
      </View>
    );
  }

  if (submitted) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
        <SubPageHeader title={t("support.title")} />
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 18, color: colors.text }}>
              {t("support.ticketSubmitted")}
            </Text>
          </View>
          {createdTicketLabel.length > 0 && (
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 4, fontFamily: "Inter_400Regular" }}>
              {t("support.ticketNumberWithId", { id: createdTicketLabel })}
            </Text>
          )}
          <Text style={{ fontSize: 13, color: colors.muted, fontFamily: "Inter_400Regular" }}>
            {t("support.continueReply")}
          </Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 16 }}>
          {displayConversation !== null ? (
            <ChatWindow
              messages={displayConversation.messages}
              draft={draft}
              onChangeDraft={setDraft}
              onSend={() => void handleSendMessage()}
              sending={sendingReply}
            />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubPageHeader title={t("support.title")} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text, marginBottom: 4 }}>
          {t("support.contactUs")}
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 24, fontFamily: "Inter_400Regular" }}>
          {t("support.formIntroShort")}
        </Text>

        {error !== null && (
          <View style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: colors.danger, fontFamily: "Inter_400Regular" }}>{error}</Text>
          </View>
        )}

        {/* Issue type pills */}
        <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text, marginBottom: 12, fontFamily: "Inter_400Regular" }}>
          {t("support.issueType")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {TYPE_KEYS.map((key) => {
            const active = formData.type === key;
            const label = typeLabel(key, t);
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setFormData((p) => ({ ...p, type: key }))}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: active ? "#000000" : colors.border,
                  backgroundColor: active ? "#000000" : "transparent",
                }}
              >
                <Text style={{ fontSize: 13, color: active ? "#FFFFFF" : colors.text, fontFamily: "Inter_400Regular" }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subject */}
        <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text, marginBottom: 8, fontFamily: "Inter_400Regular" }}>
          {t("support.subject")}
        </Text>
        <TextInput
          style={{
            height: 48,
            backgroundColor: colors.panel,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            fontSize: 14,
            color: colors.text,
            fontFamily: "Inter_400Regular",
            marginBottom: 20,
          }}
          value={formData.subject}
          onChangeText={(subject) => setFormData((p) => ({ ...p, subject }))}
          placeholder={t("support.subjectPlaceholderShort")}
          placeholderTextColor={colors.muted}
        />

        {/* Description */}
        <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text, marginBottom: 8, fontFamily: "Inter_400Regular" }}>
          {t("support.description")}
        </Text>
        <TextInput
          style={{
            height: 140,
            backgroundColor: colors.panel,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingTop: 12,
            fontSize: 14,
            color: colors.text,
            fontFamily: "Inter_400Regular",
            textAlignVertical: "top",
            marginBottom: 28,
          }}
          value={formData.description}
          onChangeText={(description) => setFormData((p) => ({ ...p, description }))}
          placeholder={t("support.descriptionPlaceholder")}
          placeholderTextColor={colors.muted}
          multiline
        />

        {/* Submit */}
        <TouchableOpacity
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
          style={{
            height: 56,
            backgroundColor: "#000000",
            borderRadius: 99,
            alignItems: "center",
            justifyContent: "center",
            opacity: isSubmitting ? 0.5 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
              {t("support.submit")}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
