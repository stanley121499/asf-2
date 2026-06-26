import React from "react";
import { Text, TextInput, View } from "react-native";

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "numeric" | "email-address";
  multiline?: boolean;
};

/**
 * Label + controlled `TextInput` with consistent spacing.
 */
export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
}: FormFieldProps): React.ReactElement {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-text">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry === true}
        keyboardType={keyboardType ?? "default"}
        multiline={multiline === true}
        className="rounded-xl border border-border bg-panel px-4 py-3 text-base text-text"
        style={{ borderWidth: 1 }}
      />
    </View>
  );
}
