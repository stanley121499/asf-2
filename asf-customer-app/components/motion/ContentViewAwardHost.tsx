import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getPointsCeremony } from "@/components/motion/pointsCeremony";
import { useAlertContext } from "@/context/AlertContext";
import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/context/LocaleContext";
import { useTheme } from "@/context/ThemeContext";
import {
  contentViewTypeFromLinkedKind,
  hasShownGuestDiscoveryPrompt,
  isContentViewAwardUuid,
  markGuestDiscoveryPromptShown,
  requestContentViewAward,
  type ContentViewAwardType,
} from "@/lib/contentViewAward";

/**
 * TEMP for Simon QA — set false before production.
 *
 * When true, every logged-in content-view award attempt (PDP / linked-products)
 * presents the theme’s +1 points ceremony, even if the server/local path says
 * already awarded / not newly awarded. Does not fake DB points; guests unchanged.
 */
const FORCE_POINTS_CEREMONY_EVERY_TIME = true;

export type ContentViewAwardHostProps = {
  /**
   * Award content type, or `null` when the host should stay idle
   * (e.g. invalid linked-products route params).
   */
  contentType: ContentViewAwardType | null;
  /** Content uuid, or `null` when idle. */
  contentId: string | null;
};

/**
 * Host that requests a first-view discovery award (device-local AsyncStorage
 * for now) and shows the active theme’s points ceremony when
 * `awarded: true` (or always when {@link FORCE_POINTS_CEREMONY_EVERY_TIME}).
 *
 * Guests get an optional one-time soft “sign in to earn points” alert —
 * never a fake award. Mount on PDP and linked-products only (not feed
 * scroll impressions).
 */
export function ContentViewAwardHost({
  contentType,
  contentId,
}: ContentViewAwardHostProps): React.ReactElement | null {
  const { user, loading: authLoading } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { t } = useTranslation();
  const { themeId } = useTheme();

  const userId = user?.id ?? null;

  const [ceremonyVisible, setCeremonyVisible] = useState(false);
  const [ceremonyPoints, setCeremonyPoints] = useState(0);

  /** Keys that reached a terminal outcome (award / already / guest prompt). */
  const terminalKeysRef = useRef<Set<string>>(new Set());
  const showAlertRef = useRef(showAlert);
  const tRef = useRef(t);

  const PointsCeremony = useMemo(
    () => getPointsCeremony(themeId),
    [themeId]
  );

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const onDismissCeremony = useCallback((): void => {
    setCeremonyVisible(false);
    setCeremonyPoints(0);
  }, []);

  /**
   * Presents the active theme’s points ceremony with the given amount.
   *
   * @param points - Display amount (server award amount, or 1 in force QA mode)
   */
  const presentCeremony = useCallback((points: number): void => {
    if (points <= 0) {
      return;
    }
    setCeremonyPoints(points);
    setCeremonyVisible(true);
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (contentType === null || contentId === null) {
      return;
    }

    if (!isContentViewAwardUuid(contentId)) {
      return;
    }

    const attemptKey = `${contentType}:${contentId}:${userId ?? "guest"}`;
    if (terminalKeysRef.current.has(attemptKey)) {
      return;
    }

    let cancelled = false;

    const run = async (): Promise<void> => {
      if (userId === null) {
        const alreadyShown = await hasShownGuestDiscoveryPrompt();
        if (cancelled || alreadyShown) {
          if (!cancelled && alreadyShown) {
            terminalKeysRef.current.add(attemptKey);
          }
          return;
        }
        await markGuestDiscoveryPromptShown();
        if (cancelled) {
          return;
        }
        terminalKeysRef.current.add(attemptKey);
        showAlertRef.current(
          tRef.current("rewards.signInToEarnPoints"),
          "info"
        );
        return;
      }

      const result = await requestContentViewAward({
        contentType,
        contentId,
        userId,
      });

      if (cancelled) {
        return;
      }

      terminalKeysRef.current.add(attemptKey);

      if (result.awarded === true && result.points > 0) {
        presentCeremony(result.points);
        return;
      }

      // TEMP Simon QA: still pop +1 after already-awarded / skipped paths.
      if (FORCE_POINTS_CEREMONY_EVERY_TIME) {
        presentCeremony(1);
        return;
      }

      if (__DEV__) {
        console.info("[ContentViewAwardHost] no ceremony (already handled)", {
          contentType,
          contentId,
          alreadyAwarded: result.alreadyAwarded,
          skippedLocally: result.skippedLocally,
          fromLocal: result.fromLocal,
          points: result.points,
        });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [authLoading, contentType, contentId, userId, presentCeremony]);

  if (!ceremonyVisible || ceremonyPoints <= 0) {
    return null;
  }

  return (
    <PointsCeremony
      visible={ceremonyVisible}
      points={ceremonyPoints}
      titleLabel={t("rewards.discoveryEarnedTitle")}
      pointsLabel={t("rewards.discoveryPointsStrip", { count: ceremonyPoints })}
      onDismiss={onDismissCeremony}
      accessibilityLabel={t("rewards.discoveryPointsStrip", {
        count: ceremonyPoints,
      })}
    />
  );
}

export type LinkedProductsAwardHostProps = {
  /** Linked-products `kind` from the route, or `null` when invalid. */
  kind: "post" | "promotion" | null;
  /** Post or promotion uuid, or `null` when invalid. */
  entityId: string | null;
};

/**
 * Convenience host for the linked-products route — maps `promotion` → `promo`.
 */
export function LinkedProductsAwardHost({
  kind,
  entityId,
}: LinkedProductsAwardHostProps): React.ReactElement | null {
  const contentType =
    kind === null ? null : contentViewTypeFromLinkedKind(kind);

  return (
    <ContentViewAwardHost contentType={contentType} contentId={entityId} />
  );
}
