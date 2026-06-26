import { Redirect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubPageHeader } from "@/components/SubPageHeader";
import { StampGrid } from "@/components/StampGrid";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

const STAMP_SLOT_COUNT = 9;

function createEmptyStamps(): boolean[] {
  return Array.from({ length: STAMP_SLOT_COUNT }, () => false);
}

function normalizeStamps(value: unknown): boolean[] | null {
  if (!Array.isArray(value) || value.length !== STAMP_SLOT_COUNT) return null;
  return value.map((e) => Boolean(e));
}

async function loadOrCreateUserStamps(userId: string): Promise<boolean[]> {
  const { data: existing, error: selectError } = await supabase.from("user_stamps").select("stamps").eq("user_id", userId).maybeSingle();
  if (selectError) throw new Error(selectError.message);
  const parsed = existing ? normalizeStamps(existing.stamps) : null;
  if (parsed) return parsed;
  const { error: insertError } = await supabase.from("user_stamps").insert({ user_id: userId, stamps: createEmptyStamps() });
  if (insertError && insertError.code !== "23505") throw new Error(insertError.message);
  const { data: row, error: againError } = await supabase.from("user_stamps").select("stamps").eq("user_id", userId).single();
  if (againError) throw new Error(againError.message);
  return normalizeStamps(row.stamps) ?? createEmptyStamps();
}

/**
 * Rewards screen — sticky header, points card with tier, 3×3 stamp grid.
 */
export default function RewardsScreen(): React.ReactElement {
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const pointsAPI = usePointsMembership();

  if (!isEnabled("rewards")) {
    return <Redirect href="/(tabs)/profile" />;
  }

  const [userPoints, setUserPoints] = useState(0);
  const [stamps, setStamps] = useState<boolean[]>(createEmptyStamps);
  const [stampsLoading, setStampsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      void pointsAPI.getUserPointsByUserId(user.id).then((r) => setUserPoints(r?.amount ?? 0));
    }
  }, [user, pointsAPI]);

  useEffect(() => {
    if (authLoading || typeof user?.id !== "string") { setStamps(createEmptyStamps()); return; }
    let cancelled = false;
    const run = async (): Promise<void> => {
      setStampsLoading(true); setError(null);
      try {
        const next = await loadOrCreateUserStamps(user.id);
        if (!cancelled) setStamps(next);
      } catch (err) {
        if (!cancelled) { setError(err instanceof Error ? err.message : "Failed to load stamps"); setStamps(createEmptyStamps()); }
      } finally { if (!cancelled) setStampsLoading(false); }
    };
    void run();
    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  const handleStampClick = useCallback(async (index: number) => {
    if (typeof user?.id !== "string" || stampsLoading || stamps[index]) return;
    const previous = stamps;
    const newStamps = [...stamps]; newStamps[index] = true;
    setStamps(newStamps);
    const { error: upErr } = await supabase.from("user_stamps").update({ stamps: newStamps, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    if (upErr) { setStamps(previous); setError(upErr.message); }
  }, [stamps, stampsLoading, user?.id]);

  const tierName = userPoints >= 1000 ? "Gold" : userPoints >= 500 ? "Silver" : "Bronze";
  const tierColor = userPoints >= 1000 ? "#D4AF37" : userPoints >= 500 ? "#94A3B8" : "#CD7F32";

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SubPageHeader title="我的奖励" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (user === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SubPageHeader title="我的奖励" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>登录后可查看奖励。</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubPageHeader title="我的奖励" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Points card */}
        <View
          style={{
            backgroundColor: "#000000",
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Ionicons name="star" size={16} color={tierColor} />
            <Text style={{ fontSize: 14, color: tierColor, fontWeight: "600", fontFamily: "Inter_400Regular" }}>{tierName}</Text>
          </View>
          <Text style={{ fontSize: 40, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_400Regular" }}>{userPoints.toLocaleString()}</Text>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4, fontFamily: "Inter_400Regular" }}>积分</Text>

          {/* Tier progress hints */}
          <View style={{ marginTop: 16, flexDirection: "row", gap: 8 }}>
            {["Bronze", "Silver", "Gold"].map((t) => (
              <View
                key={t}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: t === "Bronze" && userPoints >= 0 ? "#CD7F32" : t === "Silver" && userPoints >= 500 ? "#94A3B8" : t === "Gold" && userPoints >= 1000 ? "#D4AF37" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </View>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6, fontFamily: "Inter_400Regular" }}>
            {userPoints < 500 ? `再累积 ${500 - userPoints} 积分升至 Silver` : userPoints < 1000 ? `再累积 ${1000 - userPoints} 积分升至 Gold` : "已达最高等级 Gold 🎉"}
          </Text>
        </View>

        {error !== null && (
          <Text style={{ fontSize: 13, color: colors.danger, marginBottom: 16, fontFamily: "Inter_400Regular" }}>{error}</Text>
        )}

        {/* Stamp card */}
        <View style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 20 }}>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 18, color: colors.text, marginBottom: 4 }}>集印章</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16, fontFamily: "Inter_400Regular" }}>
            集满9个印章即可获得特别奖励
          </Text>
          <StampGrid
            stamps={stamps}
            loading={stampsLoading}
            onSlotPress={(idx) => void handleStampClick(idx)}
          />
        </View>
      </ScrollView>
    </View>
  );
}
