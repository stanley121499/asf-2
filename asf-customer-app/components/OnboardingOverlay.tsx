import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { useTranslation } from "@/context/LocaleContext";

const STORAGE_KEY = "onboarding_v1_done";
const TOTAL_STEPS = 3;

/**
 * Three-step welcome overlay matching web `OnboardingOverlay`; persistence via AsyncStorage.
 */
export function OnboardingOverlay(): React.ReactElement | null {
  const router = useRouter();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void (async (): Promise<void> => {
      try {
        const done = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && done !== "1") {
          setVisible(true);
        }
      } catch {
        if (!cancelled) {
          setVisible(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClose = useCallback((): void => {
    void AsyncStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }, []);

  const handleAuth = useCallback((): void => {
    handleClose();
    router.push("/(auth)/sign-in");
  }, [handleClose, router]);

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="fade" visible transparent={false}>
      <View className="flex-1 bg-[#0A0A0A] px-6 py-10">
        {step < 3 ? (
          <Pressable className="absolute top-14 right-6 z-10" onPress={handleClose}>
            <Text className="text-sm text-muted">{t("onboarding.skip")}</Text>
          </Pressable>
        ) : null}

        {step === 1 ? (
          <View className="flex-1 justify-between py-12">
            <View className="items-center mt-24">
              <Text className="font-display text-5xl text-white tracking-widest mb-4">SYSTEM</Text>
              <Text className="text-gray-300">{t("onboarding.step1.tagline")}</Text>
            </View>
            <View className="items-center gap-6">
              <Text className="text-sm text-muted">
                {t("onboarding.stepIndicator", { step: 1, total: TOTAL_STEPS })}
              </Text>
              <Pressable
                className="w-full h-14 rounded-full bg-white items-center justify-center"
                onPress={() => setStep(2)}
              >
                <Text className="text-black font-medium text-lg">{t("onboarding.step1.cta")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View className="flex-1 justify-between py-12">
            <View className="items-center px-4 mt-16">
              <Text className="font-display text-2xl text-white text-center mb-4">
                {t("onboarding.step2.title")}
              </Text>
              <Text className="text-gray-300 text-sm text-center leading-relaxed">
                {t("onboarding.step2.bodyLine1")}
                {"\n"}
                {t("onboarding.step2.bodyLine2")}
              </Text>
            </View>
            <View className="items-center gap-6">
              <Text className="text-sm text-muted">
                {t("onboarding.stepIndicator", { step: 2, total: TOTAL_STEPS })}
              </Text>
              <Pressable
                className="w-full h-14 rounded-full bg-white items-center justify-center"
                onPress={() => setStep(3)}
              >
                <Text className="text-black font-medium text-lg">{t("onboarding.next")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View className="flex-1 justify-between py-12">
            <View className="items-center mt-28 px-4">
              <Text className="font-display text-3xl text-white text-center mb-4">
                {t("onboarding.step3.title")}
              </Text>
              <Text className="text-gray-400 text-sm text-center px-4">
                {t("onboarding.step3.body")}
              </Text>
            </View>
            <View className="gap-4">
              <Pressable
                className="w-full h-14 rounded-full bg-white items-center justify-center"
                onPress={handleAuth}
              >
                <Text className="text-black font-medium text-lg">{t("onboarding.step3.signIn")}</Text>
              </Pressable>
              <Pressable
                className="w-full h-14 rounded-full border border-white items-center justify-center"
                onPress={handleClose}
              >
                <Text className="text-white font-medium text-lg">
                  {t("onboarding.step3.guestBrowse")}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
