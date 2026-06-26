import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

const STORAGE_KEY = "onboarding_v1_done";

/**
 * Three-step welcome overlay matching web `OnboardingOverlay`; persistence via AsyncStorage.
 */
export function OnboardingOverlay(): React.ReactElement | null {
  const router = useRouter();
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
            <Text className="text-sm text-muted">跳过</Text>
          </Pressable>
        ) : null}

        {step === 1 ? (
          <View className="flex-1 justify-between py-12">
            <View className="items-center mt-24">
              <Text className="font-display text-5xl text-white tracking-widest mb-4">SYSTEM</Text>
              <Text className="text-gray-300">优选品质，触手可及</Text>
            </View>
            <View className="items-center gap-6">
              <Text className="text-sm text-muted">第 1 步 / 共 3 步</Text>
              <Pressable
                className="w-full h-14 rounded-full bg-white items-center justify-center"
                onPress={() => setStep(2)}
              >
                <Text className="text-black font-medium text-lg">开始体验 →</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View className="flex-1 justify-between py-12">
            <View className="items-center px-4 mt-16">
              <Text className="font-display text-2xl text-white text-center mb-4">每次购物，积分回馈</Text>
              <Text className="text-gray-300 text-sm text-center leading-relaxed">
                消费即积分，积分兑换专属奖励。{"\n"}等级越高，福利越多。
              </Text>
            </View>
            <View className="items-center gap-6">
              <Text className="text-sm text-muted">第 2 步 / 共 3 步</Text>
              <Pressable
                className="w-full h-14 rounded-full bg-white items-center justify-center"
                onPress={() => setStep(3)}
              >
                <Text className="text-black font-medium text-lg">下一步 →</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View className="flex-1 justify-between py-12">
            <View className="items-center mt-28 px-4">
              <Text className="font-display text-3xl text-white text-center mb-4">开始您的购物旅程</Text>
              <Text className="text-gray-400 text-sm text-center px-4">
                登录后可保存收藏、追踪订单并获取积分
              </Text>
            </View>
            <View className="gap-4">
              <Pressable
                className="w-full h-14 rounded-full bg-white items-center justify-center"
                onPress={handleAuth}
              >
                <Text className="text-black font-medium text-lg">登录 / 注册</Text>
              </Pressable>
              <Pressable
                className="w-full h-14 rounded-full border border-white items-center justify-center"
                onPress={handleClose}
              >
                <Text className="text-white font-medium text-lg">游客浏览</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
