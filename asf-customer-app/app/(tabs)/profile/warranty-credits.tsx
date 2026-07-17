import { Redirect } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SubPageHeader } from "@/components/SubPageHeader";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { useWarrantyCreditContext } from "@/context/WarrantyCreditContext";
import { formatClaimLabel } from "@/lib/claims/claimEligibility";
import { formatDate } from "@/i18n/format";
import { formatRm } from "@/lib/formatCurrency";
import { colors } from "@/constants/theme";

type CreditTab = "active" | "used" | "expired";

/**
 * Customer warranty credits list — active, used, and expired tabs.
 */
export default function WarrantyCreditsScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { credits, loading } = useWarrantyCreditContext();
  const [tab, setTab] = useState<CreditTab>("active");

  const filtered = useMemo(() => {
    const now = Date.now();
    return credits.filter((c) => {
      const expires = new Date(c.expiresAt).getTime();
      const isExpired = c.status === "expired" || (Number.isFinite(expires) && expires < now);
      if (tab === "used") {
        return c.status === "used";
      }
      if (tab === "expired") {
        return isExpired || c.status === "revoked";
      }
      return c.status === "active" && !isExpired;
    });
  }, [credits, tab]);

  if (!isEnabled("claims")) {
    return <Redirect href="/(tabs)/profile" />;
  }

  if (authLoading || user === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.panel }}>
        <SubPageHeader title={t("warrantyCredits.title")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  const tabs: { key: CreditTab; label: string }[] = [
    { key: "active", label: t("warrantyCredits.tabActive") },
    { key: "used", label: t("warrantyCredits.tabUsed") },
    { key: "expired", label: t("warrantyCredits.tabExpired") },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.panel }}>
      <SubPageHeader title={t("warrantyCredits.title")} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {tabs.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setTab(item.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 99,
                borderWidth: 1,
                borderColor: tab === item.key ? "#000000" : colors.border,
                backgroundColor: tab === item.key ? "#000000" : "#FFFFFF",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: tab === item.key ? "#FFFFFF" : colors.text,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
        ) : filtered.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: colors.muted,
              fontSize: 14,
              marginTop: 48,
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("warrantyCredits.empty")}
          </Text>
        ) : (
          filtered.map((credit) => {
            const statusLabel =
              credit.status === "used"
                ? t("warrantyCredits.statusUsed")
                : credit.status === "revoked"
                  ? t("warrantyCredits.statusRevoked")
                  : tab === "expired"
                    ? t("warrantyCredits.statusExpired")
                    : t("warrantyCredits.statusActive");

            const footer =
              credit.status === "used" && credit.usedAt !== null
                ? t("warrantyCredits.usedOn", {
                    date: formatDate(locale, credit.usedAt),
                  })
                : t("warrantyCredits.expiresOn", {
                    date: formatDate(locale, credit.expiresAt),
                  });

            return (
              <View
                key={credit.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text, fontFamily: "Inter_400Regular" }}>
                      {formatRm(credit.amountMyr)}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, fontFamily: "Inter_400Regular" }}>
                      {credit.productName}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8, fontFamily: "Inter_400Regular" }}>
                      {t("warrantyCredits.fromClaim", { label: formatClaimLabel(credit.claimId) })}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.muted, textTransform: "uppercase", fontFamily: "Inter_400Regular" }}>
                    {statusLabel}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 12, fontFamily: "Inter_400Regular" }}>
                  {footer}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
