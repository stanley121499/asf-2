import { Redirect, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SubPageHeader } from "@/components/SubPageHeader";
import { useAuthContext } from "@/context/AuthContext";
import { useClaimContext } from "@/context/ClaimContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { formatClaimLabel } from "@/lib/claims/claimEligibility";
import { getClaimStatusLabel, getClaimTypeLabel } from "@/lib/claims/claimPolicyConfig";
import { formatDate } from "@/i18n/format";
import { colors } from "@/constants/theme";

/**
 * Customer claims list.
 */
export default function ClaimsListScreen(): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { claims, loading } = useClaimContext();

  const mine = useMemo(() => {
    if (user === null) {
      return [];
    }
    return claims.filter((c) => c.user_id === user.id);
  }, [claims, user]);

  if (!isEnabled("claims")) {
    return <Redirect href="/(tabs)/profile" />;
  }

  if (authLoading || user === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.panel }}>
        <SubPageHeader title={t("claims.title")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.panel }}>
      <SubPageHeader title={t("claims.title")} />
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : mine.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 18, color: colors.text, marginBottom: 8 }}>
            {t("claims.empty")}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", fontFamily: "Inter_400Regular" }}>
            {t("claims.emptyBody")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={mine}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          renderItem={({ item }) => {
            const typeLabel = getClaimTypeLabel(item.claim_type, t);
            const created =
              typeof item.created_at === "string" && item.created_at.length > 0
                ? formatDate(locale, item.created_at)
                : "";
            return (
              <TouchableOpacity
                onPress={() => router.push(`/(tabs)/profile/claims/${item.id}`)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, fontFamily: "Inter_400Regular" }}>
                    {formatClaimLabel(item.id)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular" }}>
                    {created}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, fontFamily: "Inter_400Regular" }}>
                  {typeLabel}
                </Text>
                <Text style={{ fontSize: 13, color: colors.accent, marginTop: 4, fontFamily: "Inter_400Regular" }}>
                  {getClaimStatusLabel(item.status, t)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
