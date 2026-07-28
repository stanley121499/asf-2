import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { SubPageHeader } from "@/components/SubPageHeader";
import { PressableScale } from "@/components/motion";
import {
  HUB_TOPIC_ORDER,
  TOURS,
  useGuide,
  type GuideTour,
} from "@/components/guide";
import { fonts } from "@/constants/theme";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";

interface GuideTopicCardProps {
  tour: GuideTour;
  title: string;
  description: string;
  onPress: () => void;
}

/**
 * One large, high-contrast hub topic card: icon, title, one-line
 * description, and a chevron. Sized generously (min 76px tall, 20px
 * padding) so elderly / first-time users have an easy, unambiguous tap
 * target. Tapping starts the tour named by `tour.id` via `useGuide()`;
 * the engine safely no-ops if that tour has no steps yet (Agents 3-4).
 */
function GuideTopicCard({ tour, title, description, onPress }: GuideTopicCardProps): React.ReactElement {
  const tokens = useThemeTokens();
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        backgroundColor: tokens.bg,
        borderWidth: 1,
        borderColor: tokens.border,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          minHeight: 76,
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: tokens.panel,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={tour.icon} size={24} color={tokens.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 17,
              fontWeight: "600",
              color: tokens.text,
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 14,
              lineHeight: 19,
              color: tokens.muted,
            }}
          >
            {description}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
      </View>
    </PressableScale>
  );
}

interface QuietRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}

/**
 * Quieter, secondary row used for the optional bottom-of-hub actions
 * (replay welcome tour, contact support) — same tap target size as a
 * topic card, but visually subdued so the main topic list stays primary.
 */
function QuietRow({ icon, label, onPress }: QuietRowProps): React.ReactElement {
  const tokens = useThemeTokens();
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        borderWidth: 1,
        borderColor: tokens.border,
        borderRadius: 16,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          minHeight: 56,
          paddingHorizontal: 18,
          paddingVertical: 14,
        }}
      >
        <Ionicons name={icon} size={18} color={tokens.muted} />
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.sans,
            fontSize: 14,
            color: tokens.muted,
          }}
        >
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={tokens.muted} />
      </View>
    </PressableScale>
  );
}

/**
 * Permanent "How to use this app" hub — reachable any time from Profile.
 * Lists every guide topic (plan §5.4) as a large, tappable card that starts
 * the matching coach-mark tour via `useGuide().startTour(id)`. Topics whose
 * `featureFlag` is off are hidden entirely. Starting a tour that has no
 * steps yet (populated by Agents 3-4) is a safe no-op handled by the guide
 * engine itself — this screen never needs to special-case that.
 */
export default function AppGuideHubScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const router = useRouter();
  const { t } = useTranslation();
  const { isEnabled } = useFeatureFlags();
  const { startTour } = useGuide();

  const supportEnabled = isEnabled("support_chat");

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <SubPageHeader title={t("guide.hubTitle")} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            lineHeight: 21,
            color: tokens.muted,
            marginBottom: 20,
            paddingHorizontal: 4,
          }}
        >
          {t("guide.hubSubtitle")}
        </Text>

        {HUB_TOPIC_ORDER.map((id) => {
          const tour: GuideTour | undefined = TOURS[id];
          if (!tour) {
            return null;
          }
          if (tour.featureFlag && !isEnabled(tour.featureFlag)) {
            return null;
          }
          return (
            <GuideTopicCard
              key={id}
              tour={tour}
              title={t(tour.titleKey)}
              description={t(tour.descriptionKey)}
              onPress={() => startTour(id)}
            />
          );
        })}

        <View style={{ marginTop: 12 }}>
          <QuietRow
            icon="refresh-outline"
            label={t("guide.replayWelcome")}
            onPress={() => startTour("firstLaunch")}
          />
          {supportEnabled ? (
            <QuietRow
              icon="chatbubble-ellipses-outline"
              label={t("guide.contactSupport")}
              onPress={() => router.push("/(tabs)/profile/support")}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
