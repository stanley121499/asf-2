import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

import { PressableScale } from "@/components/motion";
import { SubPageHeader } from "@/components/SubPageHeader";
import { useAuthContext } from "@/context/AuthContext";
import { useDesignPreview } from "@/context/DesignPreviewContext";
import { useStoreWelcome } from "@/context/StoreWelcomeContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import {
  HERO_VARIANT_IDS,
  WELCOME_VARIANT_IDS,
  type HeroVariantId,
  type WelcomeVariantId,
} from "@/lib/designPreview";
import {
  createDemoStoreWelcomePayload,
  resolveActiveWelcomeVariant,
} from "@/lib/storeWelcome";
import type { ThemeTokens } from "@/themes/types";

/**
 * Returns the i18n name key for a hero variant id.
 */
function heroNameKey(variantId: HeroVariantId): string {
  if (variantId === "current") {
    return "settings.designLabHeroCurrent";
  }
  if (variantId === "a") {
    return "settings.designLabHeroA";
  }
  if (variantId === "b") {
    return "settings.designLabHeroB";
  }
  if (variantId === "c") {
    return "settings.designLabHeroC";
  }
  if (variantId === "d") {
    return "settings.designLabHeroD";
  }
  return "settings.designLabHeroE";
}

/**
 * Returns the i18n description key for a hero variant id.
 */
function heroDescriptionKey(variantId: HeroVariantId): string {
  if (variantId === "current") {
    return "settings.designLabHeroCurrentDesc";
  }
  if (variantId === "a") {
    return "settings.designLabHeroADesc";
  }
  if (variantId === "b") {
    return "settings.designLabHeroBDesc";
  }
  if (variantId === "c") {
    return "settings.designLabHeroCDesc";
  }
  if (variantId === "d") {
    return "settings.designLabHeroDDesc";
  }
  return "settings.designLabHeroEDesc";
}

/**
 * Returns the i18n name key for a welcome variant id.
 */
function welcomeNameKey(variantId: WelcomeVariantId): string {
  if (variantId === "off") {
    return "settings.designLabWelcomeOff";
  }
  if (variantId === "1") {
    return "settings.designLabWelcome1";
  }
  if (variantId === "2") {
    return "settings.designLabWelcome2";
  }
  if (variantId === "3") {
    return "settings.designLabWelcome3";
  }
  if (variantId === "4") {
    return "settings.designLabWelcome4";
  }
  return "settings.designLabWelcome5";
}

/**
 * Returns the i18n description key for a welcome variant id.
 */
function welcomeDescriptionKey(variantId: WelcomeVariantId): string {
  if (variantId === "off") {
    return "settings.designLabWelcomeOffDesc";
  }
  if (variantId === "1") {
    return "settings.designLabWelcome1Desc";
  }
  if (variantId === "2") {
    return "settings.designLabWelcome2Desc";
  }
  if (variantId === "3") {
    return "settings.designLabWelcome3Desc";
  }
  if (variantId === "4") {
    return "settings.designLabWelcome4Desc";
  }
  return "settings.designLabWelcome5Desc";
}

interface VariantOptionCardProps {
  selected: boolean;
  onSelect: () => void;
  shellTokens: ThemeTokens;
  name: string;
  description: string;
  selectedLabel: string;
}

/**
 * Radio-style option card for Design Lab hero / welcome picks.
 */
function VariantOptionCard({
  selected,
  onSelect,
  shellTokens,
  name,
  description,
  selectedLabel,
}: Readonly<VariantOptionCardProps>): React.ReactElement {
  return (
    <PressableScale
      onPress={onSelect}
      haptic="light"
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={[name, description].join(". ")}
      style={{
        backgroundColor: shellTokens.panel,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? shellTokens.accent : shellTokens.border,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: selected ? "600" : "500",
              color: shellTokens.text,
              fontFamily: "Inter_400Regular",
              marginBottom: 4,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 18,
              color: shellTokens.muted,
              fontFamily: "Inter_400Regular",
            }}
          >
            {description}
          </Text>
        </View>
        {selected ? (
          <Ionicons name="checkmark-circle" size={24} color={shellTokens.accent} />
        ) : (
          <Ionicons name="ellipse-outline" size={24} color={shellTokens.border} />
        )}
      </View>
      {selected ? (
        <Text
          style={{
            fontSize: 12,
            color: shellTokens.accent,
            fontFamily: "Inter_400Regular",
            marginTop: 10,
          }}
        >
          {selectedLabel}
        </Text>
      ) : null}
    </PressableScale>
  );
}

/**
 * Staff-only Design Lab for Home hero + store-welcome preview switches.
 * Persists via DesignPreviewContext AsyncStorage keys. Non-staff redirect to Profile.
 * Preview welcome presents Mid Valley demo via StoreWelcomeHost (no GPS).
 */
export default function DesignLabScreen(): React.ReactElement {
  const router = useRouter();
  const { user, user_detail, loading } = useAuthContext();
  const { t } = useTranslation();
  const tokens = useThemeTokens();
  const {
    heroVariant,
    welcomeVariant,
    setHeroVariant,
    setWelcomeVariant,
  } = useDesignPreview();
  const { presentWelcome } = useStoreWelcome();

  const isSuperAdmin = user_detail?.role === "SUPERADMIN";
  const canAccess = !loading && user !== null && isSuperAdmin;

  /**
   * Defense in depth: deep links / stale stacks must not expose Design Lab to non-staff.
   */
  useEffect(() => {
    if (loading) {
      return;
    }
    if (user === null || user_detail?.role !== "SUPERADMIN") {
      router.replace("/(tabs)/profile");
    }
  }, [loading, user, user_detail?.role, router]);

  /**
   * Hero options in plan order with resolved copy.
   */
  const heroOptions = useMemo(() => {
    return HERO_VARIANT_IDS.map((id) => ({
      id,
      name: t(heroNameKey(id)),
      description: t(heroDescriptionKey(id)),
    }));
  }, [t]);

  /**
   * Welcome options in plan order with resolved copy.
   */
  const welcomeOptions = useMemo(() => {
    return WELCOME_VARIANT_IDS.map((id) => ({
      id,
      name: t(welcomeNameKey(id)),
      description: t(welcomeDescriptionKey(id)),
    }));
  }, [t]);

  /**
   * Opens the Mid Valley demo welcome for the selected variant.
   * When welcome is `off`, Preview temporarily uses Flagship cover (`1`) for QA.
   */
  const handlePreviewWelcome = (): void => {
    const activeVariant = resolveActiveWelcomeVariant(welcomeVariant);
    presentWelcome(createDemoStoreWelcomePayload(), activeVariant);
  };

  /**
   * Shortcut to the Home tab so staff can check hero wiring after Pass 2.
   */
  const handleOpenHome = (): void => {
    router.push("/(tabs)/");
  };

  if (!canAccess) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <SubPageHeader title={t("settings.designLab")} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <SubPageHeader title={t("settings.designLab")} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 13,
            lineHeight: 18,
            color: tokens.muted,
            fontFamily: "Inter_400Regular",
            marginBottom: 24,
          }}
        >
          {t("settings.designLabSubtitle")}
        </Text>

        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: tokens.text,
            fontFamily: "Inter_400Regular",
            marginBottom: 12,
          }}
        >
          {t("settings.designLabHeroSection")}
        </Text>
        {heroOptions.map((option) => (
          <VariantOptionCard
            key={option.id}
            selected={heroVariant === option.id}
            onSelect={() => {
              if (option.id !== heroVariant) {
                setHeroVariant(option.id);
              }
            }}
            shellTokens={tokens}
            name={option.name}
            description={option.description}
            selectedLabel={t("settings.themeSelected")}
          />
        ))}

        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: tokens.text,
            fontFamily: "Inter_400Regular",
            marginTop: 12,
            marginBottom: 12,
          }}
        >
          {t("settings.designLabWelcomeSection")}
        </Text>
        {welcomeOptions.map((option) => (
          <VariantOptionCard
            key={option.id}
            selected={welcomeVariant === option.id}
            onSelect={() => {
              if (option.id !== welcomeVariant) {
                setWelcomeVariant(option.id);
              }
            }}
            shellTokens={tokens}
            name={option.name}
            description={option.description}
            selectedLabel={t("settings.themeSelected")}
          />
        ))}

        <PressableScale
          onPress={handlePreviewWelcome}
          haptic="medium"
          accessibilityRole="button"
          accessibilityLabel={t("settings.designLabPreviewWelcome")}
          style={{
            backgroundColor: tokens.accent,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            alignItems: "center",
            marginTop: 8,
            marginBottom: welcomeVariant === "off" ? 8 : 12,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#FFFFFF",
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("settings.designLabPreviewWelcome")}
          </Text>
        </PressableScale>

        {welcomeVariant === "off" ? (
          <Text
            style={{
              fontSize: 12,
              lineHeight: 16,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
              marginBottom: 12,
            }}
          >
            {t("settings.designLabPreviewStub")}
          </Text>
        ) : null}

        <PressableScale
          onPress={handleOpenHome}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel={t("settings.designLabOpenHome")}
          style={{
            backgroundColor: tokens.panel,
            borderWidth: 1,
            borderColor: tokens.border,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "500",
              color: tokens.text,
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("settings.designLabOpenHome")}
          </Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
}
