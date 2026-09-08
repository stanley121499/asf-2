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
import { PressableScale } from "@/components/motion";
import { ANCHORS, FIRST_LAUNCH_TOUR_ID, TourAnchor, useGuide } from "@/components/guide";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { useNotificationContext } from "@/context/NotificationContext";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import { useTheme } from "@/context/ThemeContext";
import { colors } from "@/constants/theme";
import type { Locale } from "@/i18n/types";
import { resetFirstGuide } from "@/lib/appGuide";
import { supabase } from "@/lib/supabase";

function isNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Menu row with icon, label, optional badge, and chevron */
interface MenuRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  borderBottom?: boolean;
  badge?: string;
}
function MenuRow({ icon, label, onPress, borderBottom = true, badge }: MenuRowProps): React.ReactElement {
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        borderBottomWidth: borderBottom ? 1 : 0,
        borderBottomColor: colors.border,
      }}
    >
      {/*
        Row layout belongs on an inner View: PressableScale applies `style` to the
        outer Pressable while children live in a column-default Animated.View.
      */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Ionicons name={icon} size={20} color={colors.text} style={{ opacity: 0.7 }} />
        <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: colors.text, fontFamily: "Inter_400Regular" }}>
          {label}
        </Text>
        {badge !== undefined && (
          <View style={{ backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 2 }}>
            <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular" }}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </View>
    </PressableScale>
  );
}

/**
 * Language option row inside the selector modal.
 * All supported locales are selectable (no "coming soon").
 */
interface LanguageOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  borderBottom?: boolean;
}
function LanguageOption({
  label,
  selected,
  onPress,
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
        paddingVertical: 16,
        borderBottomWidth: borderBottom ? 1 : 0,
        borderBottomColor: colors.border,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: selected ? "600" : "400",
          color: colors.text,
          fontFamily: "Inter_400Regular",
        }}
      >
        {label}
      </Text>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
      ) : (
        <Ionicons name="ellipse-outline" size={22} color={colors.border} />
      )}
    </TouchableOpacity>
  );
}

/**
 * Classic Profile hub — sticky header, guest CTA / signed-in menu, language picker,
 * and SUPERADMIN-only Appearance entry (Tier A). Header includes Classic bag chrome.
 */
export function ClassicProfileHubScreen(): React.ReactElement {
  const router = useRouter();
  const { user, user_detail, signOut, loading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const pointsAPI = usePointsMembership();
  const { t, locale, setLocale } = useTranslation();
  const { unreadCount } = useNotificationContext();
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
    if (isNonEmpty(user_detail?.first_name)) setFirstName(String(user_detail?.first_name));
    if (isNonEmpty(user_detail?.last_name)) setLastName(String(user_detail?.last_name));
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
   * Testing-only row: clears the persisted "seen" flag + the in-memory
   * session-attempt guard (`resetFirstGuide`) so the first-launch App
   * Guide can be run again like a fresh install, then immediately starts
   * it from Home — the tour's own per-step `route` navigation (see
   * `GuideContext`) takes it from there, so every anchor along the way
   * (tab bar, bag, shop grid, this very "How to use this app" row) has a
   * real screen to spotlight instead of guessing from Profile.
   */
  const handleRestartOnboarding = (): void => {
    void resetFirstGuide();
    router.navigate("/(tabs)/");
    startTour(FIRST_LAUNCH_TOUR_ID);
  };

  /**
   * The `firstLaunch` tour's safety-net step spotlights this screen's very
   * first menu row (`ANCHORS.profile.guideEntry`) after navigating here
   * from a *different* tab. React Navigation's bottom-tabs keeps this
   * screen mounted across tab switches, so a scroll position left over
   * from an earlier visit (e.g. replaying the tour via "restart
   * onboarding" below, without a fresh app launch) would otherwise carry
   * over — scrolling the real row out from under a spotlight rect that
   * `TourAnchor` measured for a scroll-to-top layout. Resetting the
   * scroll here, on every focus while that step is active, keeps the
   * anchor's `measureInWindow` result (see `TourAnchor`'s focus-triggered
   * re-measure) matching what re-measure actually sees on screen.
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

  /**
   * Shared language-selector modal used by guest and signed-in profile views.
   */
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
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 18,
                color: colors.text,
                marginBottom: 4,
              }}
            >
              {t("settings.selectLanguage")}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, fontFamily: "Inter_400Regular" }}>
              {t("settings.preferences")}
            </Text>
          </View>

          <LanguageOption
            label={t("settings.languageZh")}
            selected={locale === "zh-CN"}
            onPress={() => handleSelectLocale("zh-CN")}
          />
          <LanguageOption
            label={t("settings.languageEn")}
            selected={locale === "en"}
            onPress={() => handleSelectLocale("en")}
          />
          <LanguageOption
            label={t("settings.languageMs")}
            selected={locale === "ms"}
            onPress={() => handleSelectLocale("ms")}
            borderBottom={false}
          />

          <TouchableOpacity
            onPress={() => setLanguageModalVisible(false)}
            style={{
              alignItems: "center",
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>
              {t("common.close")}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );

  /**
   * Language menu row shown for both guest and logged-in users. Anchored so
   * the "change language" hub topic (and the first-launch guide, later) can
   * spotlight it on the real Profile screen.
   * SUPERADMIN signed-in users also see Appearance above this row.
   * When signed in, Notification settings sits beneath this row.
   */
  const languageMenuRow = (
    <TourAnchor id={ANCHORS.profile.language}>
      <MenuRow
        icon="language-outline"
        label={t("settings.language")}
        badge={currentLanguageLabel}
        onPress={() => setLanguageModalVisible(true)}
        borderBottom={user !== null}
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
        icon="brush-outline"
        label={t("settings.appearance")}
        badge={themeStaffBadgeLabel}
        onPress={() => router.push("/(tabs)/profile/appearance")}
      />
    ) : null;


  /**
   * Promoted "How to use this app" entry — the permanent App Guide hub.
   * Shown for both guest and signed-in users (the hub teaches navigation
   * useful to anyone) and anchored as the first-launch guide's "safety net"
   * spotlight target.
   */
  const guideEntryMenuRow = (
    <TourAnchor id={ANCHORS.profile.guideEntry}>
      <MenuRow
        icon="help-buoy-outline"
        label={t("guide.profileEntry")}
        onPress={() => router.push("/(tabs)/profile/guide")}
      />
    </TourAnchor>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  /** Not signed in — guest CTA + language picker */
  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <View
          style={{
            height: 56,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: "#FFFFFF",
          }}
        >
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 18, color: colors.text }}>
            {t("settings.title")}
          </Text>
          <View style={{ position: "absolute", right: 8 }}>
            <CartButton accessibilityLabel={t("nav.openCart")} />
          </View>
        </View>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 48, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 24 }}>
            <Ionicons name="person-circle-outline" size={96} color={colors.border} style={{ marginBottom: 24 }} />
            <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text, marginBottom: 8, textAlign: "center" }}>
              {t("settings.guestSignInTitle")}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 32 }}>
              {t("settings.guestSignInBody")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              style={{ width: "100%", maxWidth: 320, height: 52, backgroundColor: "#000000", borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_400Regular" }}>
                {t("settings.guestSignInCta")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/")}
              style={{ width: "100%", maxWidth: 320, height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>
                {t("settings.guestBrowse")}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              overflow: "hidden",
              marginTop: 8,
            }}
          >
            {guideEntryMenuRow}
            {languageMenuRow}
          </View>
        </ScrollView>
        {languageModal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Sticky header with edit-profile action in the top-right corner */}
      <View
        style={{
          height: 56,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 18, color: colors.text }}>
          {t("settings.title")}
        </Text>
        <View
          style={{
            position: "absolute",
            right: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <CartButton accessibilityLabel={t("nav.openCart")} />
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile/account")}
            hitSlop={8}
            accessibilityLabel={t("settings.editAccountAria")}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* ── Profile card ── */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: 24,
            alignItems: "center",
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.panel,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="person-outline" size={36} color={colors.muted} />
          </View>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text }}>{displayName}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, fontFamily: "Inter_400Regular" }}>{user.email ?? ""}</Text>

          {/* Points badge */}
          <View
            style={{
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: colors.panel,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 99,
              paddingHorizontal: 16,
              paddingVertical: 6,
            }}
          >
            <Ionicons name="star-outline" size={14} color={colors.accent} />
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text, fontFamily: "Inter_400Regular" }}>
              {t("settings.pointsLabel", { count: userPoints.toLocaleString() })}
            </Text>
          </View>
        </View>

        {/* ── Menu list ── */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {guideEntryMenuRow}
          <MenuRow
            icon="refresh-outline"
            label={t("guide.restartOnboarding")}
            onPress={handleRestartOnboarding}
          />
          <MenuRow
            icon="notifications-outline"
            label={t("settings.menuNotifications")}
            badge={unreadCount > 0 ? String(unreadCount) : undefined}
            onPress={() => router.push("/(tabs)/profile/notifications")}
          />
          <TourAnchor id={ANCHORS.profile.orders}>
            <MenuRow icon="bag-outline" label={t("settings.menuOrders")} onPress={() => router.push("/(tabs)/profile/orders")} />
          </TourAnchor>
          {/*
            Feature flag `warranty_registration` (preferred over reusing `claims`)
            gates physical card activation + My Collection hub.
          */}
          {isEnabled("warranty_registration") ? (
            <TourAnchor id={ANCHORS.profile.collection}>
              <MenuRow
                icon="cube-outline"
                label={t("settings.menuCollection")}
                onPress={() => router.push("/(tabs)/profile/collection")}
              />
            </TourAnchor>
          ) : null}
          {isEnabled("claims") ? (
            <>
              <MenuRow
                icon="shield-checkmark-outline"
                label={t("settings.menuWarrantyCredits")}
                badge={activeCreditCount > 0 ? t("warrantyCredits.badgeCount", { count: activeCreditCount }) : undefined}
                onPress={() => router.push("/(tabs)/profile/warranty-credits")}
              />
              <MenuRow
                icon="document-text-outline"
                label={t("settings.menuClaims")}
                onPress={() => router.push("/(tabs)/profile/claims")}
              />
            </>
          ) : null}
          <TourAnchor id={ANCHORS.profile.wishlist}>
            <MenuRow icon="heart-outline" label={t("settings.menuWishlist")} onPress={() => router.push("/wishlist")} />
          </TourAnchor>
          <TourAnchor id={ANCHORS.profile.rewards}>
            <MenuRow icon="star-outline" label={t("settings.menuRewards")} onPress={() => router.push("/(tabs)/profile/rewards")} />
          </TourAnchor>
          <TourAnchor id={ANCHORS.profile.support}>
            <MenuRow icon="chatbubble-ellipses-outline" label={t("settings.menuSupport")} onPress={() => router.push("/(tabs)/profile/support")} borderBottom={false} />
          </TourAnchor>
        </View>

        {/* ── Preferences / Appearance / language (+ staff theme QA) ── */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 32,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {appearanceMenuRow}
          {languageMenuRow}
          <MenuRow
            icon="options-outline"
            label={t("settings.menuNotificationSettings")}
            onPress={() => router.push("/(tabs)/profile/notification-settings")}
            borderBottom={false}
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity onPress={() => void handleLogout()} style={{ alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.muted, letterSpacing: 0.5, fontFamily: "Inter_400Regular" }}>
            {t("settings.logout")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      {languageModal}
    </SafeAreaView>
  );
}
