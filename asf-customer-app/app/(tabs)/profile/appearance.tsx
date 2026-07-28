import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

import { PressableScale } from "@/components/motion";
import { SubPageHeader } from "@/components/SubPageHeader";
import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/context/LocaleContext";
import { useTheme, useThemeTokens } from "@/context/ThemeContext";
import { getThemePack } from "@/themes/registry";
import {
  THEME_IDS,
  type ThemeId,
  type ThemeTokens,
} from "@/themes/types";

/**
 * Returns the i18n name key for a theme id.
 */
function themeNameKey(themeId: ThemeId): string {
  if (themeId === "classic") {
    return "settings.themeClassic";
  }
  if (themeId === "atelier") {
    return "settings.themeAtelier";
  }
  return "settings.themeNoir";
}

/**
 * Returns the i18n description key for a theme id.
 */
function themeDescriptionKey(themeId: ThemeId): string {
  if (themeId === "classic") {
    return "settings.themeClassicDesc";
  }
  if (themeId === "atelier") {
    return "settings.themeAtelierDesc";
  }
  return "settings.themeNoirDesc";
}

interface ThemeOptionCardProps {
  themeId: ThemeId;
  selected: boolean;
  onSelect: (themeId: ThemeId) => void;
  /** Active screen tokens (shell chrome). */
  shellTokens: ThemeTokens;
  name: string;
  description: string;
  selectedLabel: string;
}

/**
 * Selectable theme card with name, short description, and token swatch preview.
 */
function ThemeOptionCard({
  themeId,
  selected,
  onSelect,
  shellTokens,
  name,
  description,
  selectedLabel,
}: Readonly<ThemeOptionCardProps>): React.ReactElement {
  const previewTokens = getThemePack(themeId).tokens;

  return (
    <PressableScale
      onPress={() => onSelect(themeId)}
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

      {/* Token preview — swatches from the option's own pack, not the active shell */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            borderRadius: 8,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: shellTokens.border,
          }}
        >
          <View
            style={{ width: 28, height: 28, backgroundColor: previewTokens.bg }}
          />
          <View
            style={{ width: 28, height: 28, backgroundColor: previewTokens.panel }}
          />
          <View
            style={{ width: 28, height: 28, backgroundColor: previewTokens.accent }}
          />
          <View
            style={{ width: 28, height: 28, backgroundColor: previewTokens.text }}
          />
        </View>
        {selected ? (
          <Text
            style={{
              fontSize: 12,
              color: shellTokens.accent,
              fontFamily: "Inter_400Regular",
            }}
          >
            {selectedLabel}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

/**
 * Staff-only theme Appearance picker (SUPERADMIN QA).
 * Persists via `setTheme` → AsyncStorage `asf_theme`. Non-staff are redirected to Profile.
 */
export default function AppearanceScreen(): React.ReactElement {
  const router = useRouter();
  const { user, user_detail, loading } = useAuthContext();
  const { t } = useTranslation();
  const { themeId, setTheme } = useTheme();
  const tokens = useThemeTokens();

  const isSuperAdmin = user_detail?.role === "SUPERADMIN";
  const canAccess = !loading && user !== null && isSuperAdmin;

  /**
   * Defense in depth: deep links / stale stacks must not expose theme QA to non-staff.
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
   * Theme options in registry order with resolved copy.
   */
  const options = useMemo(() => {
    return THEME_IDS.map((id) => ({
      id,
      name: t(themeNameKey(id)),
      description: t(themeDescriptionKey(id)),
    }));
  }, [t]);

  /**
   * Applies and persists the selected theme immediately.
   */
  const handleSelectTheme = (nextThemeId: ThemeId): void => {
    if (nextThemeId === themeId) {
      return;
    }
    setTheme(nextThemeId);
  };

  if (!canAccess) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <SubPageHeader title={t("settings.appearance")} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <SubPageHeader title={t("settings.appearance")} />

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
            marginBottom: 20,
          }}
        >
          {t("settings.appearanceSubtitle")}
        </Text>

        {options.map((option) => (
          <ThemeOptionCard
            key={option.id}
            themeId={option.id}
            selected={themeId === option.id}
            onSelect={handleSelectTheme}
            shellTokens={tokens}
            name={option.name}
            description={option.description}
            selectedLabel={t("settings.themeSelected")}
          />
        ))}
      </ScrollView>
    </View>
  );
}
