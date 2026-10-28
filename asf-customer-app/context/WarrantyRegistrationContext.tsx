import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { useAuthContext } from "@/context/AuthContext";
import { logPrioP2Fetch, logPrioP2Skip } from "@/lib/prioLog";
import { useP2FocusRetain } from "@/lib/useP2FocusRetain";
import {
  activateWarrantyRegistration,
  listWarrantyRegistrations,
  type ActivateRegistrationBody,
  type RegistrationSummary,
} from "@/lib/warranty/warrantyRegistrationApi";

/**
 * Skip warranty-registration network refetch on re-focus when the last
 * successful fetch for this user is newer than this window.
 */
const WARRANTY_REGISTRATION_P2_FRESH_MS = 5 * 60 * 1000;

type WarrantyRegistrationContextValue = {
  registrations: RegistrationSummary[];
  loading: boolean;
  refreshRegistrations: () => Promise<void>;
  activateRegistration: (
    body: ActivateRegistrationBody
  ) => Promise<
    | { ok: true; registration: RegistrationSummary }
    | { ok: false; error: string; message: string }
  >;
  /** P2: retain registration list fetch while My Collection is focused. */
  retainFocus: () => () => void;
};

const WarrantyRegistrationContext = createContext<
  WarrantyRegistrationContextValue | undefined
>(undefined);

/**
 * Loads the customer's physical warranty registrations via Next APIs
 * (`GET/POST /api/warranty/registrations*`). Refresh after activate so
 * My Collection stays in sync without writing codes/credits from Expo.
 *
 * Feature flag: gated by `warranty_registration` in RouteContextBundle
 * (prefer new flag over reusing `claims` — see FeatureFlagsContext).
 */
export function WarrantyRegistrationProvider({
  children,
}: Readonly<PropsWithChildren>): React.ReactElement {
  const { user } = useAuthContext();
  const [registrations, setRegistrations] = useState<RegistrationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [retainCount, setRetainCount] = useState(0);
  /** Epoch ms of last completed registrations fetch (0 = never). */
  const lastFetchedAtRef = useRef(0);
  /** User id the last fetch belonged to (null = none). */
  const lastFetchedUserIdRef = useRef<string | null>(null);
  /** True after at least one fetch attempt finished for the current user. */
  const hasFetchedRef = useRef(false);

  const refreshRegistrations = useCallback(async (): Promise<void> => {
    if (user === null) {
      setRegistrations([]);
      lastFetchedAtRef.current = 0;
      lastFetchedUserIdRef.current = null;
      hasFetchedRef.current = false;
      return;
    }
    setLoading(true);
    logPrioP2Fetch("warranty_registration", "blocking");
    try {
      const result = await listWarrantyRegistrations();
      if (result.ok === false) {
        console.warn(
          "WarrantyRegistrationProvider: list failed",
          result.error,
          result.message
        );
        setRegistrations([]);
        lastFetchedAtRef.current = Date.now();
        lastFetchedUserIdRef.current = user.id;
        hasFetchedRef.current = true;
        return;
      }
      setRegistrations(result.registrations);
      lastFetchedAtRef.current = Date.now();
      lastFetchedUserIdRef.current = user.id;
      hasFetchedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const retainFocus = useCallback((): (() => void) => {
    setRetainCount((count) => count + 1);
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      setRetainCount((count) => Math.max(0, count - 1));
    };
  }, []);

  /** True while any screen holds retain (boolean — avoids effect churn on 1↔2). */
  const isRetained = retainCount > 0;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isRetained) {
      return;
    }

    const now = Date.now();
    const ageMs = now - lastFetchedAtRef.current;
    const sameUser =
      typeof userId === "string" && lastFetchedUserIdRef.current === userId;
    if (
      hasFetchedRef.current &&
      sameUser &&
      ageMs >= 0 &&
      ageMs < WARRANTY_REGISTRATION_P2_FRESH_MS
    ) {
      logPrioP2Skip(
        "warranty_registration",
        `fresh ${String(Math.round(ageMs))}ms < ${String(WARRANTY_REGISTRATION_P2_FRESH_MS)}ms`
      );
      return;
    }
    void refreshRegistrations();
  }, [refreshRegistrations, isRetained, userId]);

  const activateRegistration = useCallback(
    async (
      body: ActivateRegistrationBody
    ): Promise<
      | { ok: true; registration: RegistrationSummary }
      | { ok: false; error: string; message: string }
    > => {
      const result = await activateWarrantyRegistration(body);
      if (result.ok === false) {
        return {
          ok: false,
          error: result.error,
          message: result.message,
        };
      }
      await refreshRegistrations();
      return { ok: true, registration: result.registration };
    },
    [refreshRegistrations]
  );

  const value = useMemo(
    (): WarrantyRegistrationContextValue => ({
      registrations,
      loading,
      refreshRegistrations,
      activateRegistration,
      retainFocus,
    }),
    [registrations, loading, refreshRegistrations, activateRegistration, retainFocus]
  );

  return (
    <WarrantyRegistrationContext.Provider value={value}>
      {children}
    </WarrantyRegistrationContext.Provider>
  );
}

/** Hook for My Collection list + activate. */
export function useWarrantyRegistrationContext(): WarrantyRegistrationContextValue {
  const ctx = useContext(WarrantyRegistrationContext);
  if (ctx === undefined) {
    throw new Error(
      "useWarrantyRegistrationContext must be used within WarrantyRegistrationProvider"
    );
  }
  return ctx;
}

/** P2: warranty registrations fetch while this screen is focused. */
export function useWarrantyRegistrationP2Focus(
  name: string = "warranty_registration"
): void {
  const { retainFocus } = useWarrantyRegistrationContext();
  useP2FocusRetain(name, retainFocus);
}
