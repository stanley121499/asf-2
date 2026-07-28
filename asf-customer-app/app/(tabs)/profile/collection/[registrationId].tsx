import { Image } from "expo-image";
import { Redirect, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Svg, { Circle } from "react-native-svg";

import { SubPageHeader } from "@/components/SubPageHeader";
import { fonts } from "@/constants/theme";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { useWarrantyRegistrationContext } from "@/context/WarrantyRegistrationContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { formatDate } from "@/i18n/format";
import { formatRm } from "@/lib/formatCurrency";
import { buildWarrantyMonthTabs } from "@/lib/warranty/buildWarrantyMonthTabs";
import {
  claimWarrantyRegistration,
  getWarrantyRegistration,
  getWarrantyRegistrationVoucher,
  type RegistrationPolicyTier,
  type RegistrationSummary,
  type WarrantyRegistrationVoucher,
} from "@/lib/warranty/warrantyRegistrationApi";

/**
 * Feature flag: dedicated `warranty_registration` (not `claims`).
 */
const FEATURE_FLAG_KEY = "warranty_registration" as const;
const CALENDAR_COLUMNS = 7;
const CALENDAR_GAP = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Relative position of a selected month tab versus the live warranty day. */
type MonthPhase = "current" | "past" | "future";

/**
 * Parses a `YYYY-MM-DD` purchase date at local midnight.
 */
function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/**
 * Computes elapsed local calendar days for the visual ring/tick state.
 * Claim eligibility continues to use the server-provided tier fields.
 */
function localCalendarDaysSince(purchaseDate: Date, now: Date): number {
  const purchaseDay = Date.UTC(
    purchaseDate.getFullYear(),
    purchaseDate.getMonth(),
    purchaseDate.getDate()
  );
  const currentDay = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  return Math.floor((currentDay - purchaseDay) / DAY_MS);
}

/**
 * Adds local calendar days without assuming every day is exactly 24 hours.
 */
function addLocalCalendarDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Returns progress through the current local calendar day from 0 to 1.
 */
function localDayProgress(now: Date): number {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  ).getTime();
  const duration = next - start;
  if (duration <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, (now.getTime() - start) / duration));
}

/**
 * Classifies a policy tier relative to days since purchase.
 */
function resolveMonthPhase(
  tier: RegistrationPolicyTier,
  daysSincePurchase: number
): MonthPhase {
  if (
    daysSincePurchase >= tier.daysFrom &&
    daysSincePurchase <= tier.daysTo
  ) {
    return "current";
  }
  if (daysSincePurchase > tier.daysTo) {
    return "past";
  }
  return "future";
}

/**
 * Finds the month tab that matches the live warranty day, defaulting to first.
 */
function findCurrentMonthIndex(
  policyTiers: readonly RegistrationPolicyTier[],
  daysSincePurchase: number
): number {
  const current = policyTiers.find(
    (tier) =>
      daysSincePurchase >= tier.daysFrom && daysSincePurchase <= tier.daysTo
  );
  if (current !== undefined) {
    return current.monthIndex;
  }
  const first = policyTiers[0];
  if (first === undefined) {
    return 1;
  }
  return first.monthIndex;
}

/**
 * Creates the exact payload encoded by the customer voucher QR.
 * Agent 5 scanners should parse this JSON object.
 */
export function createWarrantyVoucherQrPayload(
  voucher: WarrantyRegistrationVoucher
): string {
  return JSON.stringify({
    creditId: voucher.creditId,
    redemptionCode: voucher.redemptionCode,
  });
}

/**
 * Physical warranty registration detail — premium ownership hub.
 */
export default function CollectionDetailScreen(): React.ReactElement {
  const { isEnabled } = useFeatureFlags();
  const { t } = useTranslation();

  if (!isEnabled(FEATURE_FLAG_KEY)) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return <CollectionDetailContent title={t("collection.detailTitle")} />;
}

/**
 * Inner detail content only mounted while the registration feature is enabled.
 */
function CollectionDetailContent({
  title,
}: Readonly<{ title: string }>): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, loading: authLoading } = useAuthContext();
  const { registrations, refreshRegistrations } =
    useWarrantyRegistrationContext();
  const params = useLocalSearchParams<{ registrationId?: string | string[] }>();
  const { width } = useWindowDimensions();
  const [registration, setRegistration] =
    useState<RegistrationSummary | null>(null);
  const [voucher, setVoucher] =
    useState<WarrantyRegistrationVoucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dayProgress, setDayProgress] = useState(() =>
    localDayProgress(new Date())
  );
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(
    null
  );

  const registrationId = useMemo((): string | null => {
    const raw = params.registrationId;
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim();
    }
    if (
      Array.isArray(raw) &&
      typeof raw[0] === "string" &&
      raw[0].trim().length > 0
    ) {
      return raw[0].trim();
    }
    return null;
  }, [params.registrationId]);

  const loadDetail = useCallback(
    async (showRefresh: boolean): Promise<void> => {
      if (registrationId === null || user === null) {
        setLoading(false);
        return;
      }
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);
      try {
        const detailResult = await getWarrantyRegistration(registrationId);
        if (detailResult.ok === false) {
          setErrorMessage(detailResult.message);
          return;
        }
        setRegistration(detailResult.registration);
        const creditId = detailResult.registration.warrantyCreditId;
        if (creditId === null) {
          setVoucher(null);
          return;
        }
        const voucherResult = await getWarrantyRegistrationVoucher(creditId);
        if (voucherResult.ok === false) {
          setErrorMessage(voucherResult.message);
          setVoucher(null);
          return;
        }
        setVoucher(voucherResult.voucher);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [registrationId, user]
  );

  useEffect(() => {
    const cached =
      registrationId === null
        ? null
        : registrations.find((row) => row.id === registrationId) ?? null;
    if (cached !== null) {
      setRegistration(cached);
    }
    void loadDetail(false);
  }, [loadDetail, registrationId, registrations]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDayProgress(localDayProgress(new Date()));
    }, 60_000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  /**
   * Month 1–12 tabs from purchase calendar months; discount % from API tier sources.
   */
  const monthTabs = useMemo((): RegistrationPolicyTier[] => {
    if (registration === null) {
      return [];
    }
    return buildWarrantyMonthTabs({
      purchaseDate: registration.purchaseDate,
      maxWarrantyDays: registration.tier.maxWarrantyDays,
      originalPairPriceMyr: registration.originalPairPriceMyr,
      discountSources: registration.policyTiers,
    });
  }, [registration]);

  useEffect(() => {
    if (registration === null || monthTabs.length === 0) {
      return;
    }
    if (selectedMonthIndex !== null) {
      return;
    }
    setSelectedMonthIndex(
      findCurrentMonthIndex(monthTabs, registration.tier.daysSincePurchase)
    );
  }, [monthTabs, registration, selectedMonthIndex]);

  const handleClaim = useCallback(async (): Promise<void> => {
    if (registrationId === null || claiming) {
      return;
    }
    setClaiming(true);
    setErrorMessage(null);
    try {
      const result = await claimWarrantyRegistration(registrationId);
      if (result.ok === false) {
        const message =
          result.error === "ALREADY_CLAIMED"
            ? t("collection.claimAlreadyClaimed")
            : result.message;
        setErrorMessage(message);
        Alert.alert(t("collection.claimErrorTitle"), message);
        await loadDetail(true);
        return;
      }
      setRegistration(result.registration);
      setVoucher(result.credit);
      await refreshRegistrations();
      Alert.alert(
        t("collection.claimSuccessTitle"),
        t("collection.claimSuccessBody", {
          amount: formatRm(result.credit.amountMyr),
        })
      );
    } finally {
      setClaiming(false);
    }
  }, [
    claiming,
    loadDetail,
    refreshRegistrations,
    registrationId,
    t,
  ]);

  const showClaimConfirmation = useCallback((): void => {
    if (
      registration === null ||
      !registration.tier.claimable ||
      registration.tier.tierPercent === null ||
      registration.tier.estimatedCreditMyr === null
    ) {
      return;
    }
    Alert.alert(
      t("collection.claimConfirmTitle"),
      t("collection.claimConfirmBody", {
        amount: formatRm(registration.tier.estimatedCreditMyr),
        percent: registration.tier.tierPercent,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("collection.claimConfirmCta"),
          style: "destructive",
          onPress: () => {
            void handleClaim();
          },
        },
      ]
    );
  }, [handleClaim, registration, t]);

  if (authLoading || (loading && registration === null)) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.panel }}>
        <SubPageHeader title={title} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      </View>
    );
  }

  if (user === null) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const productName =
    registration?.productName !== null &&
    registration?.productName !== undefined &&
    registration.productName.trim().length > 0
      ? registration.productName
      : t("collection.productFallback");
  const storeName =
    registration?.purchaseStoreName !== null &&
    registration?.purchaseStoreName !== undefined &&
    registration.purchaseStoreName.trim().length > 0
      ? registration.purchaseStoreName
      : t("collection.storeUnknown");

  if (registration === null) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.panel }}>
        <SubPageHeader title={title} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <Text style={{ color: tokens.text, fontFamily: fonts.sans }}>
            {errorMessage ?? t("collection.notFound")}
          </Text>
        </View>
      </View>
    );
  }

  const purchaseDate = parseLocalDate(registration.purchaseDate);
  const visualDaysSincePurchase =
    purchaseDate === null
      ? registration.tier.daysSincePurchase
      : localCalendarDaysSince(purchaseDate, new Date());
  const daysSince = registration.tier.daysSincePurchase;
  const activeMonthIndex =
    selectedMonthIndex ?? findCurrentMonthIndex(monthTabs, daysSince);
  const selectedTier =
    monthTabs.find((tier) => tier.monthIndex === activeMonthIndex) ?? null;
  const selectedPhase =
    selectedTier === null
      ? null
      : resolveMonthPhase(selectedTier, daysSince);
  const isLiveOffer =
    selectedPhase === "current" &&
    registration.status === "active" &&
    registration.tier.claimable;

  /**
   * Calendar shows only the selected warranty month window (not the full year).
   */
  const calendarDays =
    selectedTier === null
      ? []
      : Array.from(
          {
            length: Math.max(0, selectedTier.daysTo - selectedTier.daysFrom + 1),
          },
          (_, index) => selectedTier.daysFrom + index
        );
  const availableCalendarWidth = Math.max(224, width - 48);
  const calendarCellSize = Math.floor(
    (availableCalendarWidth - CALENDAR_GAP * (CALENDAR_COLUMNS - 1)) /
      CALENDAR_COLUMNS
  );
  const heroHeight = Math.min(320, Math.round(width * 0.72));
  const qrPayload =
    voucher === null ? null : createWarrantyVoucherQrPayload(voucher);

  const offerHelper =
    selectedPhase === null || selectedTier === null
      ? t("collection.tierIneligible")
      : selectedPhase === "current"
        ? t("collection.offerClaimOnceHint")
        : selectedPhase === "past"
          ? t("collection.offerPeriodPassed")
          : t("collection.offerPeriodStartsIn", {
              count: Math.max(0, selectedTier.daysFrom - daysSince),
            });

  const offerTitle =
    selectedPhase === "current"
      ? t("collection.offerTitleNow")
      : selectedTier !== null
        ? t("collection.offerTitleMonth", {
            month: selectedTier.monthIndex,
          })
        : t("collection.offerTitleNow");

  return (
    <View style={{ flex: 1, backgroundColor: tokens.panel }}>
      <SubPageHeader title={title} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void loadDetail(true);
            }}
            tintColor={tokens.accent}
          />
        }
        contentContainerStyle={{ paddingBottom: 64 }}
      >
        {/* Hero */}
        <View
          style={{
            backgroundColor: tokens.bg,
            marginHorizontal: 16,
            marginTop: 8,
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: heroHeight,
              backgroundColor: tokens.panel,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {registration.productImageUrl !== null ? (
              <Image
                source={{ uri: registration.productImageUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="contain"
                transition={200}
              />
            ) : (
              <Text
                style={{
                  color: tokens.accent,
                  fontFamily: fonts.display,
                  fontSize: 56,
                }}
              >
                {productName.slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>

          <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 24 }}>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 11,
                color: tokens.muted,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              {registration.status === "active"
                ? t("collection.statusActive")
                : registration.status === "claimed"
                  ? t("collection.statusClaimed")
                  : registration.status === "expired"
                    ? t("collection.statusExpired")
                    : t("collection.statusVoid")}
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 28,
                color: tokens.text,
                marginTop: 8,
                lineHeight: 34,
              }}
            >
              {productName}
            </Text>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 13,
                color: tokens.muted,
                marginTop: 10,
                lineHeight: 19,
              }}
            >
              {t("collection.purchasedAt", {
                store: storeName,
                date: formatDate(locale, registration.purchaseDate),
              })}
            </Text>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 13,
                color: tokens.muted,
                marginTop: 4,
              }}
            >
              {t("collection.originalPrice", {
                amount: formatRm(registration.originalPairPriceMyr),
              })}
            </Text>
          </View>
        </View>

        {/* Month tabs + offer */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          {monthTabs.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                backgroundColor: tokens.bg,
                borderRadius: 12,
                padding: 4,
                gap: 2,
              }}
            >
              {monthTabs.map((tier) => {
                const isSelected = tier.monthIndex === activeMonthIndex;
                const phase = resolveMonthPhase(tier, daysSince);
                return (
                  <TouchableOpacity
                    key={tier.monthIndex}
                    onPress={() => {
                      setSelectedMonthIndex(tier.monthIndex);
                    }}
                    activeOpacity={0.75}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 9,
                      backgroundColor: isSelected ? tokens.text : "transparent",
                      minWidth: 88,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.sans,
                        fontSize: 13,
                        color: isSelected ? tokens.bg : tokens.muted,
                      }}
                    >
                      {t("collection.monthTab", { month: tier.monthIndex })}
                    </Text>
                    {phase === "current" ? (
                      <Text
                        style={{
                          fontFamily: fonts.sans,
                          fontSize: 10,
                          color: isSelected ? tokens.bg : tokens.accent,
                          marginTop: 2,
                          opacity: isSelected ? 0.75 : 1,
                        }}
                      >
                        {t("collection.monthCurrentBadge")}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={{ marginTop: 28 }}>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 12,
                color: tokens.muted,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              {offerTitle}
            </Text>

            {selectedTier !== null ? (
              <>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 44,
                    color: tokens.text,
                    marginTop: 10,
                    letterSpacing: -0.5,
                  }}
                >
                  {formatRm(selectedTier.estimatedCreditMyr)}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 15,
                    color: tokens.text,
                    marginTop: 6,
                  }}
                >
                  {t("collection.offerCreditLabel")}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 14,
                    color: tokens.muted,
                    marginTop: 12,
                    lineHeight: 20,
                  }}
                >
                  {t("collection.offerPercentOfPurchase", {
                    percent: selectedTier.discountPercent,
                    amount: formatRm(registration.originalPairPriceMyr),
                  })}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 13,
                    color: tokens.muted,
                    marginTop: 10,
                    lineHeight: 19,
                  }}
                >
                  {offerHelper}
                </Text>
                {selectedPhase === "current" ? (
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 12,
                      color: tokens.accent,
                      marginTop: 14,
                    }}
                  >
                    {t("collection.offerYouAreHere")}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 15,
                  color: tokens.muted,
                  marginTop: 14,
                  lineHeight: 22,
                }}
              >
                {t("collection.tierIneligible")}
              </Text>
            )}
          </View>

          {isLiveOffer &&
          registration.tier.estimatedCreditMyr !== null &&
          registration.tier.tierPercent !== null ? (
            <TouchableOpacity
              onPress={showClaimConfirmation}
              disabled={claiming}
              activeOpacity={0.85}
              style={{
                backgroundColor: tokens.text,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: 28,
                opacity: claiming ? 0.55 : 1,
              }}
            >
              {claiming ? (
                <ActivityIndicator color={tokens.bg} />
              ) : (
                <Text
                  style={{
                    color: tokens.bg,
                    fontFamily: fonts.sans,
                    fontSize: 15,
                    letterSpacing: 0.2,
                  }}
                >
                  {t("collection.claimOffer", {
                    amount: formatRm(registration.tier.estimatedCreditMyr),
                  })}
                </Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Quiet calendar */}
        <View style={{ paddingHorizontal: 16, marginTop: 40 }}>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 18,
              color: tokens.text,
            }}
          >
            {t("collection.calendarTitle")}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 12,
              color: tokens.muted,
              marginTop: 6,
              marginBottom: 18,
              lineHeight: 18,
            }}
          >
            {t("collection.calendarIntro", {
              date: formatDate(locale, registration.purchaseDate),
            })}
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: CALENDAR_GAP,
            }}
          >
            {calendarDays.map((dayIndex) => {
              const isPast = dayIndex < visualDaysSincePurchase;
              const isToday =
                dayIndex === visualDaysSincePurchase &&
                purchaseDate !== null &&
                dayIndex <= registration.tier.maxWarrantyDays;
              const warrantyDate =
                purchaseDate === null
                  ? null
                  : addLocalCalendarDays(purchaseDate, dayIndex);
              const accessibleDate =
                warrantyDate === null
                  ? String(dayIndex + 1)
                  : formatDate(locale, warrantyDate.toISOString());

              return (
                <View
                  key={dayIndex}
                  accessible
                  accessibilityLabel={
                    isPast
                      ? t("collection.calendarPastDay", {
                          date: accessibleDate,
                        })
                      : isToday
                        ? t("collection.calendarToday", {
                            date: accessibleDate,
                          })
                        : t("collection.calendarFutureDay", {
                            date: accessibleDate,
                          })
                  }
                  style={{
                    width: calendarCellSize,
                    height: calendarCellSize,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isToday ? (
                    <DayProgressRing
                      size={calendarCellSize}
                      progress={dayProgress}
                      label={dayIndex + 1}
                    />
                  ) : (
                    <View
                      style={{
                        width: calendarCellSize,
                        height: calendarCellSize,
                        borderRadius: calendarCellSize / 2,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: isPast ? tokens.accent : tokens.border,
                        backgroundColor: isPast ? "#FBF7EF" : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.sans,
                          fontSize: isPast ? 14 : 9,
                          color: isPast ? tokens.accent : tokens.muted,
                        }}
                      >
                        {isPast ? "✓" : dayIndex + 1}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 16,
            }}
          >
            <CalendarLegend color={tokens.accent} label={t("collection.completed")} />
            <CalendarLegend color={tokens.text} label={t("collection.today")} />
            <CalendarLegend color={tokens.border} label={t("collection.upcoming")} />
          </View>
        </View>

        {voucher !== null && qrPayload !== null ? (
          <View style={{ paddingHorizontal: 16, marginTop: 36 }}>
            <VoucherCard voucher={voucher} qrPayload={qrPayload} />
          </View>
        ) : null}

        {errorMessage !== null ? (
          <Text
            style={{
              color: tokens.danger,
              fontFamily: fonts.sans,
              fontSize: 13,
              lineHeight: 19,
              textAlign: "center",
              marginTop: 20,
              paddingHorizontal: 24,
            }}
          >
            {errorMessage}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

/**
 * Circular progress indicator for the current local day.
 */
function DayProgressRing({
  size,
  progress,
  label,
}: Readonly<{
  size: number;
  progress: number;
  label: number;
}>): React.ReactElement {
  const tokens = useThemeTokens();
  const strokeWidth = 2.5;
  const radius = Math.max(1, (size - strokeWidth * 2) / 2);
  const circumference = 2 * Math.PI * radius;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tokens.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tokens.text}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text
        style={{
          fontFamily: fonts.sans,
          color: tokens.text,
          fontSize: 9,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Compact calendar-state legend item.
 */
function CalendarLegend({
  color,
  label,
}: Readonly<{ color: string; label: string }>): React.ReactElement {
  const tokens = useThemeTokens();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: color,
          backgroundColor: color === tokens.border ? "transparent" : color,
        }}
      />
      <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Displays a registration voucher, including active QR or redeemed state.
 */
function VoucherCard({
  voucher,
  qrPayload,
}: Readonly<{
  voucher: WarrantyRegistrationVoucher;
  qrPayload: string;
}>): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const isUsed = voucher.status === "used";
  const isActive = voucher.status === "active";
  const channelLabel =
    voucher.redemptionChannel === "online"
      ? t("collection.voucherRedeemedOnline")
      : voucher.redemptionChannel === "in_store"
        ? t("collection.voucherRedeemedInStore")
        : t("collection.voucherRedeemed");

  return (
    <View
      style={{
        backgroundColor: tokens.bg,
        borderRadius: 20,
        padding: 24,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 1.1,
          color: isActive ? tokens.accent : tokens.muted,
        }}
      >
        {isUsed
          ? channelLabel
          : isActive
            ? t("collection.voucherReady")
            : t("collection.voucherUnavailable")}
      </Text>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 36,
          color: tokens.text,
          marginTop: 10,
        }}
      >
        {formatRm(voucher.amountMyr)}
      </Text>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 13,
          color: tokens.muted,
          marginTop: 4,
        }}
      >
        {t("collection.voucherPercent", {
          percent: voucher.approvedPercent,
        })}
      </Text>

      {isActive ? (
        <View
          style={{
            alignItems: "center",
            paddingVertical: 28,
          }}
        >
          <View
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: tokens.bg,
              borderWidth: 1,
              borderColor: tokens.border,
            }}
          >
            <QRCode value={qrPayload} size={200} color={tokens.text} />
          </View>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 12,
              color: tokens.muted,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            {t("collection.voucherScanHint")}
          </Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: tokens.panel,
            borderRadius: 12,
            padding: 16,
            marginVertical: 20,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 14,
              color: tokens.text,
              textAlign: "center",
            }}
          >
            {isUsed ? channelLabel : t("collection.voucherUnavailable")}
          </Text>
          {isUsed && voucher.usedAt !== null ? (
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 12,
                color: tokens.muted,
                textAlign: "center",
                marginTop: 5,
              }}
            >
              {formatDate(locale, voucher.usedAt)}
            </Text>
          ) : null}
        </View>
      )}

      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 11,
          color: tokens.muted,
          textTransform: "uppercase",
          letterSpacing: 1,
          textAlign: "center",
        }}
      >
        {t("collection.backupCode")}
      </Text>
      <Text
        selectable
        style={{
          fontFamily: fonts.sans,
          fontSize: 24,
          color: tokens.text,
          letterSpacing: 4,
          textAlign: "center",
          marginTop: 8,
        }}
      >
        {voucher.redemptionCode}
      </Text>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 12,
          color: tokens.muted,
          textAlign: "center",
          marginTop: 14,
        }}
      >
        {t("collection.voucherExpires", {
          date: formatDate(locale, voucher.expiresAt),
        })}
      </Text>
    </View>
  );
}
