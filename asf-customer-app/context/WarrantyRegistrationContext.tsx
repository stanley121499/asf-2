import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useAuthContext } from "@/context/AuthContext";
import {
  activateWarrantyRegistration,
  listWarrantyRegistrations,
  type ActivateRegistrationBody,
  type RegistrationSummary,
} from "@/lib/warranty/warrantyRegistrationApi";

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

  const refreshRegistrations = useCallback(async (): Promise<void> => {
    if (user === null) {
      setRegistrations([]);
      return;
    }
    setLoading(true);
    try {
      const result = await listWarrantyRegistrations();
      if (result.ok === false) {
        console.warn(
          "WarrantyRegistrationProvider: list failed",
          result.error,
          result.message
        );
        setRegistrations([]);
        return;
      }
      setRegistrations(result.registrations);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshRegistrations();
  }, [refreshRegistrations]);

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
    }),
    [registrations, loading, refreshRegistrations, activateRegistration]
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
