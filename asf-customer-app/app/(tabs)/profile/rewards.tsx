import { Redirect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubPageHeader } from "@/components/SubPageHeader";
import { StampGrid } from "@/components/StampGrid";
import { ANCHORS, TourAnchor } from "@/components/guide";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import { useTheme, useThemeTokens } from "@/context/ThemeContext";
import { getErrorTranslationKey } from "@/i18n/errorMap";
import { supabase } from "@/lib/supabase";

const STAMP_SLOT_COUNT = 9;

type TierKey = "bronze" | "silver" | "gold";

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
 * Resolves membership tier from point balance.
 */
function resolveTier(points: number): TierKey {
  if (points >= 1000) return "gold";
  if (points >= 500) return "silver";
  return "bronze";
}

/**
 * Rewards screen — sticky header, points card with tier, 3×3 stamp grid.
 * Classic keeps the inverted dark points card; Noir uses panel + on-token type.
 */
export default function RewardsScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { themeId } = useTheme();
  const isNoir = themeId === "noir";
  const { t } = useTranslation();
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
    if (authLoading || typeof user?.id !== "string") {
      setStamps(createEmptyStamps());
      return;
    }
    let cancelled = false;
    const run = async (): Promise<void> => {
      setStampsLoading(true);
      setError(null);
      try {
        const next = await loadOrCreateUserStamps(user.id);
        if (!cancelled) setStamps(next);
      } catch (err) {
        if (!cancelled) {
          const raw = err instanceof Error ? err.message : "";
          setError(raw.length > 0 ? t(getErrorTranslationKey(raw)) : t("rewards.stampsLoadFailed"));
          setStamps(createEmptyStamps());
        }
      } finally {
        if (!cancelled) setStampsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, t]);

  const handleStampClick = useCallback(async (index: number) => {
    if (typeof user?.id !== "string" || stampsLoading || stamps[index]) return;
    const previous = stamps;
    const newStamps = [...stamps];
    newStamps[index] = true;
    setStamps(newStamps);
    const { error: upErr } = await supabase
      .from("user_stamps")
      .update({ stamps: newStamps, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (upErr) {
      setStamps(previous);
      setError(t(getErrorTranslationKey(upErr.message)));
    }
  }, [stamps, stampsLoading, user?.id, t]);

  const tierKey = resolveTier(userPoints);
  const tierName =
    tierKey === "gold"
      ? t("rewards.tierGoldName")
      : tierKey === "silver"
        ? t("rewards.tierSilverName")
        : t("rewards.tierBronzeName");
  const tierColor = tierKey === "gold" ? "#D4AF37" : tierKey === "silver" ? "#94A3B8" : "#CD7F32";

  const progressHint =
    userPoints < 500
      ? t("rewards.gapToSilver", { count: 500 - userPoints })
      : userPoints < 1000
        ? t("rewards.gapToGoldHint", { count: 1000 - userPoints })
        : t("rewards.maxTierCelebrated");

  const tierBars: ReadonlyArray<{ key: TierKey; active: boolean; color: string }> = [
    { key: "bronze", active: userPoints >= 0, color: "#CD7F32" },
    { key: "silver", active: userPoints >= 500, color: "#94A3B8" },
    { key: "gold", active: userPoints >= 1000, color: "#D4AF37" },
  ];

  /** Secondary label on the points card — white wash on Classic dark fill; muted token on Noir. */
  const pointsSecondaryColor = isNoir ? tokens.muted : "rgba(255,255,255,0.6)";
  /** Progress hint — quieter than unit label on Classic; muted on Noir. */
  const pointsHintColor = isNoir ? tokens.muted : "rgba(255,255,255,0.4)";
  /** Inactive tier bar track. */
  const tierTrackInactive = isNoir ? tokens.border : "rgba(255,255,255,0.15)";

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <SubPageHeader title={t("rewards.title")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      </View>
    );
  }

  if (user === null) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <SubPageHeader title={t("rewards.title")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
            {t("rewards.loginRequired")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <SubPageHeader title={t("rewards.title")} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Points card — Classic: inverted dark plate; Noir: panel + readable on-token type */}
        <TourAnchor id={ANCHORS.rewards.pointsCard}>
          <View
            style={
              isNoir
                ? {
                    backgroundColor: tokens.panel,
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: tokens.border,
                    padding: 24,
                    marginBottom: 24,
                  }
                : {
                    backgroundColor: tokens.text,
                    borderRadius: 20,
                    padding: 24,
                    marginBottom: 24,
                  }
            }
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Ionicons name="star" size={16} color={tierColor} />
              <Text style={{ fontSize: 14, color: tierColor, fontWeight: "600", fontFamily: "Inter_400Regular" }}>{tierName}</Text>
            </View>
            <Text
              style={{
                fontSize: 40,
                fontWeight: "700",
                color: isNoir ? tokens.text : tokens.bg,
                fontFamily: "Inter_400Regular",
              }}
            >
              {userPoints.toLocaleString()}
            </Text>
            <Text style={{ fontSize: 13, color: pointsSecondaryColor, marginTop: 4, fontFamily: "Inter_400Regular" }}>
              {t("rewards.pointsUnit")}
            </Text>

            {/* Tier progress hints */}
            <View style={{ marginTop: 16, flexDirection: "row", gap: 8 }}>
              {tierBars.map((bar) => (
                <View
                  key={bar.key}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: bar.active ? bar.color : tierTrackInactive,
                  }}
                />
              ))}
            </View>
            <Text style={{ fontSize: 11, color: pointsHintColor, marginTop: 6, fontFamily: "Inter_400Regular" }}>
              {progressHint}
            </Text>
          </View>
        </TourAnchor>

        {error !== null && (
          <Text style={{ fontSize: 13, color: tokens.danger, marginBottom: 16, fontFamily: "Inter_400Regular" }}>{error}</Text>
        )}

        {/* Stamp card — panel under Noir so it lifts off bg; Inter title */}
        <TourAnchor id={ANCHORS.rewards.stampCard}>
          <View
            style={
              isNoir
                ? {
                    backgroundColor: tokens.panel,
                    borderWidth: 1,
                    borderColor: tokens.border,
                    borderRadius: 2,
                    padding: 20,
                  }
                : {
                    backgroundColor: tokens.bg,
                    borderWidth: 1,
                    borderColor: tokens.border,
                    borderRadius: 20,
                    padding: 20,
                  }
            }
          >
            <Text
              style={{
                fontFamily: isNoir ? "Inter_400Regular" : "PlayfairDisplay_400Regular",
                fontSize: isNoir ? 16 : 18,
                fontWeight: isNoir ? "600" : "400",
                letterSpacing: isNoir ? 0.5 : 0,
                color: tokens.text,
                marginBottom: 4,
              }}
            >
              {t("rewards.stampsTitle")}
            </Text>
            <Text style={{ fontSize: 13, color: tokens.muted, marginBottom: 16, fontFamily: "Inter_400Regular" }}>
              {t("rewards.stampsHint")}
            </Text>
            <StampGrid
              stamps={stamps}
              loading={stampsLoading}
              onSlotPress={(idx) => void handleStampClick(idx)}
            />
          </View>
        </TourAnchor>
      </ScrollView>
    </View>
  );
}
