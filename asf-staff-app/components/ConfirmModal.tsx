import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Two-action confirm dialog over a dimmed backdrop.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmModalProps): React.ReactElement {
  const confirmClass =
    destructive === true ? "bg-danger" : "bg-accent";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        className="flex-1 justify-center bg-black/40 px-6"
        onPress={onCancel}
        accessibilityRole="button"
      >
        <Pressable
          className="rounded-2xl bg-panel p-6"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-lg font-semibold text-text">{title}</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">{message}</Text>
          <View className="mt-6 flex-row justify-end gap-3">
            <Pressable
              onPress={onCancel}
              className="rounded-xl border border-border px-4 py-3"
              accessibilityRole="button"
            >
              <Text className="text-sm font-medium text-text">
                {cancelLabel ?? "取消"}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`rounded-xl px-4 py-3 ${confirmClass}`}
              accessibilityRole="button"
            >
              <Text className="text-sm font-medium text-panel">
                {confirmLabel ?? "确认"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
