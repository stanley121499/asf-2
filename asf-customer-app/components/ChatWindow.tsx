import React from "react";
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

import type { ChatMessageRow } from "@/context/ConversationContext";
import { useTranslation } from "@/context/LocaleContext";

export interface ChatWindowProps {
  messages: ChatMessageRow[];
  draft: string;
  onChangeDraft: (text: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
}

/**
 * Scrollable message list with bottom text field (support chat thread).
 */
export function ChatWindow({
  messages,
  draft,
  onChangeDraft,
  onSend,
  sending,
  disabled,
}: ChatWindowProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <KeyboardAvoidingView
      className="flex-1 border border-border rounded-xl overflow-hidden bg-panel"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-xl border border-border bg-bg p-3">
            <Text className="text-xs text-muted">{item.created_at ?? ""}</Text>
            <Text className="text-sm text-accent mt-1">{item.content ?? ""}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-muted text-sm px-2 py-4">{t("support.noMessages")}</Text>
        }
      />
      <View className="flex-row items-end border-t border-border p-2 bg-bg gap-2">
        <TextInput
          className="flex-1 rounded-xl border border-border bg-panel px-3 py-2 text-accent min-h-[44px] max-h-[120px]"
          value={draft}
          onChangeText={onChangeDraft}
          placeholder={t("support.messagePlaceholder")}
          placeholderTextColor="#6B7280"
          multiline
          editable={disabled !== true}
          textAlignVertical="top"
        />
        <Pressable
          className="rounded-xl bg-accent px-4 py-3 justify-center min-h-[44px]"
          onPress={() => onSend()}
          disabled={disabled === true || sending === true || draft.trim().length === 0}
        >
          {sending === true ? (
            <ActivityIndicator color="#FAF9F6" />
          ) : (
            <Text className="text-bg font-semibold">{t("support.send")}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
