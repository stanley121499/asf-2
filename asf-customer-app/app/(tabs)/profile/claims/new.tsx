import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ClaimEvidencePicker,
  ClaimEvidenceUploadProgress,
} from "@/components/claims/ClaimEvidencePicker";
import { SubPageHeader } from "@/components/SubPageHeader";
import { useAlertContext } from "@/context/AlertContext";
import { useAuthContext } from "@/context/AuthContext";
import { useClaimContext } from "@/context/ClaimContext";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation, useLocale } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import type { Database } from "@/database.types";
import {
  createClaimEvidenceSessionId,
  uploadClaimEvidencePhotos,
} from "@/lib/claims/claimEvidenceStorage";
import { evaluateClaimEligibility, formatClaimEligibilityReason } from "@/lib/claims/claimEligibility";
import {
  claimPolicyConfig,
  getClaimResolutionLabel,
  getClaimTypeLabel,
  type ClaimResolution,
} from "@/lib/claims/claimPolicyConfig";
import type { PickedClaimPhoto } from "@/lib/claims/pickClaimPhotos";
import { evaluateWarrantyCreditEstimate, type WarrantyCreditEstimate } from "@/lib/warranty/evaluateWarrantyCreditEstimate";
import { resolveDeliveryDate } from "@/lib/warranty/resolveDeliveryDate";
import { supabase } from "@/lib/supabase";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

interface OrderItemWithProduct extends OrderItemRow {
  products: { id: string; name: string } | null;
}

/**
 * Multi-item claim submission form.
 */
export default function NewClaimScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const router = useRouter();
  const { orderId: orderIdParam, orderItemIds: orderItemIdsParam } = useLocalSearchParams<{
    orderId?: string;
    orderItemIds?: string;
  }>();
  const orderId = typeof orderIdParam === "string" ? orderIdParam : "";
  const orderItemIds = useMemo(() => {
    const raw = typeof orderItemIdsParam === "string" ? orderItemIdsParam : "";
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }, [orderItemIdsParam]);

  const { t } = useTranslation();
  const { locale } = useLocale();
  const { translateProduct } = useContentTranslation();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { showAlert } = useAlertContext();
  const { createClaimWithItems } = useClaimContext();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemWithProduct[]>([]);
  const [estimates, setEstimates] = useState<WarrantyCreditEstimate[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [claimType, setClaimType] = useState(claimPolicyConfig.claimTypes[0]?.key ?? "");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [requestedResolution, setRequestedResolution] = useState<ClaimResolution>("replacement");
  const [evidencePhotos, setEvidencePhotos] = useState<PickedClaimPhoto[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ uploaded: number; total: number } | null>(null);
  const evidenceSessionIdRef = useRef(createClaimEvidenceSessionId());

  useEffect(() => {
    if (authLoading || user === null || orderId.length === 0 || orderItemIds.length === 0) {
      setFetchLoading(false);
      return;
    }
    const userId = user.id;
    let cancelled = false;

    void (async (): Promise<void> => {
      setFetchLoading(true);
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (orderError !== null || orderData === null) {
        setFetchLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*, products(id, name)")
        .eq("order_id", orderId)
        .in("id", orderItemIds);

      if (cancelled) {
        return;
      }

      if (itemsError !== null || itemsData === null || itemsData.length === 0) {
        setOrder(null);
        setOrderItems([]);
        setFetchLoading(false);
        return;
      }

      setOrder(orderData);
      setOrderItems(itemsData as OrderItemWithProduct[]);
      setFetchLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, orderId, orderItemIds]);

  useEffect(() => {
    if (order === null || orderItemIds.length === 0 || claimType.length === 0) {
      setEstimates([]);
      return;
    }
    let cancelled = false;

    void (async (): Promise<void> => {
      const results: WarrantyCreditEstimate[] = [];
      for (const itemId of orderItemIds) {
        const est = await evaluateWarrantyCreditEstimate(supabase, claimType, orderId, itemId);
        results.push(est);
      }
      if (!cancelled) {
        setEstimates(results);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, orderItemIds, claimType, order]);

  const selectedTypeConfig = useMemo(
    () => claimPolicyConfig.claimTypes.find((ct) => ct.key === claimType),
    [claimType]
  );

  const eligibility = useMemo(() => {
    if (order === null) {
      return null;
    }
    return evaluateClaimEligibility(claimType, order.status, order.created_at);
  }, [order, claimType]);

  const estimateByItemId = useMemo(() => {
    const map = new Map<string, WarrantyCreditEstimate>();
    for (const est of estimates) {
      map.set(est.orderItemId, est);
    }
    return map;
  }, [estimates]);

  const handleSubmit = async (): Promise<void> => {
    if (user === null || order === null || selectedTypeConfig === undefined) {
      return;
    }
    if (eligibility !== null && !eligibility.eligible) {
      showAlert(formatClaimEligibilityReason(eligibility, t, locale), "warning");
      return;
    }

    const descTrimmed = description.trim();
    if (descTrimmed.length === 0) {
      showAlert(t("claims.description"), "warning");
      return;
    }

    if (selectedTypeConfig.requiresPhotos && evidencePhotos.length === 0) {
      showAlert(t("claims.evidenceRequired"), "warning");
      return;
    }

    setSubmitting(true);
    try {
      let evidenceUrls: string[] = [];

      if (evidencePhotos.length > 0) {
        setUploadProgress({ uploaded: 0, total: evidencePhotos.length });
        try {
          evidenceUrls = await uploadClaimEvidencePhotos(
            evidencePhotos,
            user.id,
            evidenceSessionIdRef.current,
            (uploaded, total) => {
              setUploadProgress({ uploaded, total });
            }
          );
        } catch (uploadError) {
          const message =
            uploadError instanceof Error ? uploadError.message : t("claims.uploadFailed");
          showAlert(message, "error");
          return;
        } finally {
          setUploadProgress(null);
        }
      }

      const { deliveryDate } = await resolveDeliveryDate(supabase, order.id);

      const created = await createClaimWithItems(
        {
          user_id: user.id,
          order_id: order.id,
          order_item_id: orderItems[0]?.id ?? null,
          product_id: orderItems[0]?.product_id ?? null,
          claim_type: claimType,
          status: "submitted",
          reason: reason.trim().length > 0 ? reason.trim() : null,
          description: descTrimmed,
          evidence_urls: evidenceUrls,
          requested_resolution: requestedResolution,
          eligibility_start_at: deliveryDate,
        },
        orderItems.map((item) => {
          const est = estimateByItemId.get(item.id);
          const linePrice = Number(item.amount ?? 0);
          return {
            orderItemId: item.id,
            productId: item.product_id,
            lineItemPriceMyr: est?.lineItemPriceMyr ?? linePrice,
            daysSinceDelivery: est?.daysSinceDelivery ?? null,
            recommendedPercent: est?.recommendedPercent ?? null,
          };
        })
      );

      if (created === undefined) {
        return;
      }

      showAlert(t("claims.submittedMessage"), "success");
      router.replace(`/(tabs)/profile/claims/${created.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isEnabled("claims")) {
    return <Redirect href="/(tabs)/profile" />;
  }

  if (authLoading || user === null || fetchLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.panel }}>
        <SubPageHeader title={t("claims.newTitle")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      </View>
    );
  }

  if (order === null || orderItems.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.panel }}>
        <SubPageHeader title={t("claims.newTitle")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
            {t("orders.notFound")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.panel }}>
      <SubPageHeader title={t("claims.newTitle")} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {orderItems.map((item) => {
          const est = estimateByItemId.get(item.id);
          const product = item.products;
          const translatedName =
            product !== null
              ? translateProduct(product.id, "name", product.name)
              : "";
          const displayName =
            translatedName.length > 0
              ? translatedName
              : t("claims.productFallback");
          return (
            <View
              key={item.id}
              style={{
                backgroundColor: tokens.bg,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: tokens.border,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "500", color: tokens.text, fontFamily: "Inter_400Regular" }}>
                {displayName}
              </Text>
              {est !== undefined ? (
                <Text style={{ fontSize: 12, color: tokens.muted, marginTop: 8, fontFamily: "Inter_400Regular" }}>
                  {est.usesAutoTier && est.estimatedCreditMyr > 0
                    ? `${t("claims.estimatedCredit")}: ${t("claims.estimatedCreditDetail", {
                        amount: est.estimatedCreditMyr.toFixed(2),
                        percent: est.recommendedPercent !== null ? Number(est.recommendedPercent).toFixed(0) : "0",
                      })}`
                    : t("claims.staffWillDetermine")}
                </Text>
              ) : null}
            </View>
          );
        })}

        {eligibility !== null ? (
          <Text
            style={{
              fontSize: 12,
              color: eligibility.eligible ? tokens.success : tokens.danger,
              marginBottom: 12,
              fontFamily: "Inter_400Regular",
            }}
          >
            {eligibility !== null ? formatClaimEligibilityReason(eligibility, t, locale) : null}
          </Text>
        ) : null}

        <View style={{ backgroundColor: tokens.bg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: tokens.border }}>
          <Text style={{ fontSize: 13, color: tokens.muted, marginBottom: 8, fontFamily: "Inter_400Regular" }}>
            {t("claims.selectClaimType")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {claimPolicyConfig.claimTypes.map((ct) => (
              <TouchableOpacity
                key={ct.key}
                onPress={() => setClaimType(ct.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: claimType === ct.key ? tokens.text : tokens.border,
                  backgroundColor: claimType === ct.key ? tokens.text : tokens.bg,
                }}
              >
                <Text style={{ fontSize: 12, color: claimType === ct.key ? tokens.bg : tokens.text, fontFamily: "Inter_400Regular" }}>
                  {getClaimTypeLabel(ct.key, t)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 13, color: tokens.muted, marginBottom: 6, fontFamily: "Inter_400Regular" }}>
            {t("claims.reason")}
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            style={{
              height: 44,
              borderWidth: 1,
              borderColor: tokens.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 16,
              fontSize: 14,
              color: tokens.text,
              fontFamily: "Inter_400Regular",
            }}
          />

          <Text style={{ fontSize: 13, color: tokens.muted, marginBottom: 6, fontFamily: "Inter_400Regular" }}>
            {t("claims.description")}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{
              minHeight: 100,
              borderWidth: 1,
              borderColor: tokens.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 16,
              fontSize: 14,
              color: tokens.text,
              textAlignVertical: "top",
              fontFamily: "Inter_400Regular",
            }}
          />

          {selectedTypeConfig !== undefined ? (
            <>
              <Text style={{ fontSize: 13, color: tokens.muted, marginBottom: 8, fontFamily: "Inter_400Regular" }}>
                {t("claims.requestedResolution")}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {selectedTypeConfig.allowedResolutions.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRequestedResolution(r)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 99,
                      borderWidth: 1,
                      borderColor: requestedResolution === r ? tokens.text : tokens.border,
                      backgroundColor: requestedResolution === r ? tokens.text : tokens.bg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: requestedResolution === r ? tokens.bg : tokens.text,
                        fontFamily: "Inter_400Regular",
                      }}
                    >
                      {getClaimResolutionLabel(r, t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          <Text style={{ fontSize: 13, color: tokens.muted, marginBottom: 6, fontFamily: "Inter_400Regular" }}>
            {t("claims.evidence")}
          </Text>
          <Text style={{ fontSize: 11, color: tokens.muted, marginBottom: 10, fontFamily: "Inter_400Regular" }}>
            {t("claims.evidenceHint")}
          </Text>
          <ClaimEvidencePicker
            photos={evidencePhotos}
            onChange={setEvidencePhotos}
            disabled={submitting}
          />
          {uploadProgress !== null ? (
            <ClaimEvidenceUploadProgress
              uploaded={uploadProgress.uploaded}
              total={uploadProgress.total}
            />
          ) : null}

          <TouchableOpacity
            onPress={() => void handleSubmit()}
            disabled={submitting || (eligibility !== null && !eligibility.eligible)}
            style={{
              height: 52,
              backgroundColor: tokens.text,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              opacity: submitting || (eligibility !== null && !eligibility.eligible) ? 0.5 : 1,
            }}
          >
            <Text style={{ color: tokens.bg, fontSize: 15, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
              {uploadProgress !== null
                ? t("claims.uploadingPhotos", {
                    current: uploadProgress.uploaded,
                    total: uploadProgress.total,
                  })
                : submitting
                  ? t("claims.submitting")
                  : t("claims.submit")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
