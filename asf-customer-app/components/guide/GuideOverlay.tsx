import React, { useEffect } from "react";
import { Text, View, useWindowDimensions, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { PressableScale } from "@/components/motion";
import { fonts } from "@/constants/theme";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/types";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";

import { FIRST_LAUNCH_TOUR_ID, useGuide } from "./GuideContext";
import type { LayoutRect } from "./GuideContext";
import type { GuideStep, GuidePlacement } from "./tours";

/** i18n key (under `settings.*`) for each locale's native display name — reused from the Profile language picker so labels stay in sync. */
const LOCALE_LABEL_KEY: Record<Locale, string> = {
  "zh-CN": "settings.languageZh",
  en: "settings.languageEn",
  ms: "settings.languageMs",
};

/** Extra breathing room (px) around a spotlighted anchor's measured rect. */
const SPOTLIGHT_PADDING = 8;
/** Corner radius of the spotlight ring / cutout. */
const SPOTLIGHT_RADIUS = 14;
/** Overlay stacking order — above `AlertBanner` (z 100), below `SplashIntro` (z 1000). */
const OVERLAY_Z_INDEX = 500;

/**
 * Picks where the instruction card sits. Explicit `step.placement` always
 * wins; otherwise a centered step with no anchor gets a centered card, and
 * a spotlighted step is placed on whichever side of the anchor has more
 * room, so the card never covers its own spotlight.
 */
function resolvePlacement(
  explicit: GuidePlacement | undefined,
  rect: LayoutRect | undefined,
  screenHeight: number,
): GuidePlacement {
  if (explicit) {
    return explicit;
  }
  if (!rect) {
    return "center";
  }
  return rect.y > screenHeight / 2 ? "top" : "bottom";
}

/**
 * Resolves the translated body copy for a step, substituting the one
 * runtime-computed sentence the `firstLaunch` tour's tab-bar step needs
 * (plan §5.4: only mention Highlights/Stores when those tabs are actually
 * visible). Every other step's `dynamicBody` is `undefined`, so this is a
 * plain `t(bodyKey)` call for the other ~40 steps across every tour.
 */
function resolveStepBody(
  step: GuideStep,
  t: (key: string, params?: Record<string, string | number>) => string,
  locale: string,
  isEnabled: (key: "highlights" | "store_locations") => boolean,
): string {
  if (step.dynamicBody !== "firstLaunchTabs") {
    return t(step.bodyKey);
  }
  const extraTabNames: string[] = [];
  if (isEnabled("highlights")) {
    extraTabNames.push(t("nav.highlights"));
  }
  if (isEnabled("store_locations")) {
    extraTabNames.push(t("nav.locations"));
  }
  if (extraTabNames.length === 0) {
    return t(step.bodyKey, { extraTabs: "" });
  }
  const listSeparator = locale === "zh-CN" ? "、" : ", ";
  const extraTabs = t("guide.firstLaunch.tabs.extra", {
    names: extraTabNames.join(listSeparator),
  });
  return t(step.bodyKey, { extraTabs });
}

/**
 * Full-screen dim scrim: a rectangular "hole" (four surrounding rects, no
 * dim over the anchor) plus a gold ring outlining the spotlighted control.
 * Falls back to a plain full-screen dim (rendered by the caller) whenever
 * no anchor rect is available.
 */
function SpotlightScrim({
  rect,
  screenWidth,
  screenHeight,
}: {
  rect: LayoutRect;
  screenWidth: number;
  screenHeight: number;
}): React.ReactElement {
  const tokens = useThemeTokens();
  const top = Math.max(rect.y - SPOTLIGHT_PADDING, 0);
  const left = Math.max(rect.x - SPOTLIGHT_PADDING, 0);
  const right = Math.min(rect.x + rect.width + SPOTLIGHT_PADDING, screenWidth);
  const bottom = Math.min(rect.y + rect.height + SPOTLIGHT_PADDING, screenHeight);
  const dimColor = "rgba(10,10,10,0.6)";

  return (
    <View pointerEvents="auto" style={{ flex: 1 }}>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: top, backgroundColor: dimColor }} />
      <View
        style={{
          position: "absolute",
          top: bottom,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: dimColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          top,
          left: 0,
          width: left,
          height: Math.max(bottom - top, 0),
          backgroundColor: dimColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          top,
          left: right,
          right: 0,
          height: Math.max(bottom - top, 0),
          backgroundColor: dimColor,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top,
          left,
          width: right - left,
          height: bottom - top,
          borderRadius: SPOTLIGHT_RADIUS,
          borderWidth: 3,
          borderColor: tokens.accent,
        }}
      />
    </View>
  );
}

const CARD_CONTAINER_BASE: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  alignItems: "center",
  paddingHorizontal: 20,
};

/** Per-placement flex alignment + padding for the card's full-screen wrapper. */
const CARD_CONTAINER_BY_PLACEMENT: Record<GuidePlacement, ViewStyle> = {
  bottom: { justifyContent: "flex-end", paddingBottom: 40 },
  top: { justifyContent: "flex-start", paddingTop: 112 },
  center: { justifyContent: "center" },
};

interface LanguageOption {
  value: Locale;
  label: string;
}

interface InstructionCardProps {
  placement: GuidePlacement;
  title: string;
  body: string;
  stepLabel: string;
  isFirst: boolean;
  isLast: boolean;
  backLabel: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  /** Renders as a text link in the card header, next to the step indicator. */
  skipLabel: string;
  onSkip: () => void;
  /** Only true for the `firstLaunch` tour's welcome (first) step. */
  showLanguagePicker: boolean;
  languagePromptLabel: string;
  languageOptions: readonly LanguageOption[];
  activeLocale: Locale;
  onSelectLocale: (locale: Locale) => void;
}

/**
 * Row of large, high-contrast language pills shown only on the
 * `firstLaunch` welcome step (plan: elderly / non-English users need to be
 * able to switch language *before* reading the rest of the guide). Tapping
 * a pill calls the same `setLocale` the Profile language picker uses, so
 * copy across the guide and the rest of the app switches immediately.
 * Optional: skipping the step (or just tapping Next) keeps the current
 * locale, so this never blocks progress.
 */
function LanguagePicker({
  promptLabel,
  options,
  activeLocale,
  onSelect,
}: {
  promptLabel: string;
  options: readonly LanguageOption[];
  activeLocale: Locale;
  onSelect: (locale: Locale) => void;
}): React.ReactElement {
  const tokens = useThemeTokens();
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: tokens.muted, marginBottom: 8 }}>
        {promptLabel}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => {
          const selected = option.value === activeLocale;
          return (
            <PressableScale
              key={option.value}
              onPress={() => onSelect(option.value)}
              haptic="selection"
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              style={{
                minHeight: 48,
                paddingHorizontal: 18,
                borderRadius: 99,
                borderWidth: 1,
                borderColor: selected ? tokens.accent : tokens.border,
                backgroundColor: selected ? tokens.accent : tokens.bg,
                justifyContent: "center",
              }}
            >
              {/* Centering belongs on this inner View — `PressableScale`'s
                  Animated.View only stretches to the Pressable's width, it
                  doesn't center a bare Text child (see button fix below). */}
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 15,
                    fontWeight: selected ? "600" : "500",
                    color: selected ? tokens.bg : tokens.text,
                    textAlign: "center",
                  }}
                >
                  {option.label}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Bottom/top/center instruction card: step indicator, title, body, and the
 * large Back / Next-or-Done buttons. Buttons use `PressableScale` and meet
 * the 48px minimum touch target for beginner/elderly accessibility.
 */
function InstructionCard({
  placement,
  title,
  body,
  stepLabel,
  isFirst,
  isLast,
  backLabel,
  nextLabel,
  onBack,
  onNext,
  skipLabel,
  onSkip,
  showLanguagePicker,
  languagePromptLabel,
  languageOptions,
  activeLocale,
  onSelectLocale,
}: InstructionCardProps): React.ReactElement {
  const tokens = useThemeTokens();
  return (
    <View
      pointerEvents="box-none"
      style={[CARD_CONTAINER_BASE, CARD_CONTAINER_BY_PLACEMENT[placement]]}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: tokens.bg,
          borderRadius: 20,
          padding: 20,
          gap: 6,
          shadowColor: "#000000",
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        {/*
          Skip lives here — inside the card's own header row — rather than
          floating over the screen. A floating top-right pill would sit
          right on top of whatever top-right control (home bag/search, a
          screen's own header icons, ...) the step is actively spotlighting,
          defeating the teaching moment. The card is already placed on
          whichever side of the anchor has room (`resolvePlacement`), so
          anything inside it inherits that same collision-avoidance for
          free, while staying large and reachable for elderly users.
        */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: tokens.muted, flexShrink: 1 }}>
            {stepLabel}
          </Text>
          <PressableScale
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={skipLabel}
            style={{
              minHeight: 44,
              minWidth: 44,
              paddingHorizontal: 14,
              paddingVertical: 8,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 22,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 15,
                fontWeight: "600",
                color: tokens.muted,
                textDecorationLine: "underline",
              }}
            >
              {skipLabel}
            </Text>
          </PressableScale>
        </View>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 20,
            color: tokens.text,
            marginTop: 2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            lineHeight: 21,
            color: tokens.text,
            marginBottom: 8,
          }}
        >
          {body}
        </Text>
        {showLanguagePicker ? (
          <LanguagePicker
            promptLabel={languagePromptLabel}
            options={languageOptions}
            activeLocale={activeLocale}
            onSelect={onSelectLocale}
          />
        ) : null}
        <View style={{ flexDirection: "row", gap: 12 }}>
          {!isFirst ? (
            <PressableScale
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={backLabel}
              style={{
                flex: 1,
                minHeight: 52,
                borderRadius: 26,
                borderWidth: 1,
                borderColor: tokens.border,
                justifyContent: "center",
              }}
            >
              {/*
                Centering belongs on this inner View, not on the Pressable
                above: `PressableScale` applies `style` to the outer
                Pressable while children live inside a column-default
                `Animated.View` that always stretches to the Pressable's
                full width (needed elsewhere for %-width buttons). A bare
                `Text` inside that stretched view still renders flush-left
                (RN Text defaults to `textAlign: "left"`), which is exactly
                what left-aligned the button label. This inner View — the
                Animated.View's direct child — is where `alignItems` /
                `textAlign` actually reach the label.
              */}
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{ fontFamily: fonts.sans, fontSize: 16, color: tokens.text, textAlign: "center" }}
                >
                  {backLabel}
                </Text>
              </View>
            </PressableScale>
          ) : null}
          <PressableScale
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel={nextLabel}
            style={{
              flex: isFirst ? undefined : 2,
              width: isFirst ? "100%" : undefined,
              minHeight: 52,
              borderRadius: 26,
              backgroundColor: tokens.accent,
              justifyContent: "center",
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 16,
                  fontWeight: "600",
                  color: tokens.bg,
                  textAlign: "center",
                }}
              >
                {nextLabel}
              </Text>
            </View>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

/**
 * Full-screen dim + spotlight + instruction-card overlay for the active
 * coach-mark tour. Renders nothing when no tour is active. Reads all state
 * from {@link useGuide} — screens never talk to this component directly,
 * they only wrap real controls in `TourAnchor`. Mount once near the app
 * root (see `app/_layout.tsx`).
 */
export function GuideOverlay(): React.ReactElement | null {
  const {
    activeTour,
    activeStep,
    stepIndex,
    totalSteps,
    isFirst,
    isLast,
    anchors,
    next,
    back,
    exit,
  } = useGuide();
  const { t, locale, setLocale } = useTranslation();
  const { isEnabled } = useFeatureFlags();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const opacity = useSharedValue(reducedMotion === true ? 1 : 0);

  useEffect(() => {
    if (!activeTour) {
      return;
    }
    if (reducedMotion === true) {
      opacity.value = 1;
      return;
    }
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: motion.duration.fast, easing: motionEasing });
    // Deliberately keyed on the tour id (not the whole object) so this only
    // re-runs when a *new* tour starts, not on every anchor-rect update.
  }, [activeTour?.id, reducedMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!activeTour || !activeStep) {
    return null;
  }

  const rect = activeStep.anchorId ? anchors[activeStep.anchorId] : undefined;
  const hasSpotlight = Boolean(rect);
  const placement = resolvePlacement(activeStep.placement, rect, screenHeight);

  /**
   * Language picker only on the `firstLaunch` tour's welcome (first) step —
   * the guide's very first exposure, so elderly / non-English users can
   * pick their language before reading anything else. Optional: leaving it
   * alone and tapping Next just keeps whatever locale was already active.
   */
  const showLanguagePicker = activeTour.id === FIRST_LAUNCH_TOUR_ID && isFirst;
  const languageOptions: LanguageOption[] = SUPPORTED_LOCALES.map((value) => ({
    value,
    label: t(LOCALE_LABEL_KEY[value]),
  }));

  // `PressableScale`'s own `haptic="selection"` prop (see `LanguagePicker`)
  // already fires the tactile feedback — this just persists the choice.
  const handleSelectLocale = (nextLocale: Locale): void => {
    setLocale(nextLocale);
  };

  const handleNext = (): void => {
    void hapticLight();
    if (isLast) {
      void hapticSuccess();
    }
    next();
  };

  const handleBack = (): void => {
    void hapticLight();
    back();
  };

  const handleExit = (): void => {
    void hapticLight();
    exit();
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: OVERLAY_Z_INDEX },
        animatedStyle,
      ]}
    >
      {hasSpotlight && rect ? (
        <SpotlightScrim rect={rect} screenWidth={screenWidth} screenHeight={screenHeight} />
      ) : (
        <View
          pointerEvents="auto"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(10,10,10,0.6)",
          }}
        />
      )}

      <InstructionCard
        placement={placement}
        title={t(activeStep.titleKey)}
        body={resolveStepBody(activeStep, t, locale, isEnabled)}
        stepLabel={t("guide.controls.stepIndicator", { step: stepIndex + 1, total: totalSteps })}
        isFirst={isFirst}
        isLast={isLast}
        backLabel={t("guide.controls.back")}
        nextLabel={isLast ? t("guide.controls.done") : t("guide.controls.next")}
        onBack={handleBack}
        onNext={handleNext}
        skipLabel={t("guide.controls.skip")}
        onSkip={handleExit}
        showLanguagePicker={showLanguagePicker}
        languagePromptLabel={t("guide.firstLaunch.welcome.languagePrompt")}
        languageOptions={languageOptions}
        activeLocale={locale}
        onSelectLocale={handleSelectLocale}
      />
    </Animated.View>
  );
}
