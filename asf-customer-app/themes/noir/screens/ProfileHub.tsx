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

import { CartButton } from "@/components/cart/CartButton";
import { ANCHORS, FIRST_LAUNCH_TOUR_ID, TourAnchor, useGuide } from "@/components/guide";
import { PressableScale } from "@/components/motion";
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
 * Returns true when `v` is a non-empty trimmed string.
 */
function isNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

interface DenseMenuRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  tokens: ThemeTokens;
  borderBottom?: boolean;
  badge?: string;
}

/**
 * Compact dark settings row — night-settings density (hairline, tight padding).
 */
function DenseMenuRow({
  icon,
  label,
  onPress,
  tokens,
  borderBottom = true,
  badge,
}: DenseMenuRowProps): React.ReactElement {
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
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          minHeight: 44,
        }}
      >
        <Ionicons name={icon} size={16} color={tokens.muted} />
        <Text
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: "500",
            color: tokens.text,
            fontFamily: "Inter_400Regular",
          }}
        >
          {label}
        </Text>
        {badge !== undefined ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: tokens.border,
              borderRadius: 2,
              paddingHorizontal: 6,
              paddingVertical: 1,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 0.3,
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
              }}
            >
              {badge}
            </Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={12} color={tokens.muted} />
      </View>
    </PressableScale>
  );
}

interface LanguageOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  tokens: ThemeTokens;
  borderBottom?: boolean;
}

/**
 * Language option row inside the dark selector modal.
 */
function LanguageOption({
  label,
  selected,
  onPress,
  tokens,
  borderBottom = true,
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
        paddingVertical: 14,
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
 * Noir Profile hub — dense dark settings list (Tier A).
 * Headers-everywhere bag in the compact sticky header; SUPERADMIN-only Appearance entry.
 */
export function NoirProfileHubScreen(): React.ReactElement {
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
   * Keep guide entry scrolled into view when the safety-net step is active.
   */
  useFocusEffect(
    useCallback(() => {
      if (activeStep?.anchorId === ANCHORS.profile.guideEntry) {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    }, [activeStep]),
  );

  const handleLogout = async (): Promise<void> => {
    await signOut();
  };

  /** Compact sticky header shared by guest and signed-in views. */
  const stickyHeader = (trailingExtra?: React.ReactNode): React.ReactElement => (
    <View
      style={{
        height: 48,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
        backgroundColor: tokens.bg,
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 13,
          fontWeight: "600",
          letterSpacing: 1,
          textTransform: "uppercase",
          color: tokens.text,
        }}
      >
        {t("settings.title")}
      </Text>
      <View
        style={{
          position: "absolute",
          right: 4,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <CartButton
          color={tokens.text}
          size={40}
          iconSize={20}
          accessibilityLabel={t("nav.openCart")}
        />
        {trailingExtra}
      </View>
    </View>
  );

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
          backgroundColor: "rgba(0,0,0,0.7)",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: tokens.panel,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: tokens.border,
          }}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: tokens.border,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 16,
                fontWeight: "600",
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
            tokens={tokens}
            borderBottom={false}
          />

          <TouchableOpacity
            onPress={() => setLanguageModalVisible(false)}
            style={{
              alignItems: "center",
              paddingVertical: 14,
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
   * Language row — signed-in users also see Appearance above this.
   */
  const languageMenuRow = (
    <TourAnchor id={ANCHORS.profile.language}>
      <DenseMenuRow
        icon="language-outline"
        label={t("settings.language")}
        badge={currentLanguageLabel}
        onPress={() => setLanguageModalVisible(true)}
        tokens={tokens}
        borderBottom={false}
      />
    </TourAnchor>
  );

  /**
   * SUPERADMIN-only Appearance entry — sole hub path to theme QA.
   * Hidden entirely for non-staff so the route is not discoverable from Profile.
   */
  const appearanceMenuRow =
    user !== null && isSuperAdmin ? (
      <DenseMenuRow
        icon="brush-outline"
        label={t("settings.appearance")}
        badge={themeStaffBadgeLabel}
        onPress={() => router.push("/(tabs)/profile/appearance")}
        tokens={tokens}
      />
    ) : null;


  const guideEntryMenuRow = (
    <TourAnchor id={ANCHORS.profile.guideEntry}>
      <DenseMenuRow
        icon="help-buoy-outline"
        label={t("guide.profileEntry")}
        onPress={() => router.push("/(tabs)/profile/guide")}
        tokens={tokens}
      />
    </TourAnchor>
  );

  /** Flush hairline list section — no floated card chrome. */
  const listPanel = (children: React.ReactNode): React.ReactElement => (
    <View
      style={{
        backgroundColor: tokens.bg,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: tokens.border,
        marginBottom: 8,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
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

  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg }}>
        {stickyHeader()}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 48, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 32,
              paddingHorizontal: 24,
            }}
          >
            <Ionicons
              name="person-circle-outline"
              size={72}
              color={tokens.border}
              style={{ marginBottom: 20 }}
            />
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 18,
                fontWeight: "600",
                color: tokens.text,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {t("settings.guestSignInTitle")}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: tokens.muted,
                textAlign: "center",
                marginBottom: 28,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("settings.guestSignInBody")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              style={{
                width: "100%",
                maxWidth: 320,
                height: 44,
                backgroundColor: tokens.accent,
                borderRadius: 2,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: tokens.bg,
                  fontSize: 13,
                  fontWeight: "600",
                  fontFamily: "Inter_400Regular",
                }}
              >
                {t("settings.guestSignInCta")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/")}
              style={{
                width: "100%",
                maxWidth: 320,
                height: 44,
                borderWidth: 1,
                borderColor: tokens.border,
                borderRadius: 2,
                alignItems: "center",
                justifyContent: "center",
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

          {listPanel(
            <>
              {guideEntryMenuRow}
              {languageMenuRow}
            </>,
          )}
        </ScrollView>
        {languageModal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg }}>
      {stickyHeader(
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile/account")}
          hitSlop={8}
          accessibilityLabel={t("settings.editAccountAria")}
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="create-outline" size={20} color={tokens.text} />
        </TouchableOpacity>,
      )}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Slim identity strip — night settings, not a heavy card */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: tokens.border,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: tokens.panel,
              borderWidth: 1,
              borderColor: tokens.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person-outline" size={18} color={tokens.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                fontWeight: "600",
                color: tokens.text,
              }}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: tokens.muted,
                marginTop: 2,
                fontFamily: "Inter_400Regular",
              }}
              numberOfLines={1}
            >
              {user.email ?? ""}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              borderWidth: 1,
              borderColor: tokens.border,
              borderRadius: 2,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Ionicons name="star-outline" size={11} color={tokens.accent} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: tokens.text,
                fontFamily: "Inter_400Regular",
              }}
            >
              {userPoints.toLocaleString()}
            </Text>
          </View>
        </View>

        {listPanel(
          <>
            {guideEntryMenuRow}
            <DenseMenuRow
              icon="refresh-outline"
              label={t("guide.restartOnboarding")}
              onPress={handleRestartOnboarding}
              tokens={tokens}
            />
            <TourAnchor id={ANCHORS.profile.orders}>
              <DenseMenuRow
                icon="bag-outline"
                label={t("settings.menuOrders")}
                onPress={() => router.push("/(tabs)/profile/orders")}
                tokens={tokens}
              />
            </TourAnchor>
            {isEnabled("warranty_registration") ? (
              <TourAnchor id={ANCHORS.profile.collection}>
                <DenseMenuRow
                  icon="cube-outline"
                  label={t("settings.menuCollection")}
                  onPress={() => router.push("/(tabs)/profile/collection")}
                  tokens={tokens}
                />
              </TourAnchor>
            ) : null}
            {isEnabled("claims") ? (
              <>
                <DenseMenuRow
                  icon="shield-checkmark-outline"
                  label={t("settings.menuWarrantyCredits")}
                  badge={
                    activeCreditCount > 0
                      ? t("warrantyCredits.badgeCount", { count: activeCreditCount })
                      : undefined
                  }
                  onPress={() => router.push("/(tabs)/profile/warranty-credits")}
                  tokens={tokens}
                />
                <DenseMenuRow
                  icon="document-text-outline"
                  label={t("settings.menuClaims")}
                  onPress={() => router.push("/(tabs)/profile/claims")}
                  tokens={tokens}
                />
              </>
            ) : null}
            <TourAnchor id={ANCHORS.profile.wishlist}>
              <DenseMenuRow
                icon="heart-outline"
                label={t("settings.menuWishlist")}
                onPress={() => router.push("/wishlist")}
                tokens={tokens}
              />
            </TourAnchor>
            <TourAnchor id={ANCHORS.profile.rewards}>
              <DenseMenuRow
                icon="star-outline"
                label={t("settings.menuRewards")}
                onPress={() => router.push("/(tabs)/profile/rewards")}
                tokens={tokens}
              />
            </TourAnchor>
            <TourAnchor id={ANCHORS.profile.support}>
              <DenseMenuRow
                icon="chatbubble-ellipses-outline"
                label={t("settings.menuSupport")}
                onPress={() => router.push("/(tabs)/profile/support")}
                tokens={tokens}
                borderBottom={false}
              />
            </TourAnchor>
          </>,
        )}

        {listPanel(
          <>
            {appearanceMenuRow}
            {languageMenuRow}
          </>,
        )}

        <TouchableOpacity
          onPress={() => void handleLogout()}
          style={{ alignItems: "center", paddingVertical: 16 }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              color: tokens.muted,
              letterSpacing: 0.5,
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
