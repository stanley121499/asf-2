import type { PropsWithChildren } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { ActiveWelcomeVariantId, StoreWelcomePayload } from "@/lib/storeWelcome";

type StoreWelcomeContextValue = {
  /** Current payload when a welcome popup should show; null when hidden. */
  payload: StoreWelcomePayload | null;
  /** Active visual variant for the open popup. */
  variant: ActiveWelcomeVariantId;
  /**
   * Presents the store-welcome popup with the given payload and variant.
   * Replaces any currently open welcome.
   */
  presentWelcome: (
    nextPayload: StoreWelcomePayload,
    nextVariant: ActiveWelcomeVariantId,
  ) => void;
  /** Closes the welcome popup without navigating. */
  dismissWelcome: () => void;
};

const StoreWelcomeContext = createContext<StoreWelcomeContextValue | undefined>(
  undefined,
);

/**
 * Holds the in-app store-welcome presentation queue (single slot).
 * Design Lab Preview and nearby-stock notification taps call {@link presentWelcome};
 * {@link StoreWelcomeHost} renders the selected variant.
 */
export function StoreWelcomeProvider({
  children,
}: PropsWithChildren): React.ReactElement {
  const [payload, setPayload] = useState<StoreWelcomePayload | null>(null);
  const [variant, setVariant] = useState<ActiveWelcomeVariantId>("1");

  const presentWelcome = useCallback(
    (
      nextPayload: StoreWelcomePayload,
      nextVariant: ActiveWelcomeVariantId,
    ): void => {
      setVariant(nextVariant);
      setPayload(nextPayload);
    },
    [],
  );

  const dismissWelcome = useCallback((): void => {
    setPayload(null);
  }, []);

  const value = useMemo<StoreWelcomeContextValue>(
    () => ({
      payload,
      variant,
      presentWelcome,
      dismissWelcome,
    }),
    [payload, variant, presentWelcome, dismissWelcome],
  );

  return (
    <StoreWelcomeContext.Provider value={value}>
      {children}
    </StoreWelcomeContext.Provider>
  );
}

/**
 * Hook to present / dismiss the store-welcome popup.
 * Must be used inside {@link StoreWelcomeProvider}.
 */
export function useStoreWelcome(): StoreWelcomeContextValue {
  const context = useContext(StoreWelcomeContext);
  if (context === undefined) {
    throw new Error("useStoreWelcome must be used within a StoreWelcomeProvider");
  }
  return context;
}
