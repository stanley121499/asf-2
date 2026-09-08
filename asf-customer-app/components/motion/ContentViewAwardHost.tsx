import React, { useCallback, useEffect, useRef, useState } from "react";

import { AchievementCeremony } from "@/components/motion/AchievementCeremony";
import { useAlertContext } from "@/context/AlertContext";
import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/context/LocaleContext";
import { getApiBaseUrl } from "@/lib/api";
import {
  contentViewTypeFromLinkedKind,
  hasShownGuestDiscoveryPrompt,
  isContentViewAwardUuid,
  markGuestDiscoveryPromptShown,
  requestContentViewAward,
  type ContentViewAwardType,
} from "@/lib/contentViewAward";

/**
 * Resolves the API base for __DEV__ failure banners without throwing.
 */
function safeApiBaseForAlert(): string {
  try {
    return getApiBaseUrl();
  } catch (err) {
    return err instanceof Error ? err.message : "API base unavailable";
  }
}

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
 * Host that requests a first-view discovery award and shows
 * {@link AchievementCeremony} when the server returns `awarded: true`.
 *
 * Guests get an optional one-time soft “sign in to earn points” alert —
 * never a fake ceremony. Mount on PDP and linked-products only (not feed
 * scroll impressions).
 */
export function ContentViewAwardHost({
  contentType,
  contentId,
}: ContentViewAwardHostProps): React.ReactElement | null {
  const { user, loading: authLoading } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { t } = useTranslation();

  const userId = user?.id ?? null;

  const [ceremonyVisible, setCeremonyVisible] = useState(false);
  const [ceremonyPoints, setCeremonyPoints] = useState(0);

  /** Keys that reached a terminal outcome (award / already / guest prompt). */
  const terminalKeysRef = useRef<Set<string>>(new Set());
  /** Avoid spamming soft failure alerts when the API is down. */
  const failureAlertShownRef = useRef(false);
  const showAlertRef = useRef(showAlert);
  const tRef = useRef(t);

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
      });

      if (cancelled) {
        return;
      }

      if (result.awarded === true && result.points > 0) {
        terminalKeysRef.current.add(attemptKey);
        setCeremonyPoints(result.points);
        setCeremonyVisible(true);
        return;
      }

      if (result.alreadyAwarded === true || result.skippedLocally === true) {
        terminalKeysRef.current.add(attemptKey);
        if (__DEV__) {
          console.info("[ContentViewAwardHost] no ceremony (already handled)", {
            contentType,
            contentId,
            alreadyAwarded: result.alreadyAwarded,
            skippedLocally: result.skippedLocally,
            points: result.points,
          });
        }
        return;
      }

      // Transient failure — leave key unlocked so leaving/re-entering PDP retries.
      const apiBase = safeApiBaseForAlert();
      const attemptedUrl = `${apiBase}/api/rewards/content-view`;
      const statusLabel =
        result.httpStatus > 0 ? String(result.httpStatus) : "network";

      console.warn("[ContentViewAwardHost] award request failed", {
        contentType,
        contentId,
        httpStatus: result.httpStatus,
        attemptedUrl,
      });

      if (__DEV__ && !failureAlertShownRef.current) {
        failureAlertShownRef.current = true;
        showAlertRef.current(
          tRef.current("rewards.discoveryAwardFailedDev", {
            url: attemptedUrl,
            status: statusLabel,
          }),
          "warning"
        );
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [authLoading, contentType, contentId, userId]);

  if (!ceremonyVisible || ceremonyPoints <= 0) {
    return null;
  }

  return (
    <AchievementCeremony
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
