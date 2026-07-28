import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PressableScale } from "@/components/motion";
import {
  ANCHORS,
  FIRST_LAUNCH_TOUR_ID,
  TourAnchor,
  useGuide,
} from "@/components/guide";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import { useTheme, useThemeTokens } from "@/context/ThemeContext";
import type { Locale } from "@/i18n/types";
import { resetFirstGuide } from "@/lib/appGuide";
import { supabase } from "@/lib/supabase";
import type { ThemeTokens } from "@/themes/types";

/**
 * Narrow non-empty string guard for profile name fields.
 */
function isNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

interface MenuRowProps {
  label: string;
  onPress: () => void;
  borderBottom?: boolean;
  badge?: string;
  tokens: ThemeTokens;
}

/**
 * Quiet editorial menu row — text index + arrow, no icon column / card chrome.
 * Matches Home category index language.
 */
function MenuRow({
  label,
  onPress,
  borderBottom = true,
  badge,
  tokens,
}: MenuRowProps): React.ReactElement {
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        borderBottomWidth: borderBottom ? 1 : 0,
        borderBottomColor: tokens.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 16,
          gap: 12,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 16,
            color: tokens.text,
            fontFamily: "Inter_400Regular",
          }}
        >
          {label}
        </Text>
        {badge !== undefined ? (
          <Text
            style={{
              fontSize: 12,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
            }}
          >
            {badge}
          </Text>
        ) : null}
        <Ionicons name="arrow-forward" size={14} color={tokens.muted} />
      </View>
    </PressableScale>
  );
}

interface SectionHeaderProps {
  title: string;
  hint?: string;
  tokens: ThemeTokens;
}

/**
 * Editorial section label — Playfair title + optional muted hint (Home index).
 */
function SectionHeader({
  title,
  hint,
  tokens,
}: SectionHeaderProps): React.ReactElement {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text
        style={{
          fontFamily: "PlayfairDisplay_400Regular",
          fontSize: 22,
          color: tokens.text,
          marginBottom: hint !== undefined ? 6 : 0,
        }}
      >
        {title}
      </Text>
      {hint !== undefined ? (
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            color: tokens.muted,
            marginBottom: 8,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

interface LanguageOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  borderBottom?: boolean;
  tokens: ThemeTokens;
}

/**
 * Language option row inside the selector modal.
 */
function LanguageOption({
  label,
  selected,
  onPress,
  borderBottom = true,
  tokens,
}: LanguageOptionProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: borderBottom ? 1 : 0,
        borderBottomColor: tokens.border,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: selected ? "600" : "400",
          color: tokens.text,
          fontFamily: "Inter_400Regular",
        }}
      >
        {label}
      </Text>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={tokens.accent} />
      ) : (
        <Ionicons name="ellipse-outline" size={22} color={tokens.border} />
      )}
    </TouchableOpacity>
  );
}

/**
 * Atelier Profile hub — editorial header + text-index list (Tier A).
 *
 * Same paper / Playfair language as Home. Not a Classic bordered card stack
 * recolored. Cart is FAB (no header bag). SUPERADMIN-only Appearance entry.
 */
export function AtelierProfileHubScreen(): React.ReactElement {
  const router = useRouter();
  const tokens = useThemeTokens();
  const { user, user_detail, signOut, loading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const pointsAPI = usePointsMembership();
  const { t, locale, setLocale } = useTranslation();
  const { themeId } = useTheme();
  const { startTour, activeStep } = useGuide();
  const scrollRef = useRef<ScrollView>(null);

  const [activeCreditCount, setActiveCreditCount] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  /** Staff-only theme QA — Appearance row gated on `user_details.role`. */
  const isSuperAdmin = user_detail?.role === "SUPERADMIN";

  /**
   * Human-readable label for the active theme id (staff badge on Appearance).
   */
  const themeStaffBadgeLabel = useMemo((): string => {
    if (themeId === "classic") {
      return t("settings.themeClassic");
    }
    if (themeId === "atelier") {
      return t("settings.themeAtelier");
    }
    return t("settings.themeNoir");
  }, [themeId, t]);


  useEffect(() => {
    if (isNonEmpty(user_detail?.first_name)) {
      setFirstName(String(user_detail?.first_name));
    }
    if (isNonEmpty(user_detail?.last_name)) {
      setLastName(String(user_detail?.last_name));
    }
  }, [user, user_detail]);

  useEffect(() => {
    if (user?.id) {
      void pointsAPI.getUserPointsByUserId(user.id).then((r) => setUserPoints(r?.amount ?? 0));
    }
  }, [user, pointsAPI]);

  useEffect(() => {
    if (!isEnabled("claims") || user?.id === undefined) {
      setActiveCreditCount(0);
      return;
    }
    let cancelled = false;
    void (async (): Promise<void> => {
      const { data, error } = await supabase
        .from("warranty_credits")
        .select("id, status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active");
      if (cancelled || error !== null) {
        return;
      }
      const now = Date.now();
      const count = (data ?? []).filter((row) => {
        const expires = new Date(row.expires_at).getTime();
        return Number.isFinite(expires) && expires >= now;
      }).length;
      setActiveCreditCount(count);
    })();
    return () => {
      cancelled = true;
    };
  }, [isEnabled, user?.id]);

  const displayName = useMemo(() => {
    const joined = `${firstName} ${lastName}`.trim();
    return joined.length > 0 ? joined : (user?.email ?? t("settings.userFallback"));
  }, [firstName, lastName, user?.email, t]);

  const currentLanguageLabel = {
    "zh-CN": t("settings.languageZh"),
    en: t("settings.languageEn"),
    ms: t("settings.languageMs"),
  }[locale];

  /**
   * Persists the chosen locale and closes the language modal.
   */
  const handleSelectLocale = (nextLocale: Locale): void => {
    setLocale(nextLocale);
    setLanguageModalVisible(false);
  };

  /**
   * Clears first-guide persistence and restarts the tour from Home.
   */
  const handleRestartOnboarding = (): void => {
    void resetFirstGuide();
    router.navigate("/(tabs)/");
    startTour(FIRST_LAUNCH_TOUR_ID);
  };

  /**
   * Keep guide-entry anchor scrolled into view when the first-launch
   * safety-net step is active (same contract as Classic ProfileHub).
   */
  useFocusEffect(
    useCallback(() => {
      if (activeStep?.anchorId === ANCHORS.profile.guideEntry) {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    }, [activeStep])
  );

  const handleLogout = async (): Promise<void> => {
    await signOut();
  };

  const languageModal = (
    <Modal
      visible={languageModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setLanguageModalVisible(false)}
    >
      <Pressable
        onPress={() => setLanguageModalVisible(false)}
        style={{
          flex: 1,
          backgroundColor: "rgba(44,36,22,0.35)",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: tokens.bg,
            borderRadius: 8,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: tokens.border,
          }}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: tokens.border,
            }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 18,
                color: tokens.text,
                marginBottom: 4,
              }}
            >
              {t("settings.selectLanguage")}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("settings.preferences")}
            </Text>
          </View>

          <LanguageOption
            label={t("settings.languageZh")}
            selected={locale === "zh-CN"}
            onPress={() => handleSelectLocale("zh-CN")}
            tokens={tokens}
          />
          <LanguageOption
            label={t("settings.languageEn")}
            selected={locale === "en"}
            onPress={() => handleSelectLocale("en")}
            tokens={tokens}
          />
          <LanguageOption
            label={t("settings.languageMs")}
            selected={locale === "ms"}
            onPress={() => handleSelectLocale("ms")}
            borderBottom={false}
            tokens={tokens}
          />

          <TouchableOpacity
            onPress={() => setLanguageModalVisible(false)}
            style={{
              alignItems: "center",
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: tokens.border,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("common.close")}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );

  /**
   * Language row — SUPERADMIN signed-in users also see Appearance above this.
   * Always last in the prefs list (no staff cycle row beneath).
   */
  const languageMenuRow = (
    <TourAnchor id={ANCHORS.profile.language}>
      <MenuRow
        label={t("settings.language")}
        badge={currentLanguageLabel}
        onPress={() => setLanguageModalVisible(true)}
        borderBottom={false}
        tokens={tokens}
      />
    </TourAnchor>
  );

  /**
   * SUPERADMIN-only Appearance entry — sole hub path to theme QA.
   * Hidden entirely for non-staff so the route is not discoverable from Profile.
   */
  const appearanceMenuRow =
    user !== null && isSuperAdmin ? (
      <MenuRow
        label={t("settings.appearance")}
        badge={themeStaffBadgeLabel}
        onPress={() => router.push("/(tabs)/profile/appearance")}
        tokens={tokens}
      />
    ) : null;


  const guideEntryMenuRow = (
    <TourAnchor id={ANCHORS.profile.guideEntry}>
      <MenuRow
        label={t("guide.profileEntry")}
        onPress={() => router.push("/(tabs)/profile/guide")}
        tokens={tokens}
      />
    </TourAnchor>
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tokens.bg,
        }}
      >
        <ActivityIndicator size="large" color={tokens.accent} />
      </View>
    );
  }

  /** Guest — editorial sign-in prompt + quiet prefs list */
  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg }}>
        <View
          style={{
            height: 52,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderBottomWidth: 1,
            borderBottomColor: tokens.border,
            backgroundColor: tokens.bg,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: tokens.muted,
            }}
          >
            {t("settings.title")}
          </Text>
        </View>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 120, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingTop: 36, paddingBottom: 32 }}>
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 32,
                lineHeight: 40,
                color: tokens.text,
                marginBottom: 12,
              }}
            >
              {t("settings.guestSignInTitle")}
            </Text>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
                marginBottom: 36,
                maxWidth: 320,
              }}
            >
              {t("settings.guestSignInBody")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: tokens.text,
                borderRadius: 2,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                maxWidth: 320,
              }}
            >
              <Text
                style={{
                  color: tokens.text,
                  fontSize: 13,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  fontFamily: "Inter_400Regular",
                }}
              >
                {t("settings.guestSignInCta")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/")}
              style={{
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                maxWidth: 320,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: tokens.muted,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {t("settings.guestBrowse")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 16, paddingTop: 28, borderTopWidth: 1, borderTopColor: tokens.border }}>
            <SectionHeader
              title={t("settings.preferences")}
              tokens={tokens}
            />
            {guideEntryMenuRow}
            {languageMenuRow}
          </View>
        </ScrollView>
        {languageModal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg }}>
      <View
        style={{
          height: 52,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: tokens.border,
          backgroundColor: tokens.bg,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: tokens.muted,
          }}
        >
          {t("settings.title")}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile/account")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("settings.editAccountAria")}
        >
          <Text
            style={{
              fontSize: 13,
              color: tokens.accent,
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("settings.atelierEditAccount")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Editorial identity — no bordered avatar card */}
        <View style={{ marginBottom: 48 }}>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 32,
              lineHeight: 40,
              color: tokens.text,
              marginBottom: 10,
            }}
          >
            {displayName}
          </Text>
          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
              marginBottom: 16,
            }}
          >
            {user.email ?? ""}
          </Text>
          <Text
            style={{
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: tokens.accent,
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("settings.pointsLabel", { count: userPoints.toLocaleString() })}
          </Text>
        </View>

        {/* Account index — hairlines only, Home category language */}
        <View style={{ marginBottom: 40 }}>
          <SectionHeader
            title={t("settings.atelierAccountSection")}
            hint={t("settings.atelierAccountHint")}
            tokens={tokens}
          />
          {guideEntryMenuRow}
          <MenuRow
            label={t("guide.restartOnboarding")}
            onPress={handleRestartOnboarding}
            tokens={tokens}
          />
          <TourAnchor id={ANCHORS.profile.orders}>
            <MenuRow
              label={t("settings.menuOrders")}
              onPress={() => router.push("/(tabs)/profile/orders")}
              tokens={tokens}
            />
          </TourAnchor>
          {isEnabled("warranty_registration") ? (
            <TourAnchor id={ANCHORS.profile.collection}>
              <MenuRow
                label={t("settings.menuCollection")}
                onPress={() => router.push("/(tabs)/profile/collection")}
                tokens={tokens}
              />
            </TourAnchor>
          ) : null}
          {isEnabled("claims") ? (
            <>
              <MenuRow
                label={t("settings.menuWarrantyCredits")}
                badge={
                  activeCreditCount > 0
                    ? t("warrantyCredits.badgeCount", { count: activeCreditCount })
                    : undefined
                }
                onPress={() => router.push("/(tabs)/profile/warranty-credits")}
                tokens={tokens}
              />
              <MenuRow
                label={t("settings.menuClaims")}
                onPress={() => router.push("/(tabs)/profile/claims")}
                tokens={tokens}
              />
            </>
          ) : null}
          <TourAnchor id={ANCHORS.profile.wishlist}>
            <MenuRow
              label={t("settings.menuWishlist")}
              onPress={() => router.push("/wishlist")}
              tokens={tokens}
            />
          </TourAnchor>
          <TourAnchor id={ANCHORS.profile.rewards}>
            <MenuRow
              label={t("settings.menuRewards")}
              onPress={() => router.push("/(tabs)/profile/rewards")}
              tokens={tokens}
            />
          </TourAnchor>
          <TourAnchor id={ANCHORS.profile.support}>
            <MenuRow
              label={t("settings.menuSupport")}
              onPress={() => router.push("/(tabs)/profile/support")}
              borderBottom={false}
              tokens={tokens}
            />
          </TourAnchor>
        </View>

        <View style={{ marginBottom: 40 }}>
          <SectionHeader title={t("settings.preferences")} tokens={tokens} />
          {appearanceMenuRow}
          {languageMenuRow}
        </View>

        <TouchableOpacity
          onPress={() => void handleLogout()}
          style={{ alignItems: "flex-start", paddingVertical: 8 }}
        >
          <Text
            style={{
              fontSize: 13,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("settings.logout")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      {languageModal}
    </SafeAreaView>
  );
}
