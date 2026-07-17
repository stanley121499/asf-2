import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SubPageHeader } from "@/components/SubPageHeader";
import { useAuthContext } from "@/context/AuthContext";
import { useClaimContext, type ClaimItem } from "@/context/ClaimContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { formatClaimLabel } from "@/lib/claims/claimEligibility";
import {
  getClaimResolutionLabel,
  getClaimStatusLabel,
  getClaimTypeLabel,
} from "@/lib/claims/claimPolicyConfig";
import { formatDate } from "@/i18n/format";
import { formatRm } from "@/lib/formatCurrency";
import { calculateCreditAmount } from "@/lib/warranty/calculateCreditAmount";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

/**
 * Customer claim detail — per-item estimates and issued credits after approval.
 */
export default function ClaimDetailScreen(): React.ReactElement {
  const { claimId } = useLocalSearchParams<{ claimId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { claims, fetchClaimItems } = useClaimContext();

  const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);
  const [itemProductNames, setItemProductNames] = useState<Record<string, string>>({});
  const [itemsLoading, setItemsLoading] = useState(true);

  const claim = useMemo(() => {
    if (typeof claimId !== "string" || user === null) {
      return null;
    }
    return claims.find((c) => c.id === claimId && c.user_id === user.id) ?? null;
  }, [claims, claimId, user]);

  useEffect(() => {
    if (typeof claimId !== "string" || claimId.length === 0) {
      setItemsLoading(false);
      return;
    }
    let cancelled = false;
    void fetchClaimItems(claimId).then(async (items) => {
      if (cancelled) {
        return;
      }
      setClaimItems(items);
      const productIds = items
        .map((i) => i.product_id)
        .filter((id): id is string => typeof id === "string");
      if (productIds.length === 0) {
        setItemProductNames({});
        setItemsLoading(false);
        return;
      }
      const { data } = await supabase.from("products").select("id, name").in("id", productIds);
      const map: Record<string, string> = {};
      for (const p of data ?? []) {
        map[p.id] = p.name;
      }
      if (!cancelled) {
        setItemProductNames(map);
        setItemsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [claimId, fetchClaimItems]);

  if (!isEnabled("claims")) {
    return <Redirect href="/(tabs)/profile" />;
  }

  if (authLoading || user === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.panel }}>
        <SubPageHeader title={t("claims.detailTitle")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (claim === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.panel }}>
        <SubPageHeader title={t("claims.detailTitle")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16, fontFamily: "Inter_400Regular" }}>
            {t("claims.notFound")}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile/claims")}>
            <Text style={{ fontSize: 14, color: colors.text, textDecorationLine: "underline", fontFamily: "Inter_400Regular" }}>
              {t("claims.backToList")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const typeLabel = getClaimTypeLabel(claim.claim_type, t);
  const isApproved = claim.status === "approved" || claim.status === "resolved";
  const headerTitle = formatClaimLabel(claim.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.panel }}>
      <SubPageHeader title={headerTitle} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular" }}>{t("claims.status")}</Text>
          <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text, marginTop: 4, fontFamily: "Inter_400Regular" }}>
            {getClaimStatusLabel(claim.status, t)}
          </Text>
        </View>

        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular" }}>{t("claims.type")}</Text>
          <Text style={{ fontSize: 15, color: colors.text, marginTop: 4, fontFamily: "Inter_400Regular" }}>{typeLabel}</Text>
          {typeof claim.created_at === "string" && claim.created_at.length > 0 ? (
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8, fontFamily: "Inter_400Regular" }}>
              {formatDate(locale, claim.created_at)}
            </Text>
          ) : null}
        </View>

        {claimItems.length > 0 ? (
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 12, fontFamily: "Inter_400Regular" }}>
              {t("claims.items")}
            </Text>
            {itemsLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              claimItems.map((item, idx) => {
                const name =
                  item.product_id !== null
                    ? (itemProductNames[item.product_id] ?? t("claims.productFallback"))
                    : t("claims.productFallback");
                const recommended = item.recommended_percent;
                const estimated =
                  recommended !== null
                    ? calculateCreditAmount(Number(item.line_item_price_myr), Number(recommended))
                    : 0;
                return (
                  <View
                    key={item.id}
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: idx < claimItems.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, fontFamily: "Inter_400Regular" }}>
                      {name}
                    </Text>
                    {recommended !== null && !isApproved ? (
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, fontFamily: "Inter_400Regular" }}>
                        {t("claims.estimatedCredit")}:{" "}
                        {t("claims.estimatedCreditDetail", {
                          amount: estimated.toFixed(2),
                          percent: Number(recommended).toFixed(0),
                        })}
                      </Text>
                    ) : null}
                    {recommended === null && !isApproved ? (
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, fontFamily: "Inter_400Regular" }}>
                        {t("claims.staffWillDetermine")}
                      </Text>
                    ) : null}
                    {item.credit_amount_myr !== null && isApproved ? (
                      <Text style={{ fontSize: 12, color: colors.success, marginTop: 6, fontFamily: "Inter_400Regular" }}>
                        {t("claims.issuedCredit")}: {formatRm(Number(item.credit_amount_myr))}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {typeof claim.description === "string" && claim.description.length > 0 ? (
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular" }}>{t("claims.description")}</Text>
            <Text style={{ fontSize: 14, color: colors.text, marginTop: 6, lineHeight: 22, fontFamily: "Inter_400Regular" }}>
              {claim.description}
            </Text>
          </View>
        ) : null}

        {claim.requested_resolution !== null ? (
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular" }}>{t("claims.requestedResolution")}</Text>
            <Text style={{ fontSize: 14, color: colors.text, marginTop: 4, fontFamily: "Inter_400Regular" }}>
              {getClaimResolutionLabel(claim.requested_resolution, t)}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
