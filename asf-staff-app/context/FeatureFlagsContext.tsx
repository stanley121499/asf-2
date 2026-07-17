import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { supabase } from "@/lib/supabase";

/**
 * Minimal row type for the `feature_flags` table.
 * Once the migration is run and `database.types.ts` is regenerated via
 * `supabase gen types typescript`, replace `FeatureFlagRow` usages with
 * `Tables<"feature_flags">` from `@/database.types`.
 */
interface FeatureFlagRow {
  key: string;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Feature key registry
// ---------------------------------------------------------------------------

/**
 * All platform-wide feature keys. Adding a new key here and seeding a row in
 * `feature_flags` is the only change needed to gate a new module.
 */
export const FEATURE_KEYS = [
  "announcements",
  "highlights",
  "wishlist",
  "cart",
  /**
   * Physical warranty card activation + in-store voucher redeem.
   * Same key as customer app (`warranty_registration`); prefer over reusing
   * `claims` so photo-based claims and card registration ship independently.
   */
  "warranty_registration",
  "promotions",
  "rewards",
  "notifications",
  "support_chat",
  "orders",
  "stocks",
  "purchase_orders",
  "stock_reports",
  "analytics",
  "user_management",
  "payments",
  "internal_chat",
  "home_page_builder",
  "maintenance",
  "signup",
  "store_locations",
] as const;

/** Union type of every valid feature flag key. */
export type FeatureKey = (typeof FEATURE_KEYS)[number];

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

/** Public API exposed by FeatureFlagsContext. */
export interface FeatureFlagsContextProps {
  /**
   * Returns whether the given feature is enabled.
   * Returns `true` while the initial fetch is still loading so UI does not
   * flash "feature disabled" before flags arrive.
   */
  isEnabled: (key: FeatureKey) => boolean;
  /** True during the initial fetch from Supabase. */
  loading: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextProps | undefined>(
  undefined
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * FeatureFlagsProvider fetches all rows from `feature_flags` on mount and
 * subscribes to Realtime changes so flag flips apply live across all screens
 * without requiring an app restart.
 *
 * Place this provider above all feature-specific providers (e.g. inside
 * `<AuthProvider>` but above `<ProductContextBundle>`).
 */
export function FeatureFlagsProvider({
  children,
}: PropsWithChildren): React.ReactElement {
  /** Map of key → enabled. Starts empty; populated after first fetch. */
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);

  /** Fetches all feature flag rows and updates local state. */
  const fetchFlags = useCallback(async (): Promise<void> => {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("key, enabled");

    if (error) {
      console.warn("FeatureFlagsProvider: fetch failed", error.message);
      // On error keep previous state; do not lock everything out.
      setLoading(false);
      return;
    }

    const map: Record<string, boolean> = {};
    const rows = (data ?? []) as FeatureFlagRow[];
    for (const row of rows) {
      map[row.key] = row.enabled;
    }
    setFlags(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchFlags();

    // Subscribe to INSERT / UPDATE / DELETE on the feature_flags table so that
    // a flag change in the Supabase dashboard propagates to the running app
    // within seconds without a restart.
    const channel = supabase
      .channel("feature_flags_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feature_flags" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setFlags((prev) => {
              const next = { ...prev };
              const oldKey = (payload.old as { key?: string }).key;
              if (typeof oldKey === "string") {
                delete next[oldKey];
              }
              return next;
            });
          } else {
            // INSERT or UPDATE — payload.new has the latest row
            const row = payload.new as { key: string; enabled: boolean };
            if (typeof row.key === "string") {
              setFlags((prev) => ({ ...prev, [row.key]: row.enabled }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchFlags]);

  const isEnabled = useCallback(
    (key: FeatureKey): boolean => {
      // Keys whose *safe* default is OFF (match customer app). Returning `true`
      // for these while the flag fetch is in-flight would flash gated UI.
      // `warranty_registration` stays off until a `feature_flags` row enables it.
      const defaultsOff =
        key === "maintenance" || key === "warranty_registration";

      if (loading) {
        return defaultsOff ? false : true;
      }
      // After load: respect the DB value. Missing rows fall back to the
      // per-key safe default (off for `defaultsOff` keys, on otherwise).
      if (flags[key] === undefined) {
        return defaultsOff ? false : true;
      }
      return flags[key];
    },
    [flags, loading]
  );

  const value = useMemo<FeatureFlagsContextProps>(
    () => ({ isEnabled, loading }),
    [isEnabled, loading]
  );

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the FeatureFlagsContext value.
 * Must be called inside a `<FeatureFlagsProvider>`.
 */
export function useFeatureFlags(): FeatureFlagsContextProps {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagsProvider"
    );
  }
  return context;
}
