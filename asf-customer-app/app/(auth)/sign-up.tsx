import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";

/**
 * Registers a new user with email/password; sends them to sign-in.
 */
export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (): Promise<void> => {
    setError(null);
    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0 || password.length < 8) {
      setError("Enter a valid email and a password of at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: signUpErr } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });
      if (signUpErr !== null) {
        setError(signUpErr.message);
        return;
      }
      router.replace("/(auth)/sign-in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-accent mb-2">Create account</Text>
        <Text className="text-muted text-sm mb-6">Register with your email</Text>

        {error !== null ? (
          <View className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <Text className="text-sm text-danger">{error}</Text>
          </View>
        ) : null}

        <Text className="text-sm font-medium text-accent mb-1">Name (optional)</Text>
        <TextInput
          className="mb-4 rounded-xl border border-border bg-panel px-4 py-3 text-accent"
          value={name}
          onChangeText={setName}
          editable={!submitting}
        />

        <Text className="text-sm font-medium text-accent mb-1">Email</Text>
        <TextInput
          className="mb-4 rounded-xl border border-border bg-panel px-4 py-3 text-accent"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!submitting}
        />

        <Text className="text-sm font-medium text-accent mb-1">Password</Text>
        <TextInput
          className="mb-6 rounded-xl border border-border bg-panel px-4 py-3 text-accent"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!submitting}
        />

        <Pressable
          className="rounded-xl bg-accent py-4 items-center mb-4"
          onPress={() => void onSubmit()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FAF9F6" />
          ) : (
            <Text className="text-bg font-semibold">Sign up</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} disabled={submitting}>
          <Text className="text-center text-sm text-accent">Back to sign in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
