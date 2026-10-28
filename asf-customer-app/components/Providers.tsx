import type { ComponentType, PropsWithChildren, ReactElement } from "react";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider } from "@/context/AuthContext";
import { AlertProvider } from "@/context/AlertContext";
import { ContentTranslationProvider } from "@/context/ContentTranslationContext";
import { FeatureFlagsProvider } from "@/context/FeatureFlagsContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { DesignPreviewProvider } from "@/context/DesignPreviewContext";
import { StoreWelcomeProvider } from "@/context/StoreWelcomeContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { colors } from "@/constants/theme";
import { bootLog } from "@/lib/bootLog";
import { clearLastCrash, readLastCrash } from "@/lib/earlyCrashLog";
import { NEARBY_STOCK_ALERTS_ENABLED } from "@/lib/nearbyStockAlerts";
import { PUSH_NOTIFICATIONS_ENABLED } from "@/lib/pushNotificationsEnabled";
import { scheduleAfterIdle } from "@/lib/scheduleAfterIdle";

bootLog("Providers module load");

const rawStripeKey = (process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").trim();

/**
 * Only pass a real publishable key into Stripe. Empty / invalid keys have caused
 * native Android initialise crashes on older stripe-react-native builds.
 */
const stripePublishableKey =
  rawStripeKey.startsWith("pk_test_") || rawStripeKey.startsWith("pk_live_")
    ? rawStripeKey
    : "";

type StripeProviderComponent = (props: {
  publishableKey: string;
  urlScheme: string;
  children: React.ReactNode;
}) => ReactElement | null;

type NullComponent = () => null;

type RouteBundleComponent = ComponentType<PropsWithChildren>;

/**
 * Lazily loads `@stripe/stripe-react-native` so a missing native binary cannot
 * kill the JS bundle during cold-start module evaluation.
 */
function loadStripeProvider(): StripeProviderComponent | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional soft-fail require
    const mod = require("@stripe/stripe-react-native") as {
      StripeProvider?: StripeProviderComponent;
    };
    if (typeof mod.StripeProvider !== "function") {
      return null;
    }
    return mod.StripeProvider;
  } catch (err) {
    console.warn(
      "[stripe] @stripe/stripe-react-native unavailable",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * True after the first idle tick so push / background location native
 * side-effects never run during the cold-start critical path.
 */
function useAfterFirstFrame(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handle = scheduleAfterIdle(() => {
      setReady(true);
    });
    return () => {
      handle.cancel();
    };
  }, []);

  return ready;
}

/**
 * Wraps children in StripeProvider only when a valid publishable key is baked in
 * and the native Stripe module loads successfully.
 */
function OptionalStripeProvider({
  children,
}: PropsWithChildren): ReactElement {
  const [StripeProvider, setStripeProvider] = useState<StripeProviderComponent | null>(
    null,
  );

  useEffect(() => {
    if (stripePublishableKey.length === 0) {
      if (__DEV__) {
        console.warn(
          "[stripe] EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY missing or invalid — StripeProvider skipped",
        );
      }
      return;
    }
    const loaded = loadStripeProvider();
    if (loaded !== null) {
      setStripeProvider(() => loaded);
    }
  }, []);

  if (StripeProvider === null || stripePublishableKey.length === 0) {
    return <>{children}</>;
  }

  return (
    <StripeProvider publishableKey={stripePublishableKey} urlScheme="asf-customer-app">
      {children}
    </StripeProvider>
  );
}

/**
 * Deferred push + background-location registrars. Static imports of these files
 * pull in expo-notifications / expo-location / expo-task-manager at cold start;
 * requiring them after the first frame keeps the launch path lean.
 */
function DeferredNativeRegistrars(): ReactElement | null {
  const [Push, setPush] = useState<NullComponent | null>(null);
  const [Loc, setLoc] = useState<NullComponent | null>(null);

  useEffect(() => {
    try {
      // Kill-switch: never pull PushTokenRegistrar / expo-notifications when off.
      if (PUSH_NOTIFICATIONS_ENABLED) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional deferred require
        const pushMod = require("@/components/PushTokenRegistrar") as {
          PushTokenRegistrar?: NullComponent;
        };
        const pushCandidate = pushMod.PushTokenRegistrar;
        if (typeof pushCandidate === "function") {
          setPush(() => pushCandidate);
        }
      }
    } catch (err) {
      console.warn(
        "[providers] PushTokenRegistrar load soft-failed",
        err instanceof Error ? err.message : err,
      );
    }

    try {
      // Kill-switch: never pull BackgroundLocationRegistrar / TaskManager when off.
      if (NEARBY_STOCK_ALERTS_ENABLED) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional deferred require
        const locMod = require("@/components/BackgroundLocationRegistrar") as {
          BackgroundLocationRegistrar?: NullComponent;
        };
        const locCandidate = locMod.BackgroundLocationRegistrar;
        if (typeof locCandidate === "function") {
          setLoc(() => locCandidate);
        }
      }
    } catch (err) {
      console.warn(
        "[providers] BackgroundLocationRegistrar load soft-failed",
        err instanceof Error ? err.message : err,
      );
    }
  }, []);

  if (Push === null && Loc === null) {
    return null;
  }

  return (
    <>
      {Push !== null ? <Push /> : null}
      {Loc !== null ? <Loc /> : null}
    </>
  );
}

/**
 * Lazy-requires `RouteContextBundle` after first paint so the ~20 product/post
 * context modules (and `database.types`) never block Providers mount.
 * Withholds route children until the bundle is ready — Stack screens need those
 * contexts and would crash if mounted early.
 */
function DeferredRouteContextBundle({
  children,
}: PropsWithChildren): ReactElement {
  const [RouteBundle, setRouteBundle] = useState<RouteBundleComponent | null>(
    null,
  );

  useEffect(() => {
    const handle = scheduleAfterIdle(() => {
      const requireStartedAt = Date.now();
      bootLog("RouteContextBundle require start");
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional deferred require
        const mod = require("@/context/RouteContextBundle") as {
          RouteContextBundle?: RouteBundleComponent;
        };
        const candidate = mod.RouteContextBundle;
        if (typeof candidate !== "function") {
          bootLog("RouteContextBundle require missing export");
          return;
        }
        bootLog(
          `RouteContextBundle require done (+${String(Date.now() - requireStartedAt)}ms)`,
        );
        setRouteBundle(() => candidate);
      } catch (err) {
        bootLog(
          "RouteContextBundle require failed",
          err instanceof Error ? err.message : err,
        );
      }
    }, 0);
    return () => {
      handle.cancel();
    };
  }, []);

  useEffect(() => {
    if (RouteBundle !== null) {
      bootLog("RouteContextBundle mount");
    }
  }, [RouteBundle]);

  if (RouteBundle === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <RouteBundle>{children}</RouteBundle>;
}

/**
 * App shell: Stripe, auth, feature flags, alerts, locale, theme, content translation,
 * then a deferred customer `RouteContextBundle`.
 * FeatureFlagsProvider sits above RouteContextBundle so that all feature-specific
 * providers can conditionally skip mounting when their flag is off.
 * LocaleProvider wraps ContentTranslationProvider so overlays can read `locale`.
 * ThemeProvider sits beside locale so tabs/stack can read `useTheme` / `useThemeTokens`.
 * DesignPreviewProvider sits inside Theme so Design Lab can use tokens; it does not
 * alter Auth / Theme hydrate order.
 * StoreWelcomeProvider sits beside DesignPreview so Preview + notification taps can
 * present welcome UIs; the host mounts inside RouteContextBundle (needs catalog).
 * Push + background location registrars mount only after the first interaction
 * frame, and only when their respective kill-switches are on
 * (`PUSH_NOTIFICATIONS_ENABLED` / `NEARBY_STOCK_ALERTS_ENABLED`).
 */
export function AppProviders({ children }: PropsWithChildren): ReactElement {
  const afterFirstFrame = useAfterFirstFrame();
  const loggedRenderRef = useRef(false);

  /** Sync breadcrumb — fires before child effects, unlike useEffect. */
  if (!loggedRenderRef.current) {
    loggedRenderRef.current = true;
    bootLog("Providers render (sync)");
  }

  useEffect(() => {
    bootLog("Providers mount");
    // Drop stale DesignPreview / provider-missing redboxes once the live tree
    // has a healthy provider shell — AsyncStorage lastCrash otherwise reblocks.
    void (async (): Promise<void> => {
      const last = await readLastCrash();
      if (last === null) {
        return;
      }
      const normalized = last.message.trim().toLowerCase();
      if (
        normalized.includes("usedesignpreview") ||
        (normalized.includes("must be used within a") &&
          normalized.includes("provider"))
      ) {
        await clearLastCrash();
        bootLog("cleared obsolete DesignPreview lastCrash");
      }
    })();
  }, []);

  useEffect(() => {
    if (afterFirstFrame) {
      bootLog("Providers after first frame — deferred registrars enabled");
    }
  }, [afterFirstFrame]);

  return (
    <OptionalStripeProvider>
      <AuthProvider>
        <FeatureFlagsProvider>
          <AlertProvider>
            <LocaleProvider>
              <ThemeProvider>
                <DesignPreviewProvider>
                  <StoreWelcomeProvider>
                    <ContentTranslationProvider>
                      <DeferredRouteContextBundle>
                        <StoreWelcomeHostLazy />
                        {afterFirstFrame ? <DeferredNativeRegistrars /> : null}
                        {children}
                      </DeferredRouteContextBundle>
                    </ContentTranslationProvider>
                  </StoreWelcomeProvider>
                </DesignPreviewProvider>
              </ThemeProvider>
            </LocaleProvider>
          </AlertProvider>
        </FeatureFlagsProvider>
      </AuthProvider>
    </OptionalStripeProvider>
  );
}

/**
 * Renders {@link StoreWelcomeHost} only after RouteContextBundle is ready.
 * Lazy-requires so Providers module eval does not pull ProductContext.
 * Soft-fails + error-bounds so a mid-edit Design Lab host cannot kill Profile.
 */
type StoreWelcomeHostComponent = () => ReactElement | null;

let cachedStoreWelcomeHost: StoreWelcomeHostComponent | null = null;

/**
 * Catches render errors inside the welcome host so a bad variant cannot unmount
 * the whole `RouteContextBundle` tree (Home / Profile / tabs).
 */
class StoreWelcomeHostErrorBoundary extends React.Component<
  PropsWithChildren,
  { hasError: boolean }
> {
  public constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error): void {
    console.warn(
      "[providers] StoreWelcomeHost render soft-failed",
      error instanceof Error ? error.message : error,
    );
  }

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function loadStoreWelcomeHost(): StoreWelcomeHostComponent {
  if (cachedStoreWelcomeHost !== null) {
    return cachedStoreWelcomeHost;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- keep host off Providers module graph
    const mod = require("@/components/designPreview/StoreWelcomeHost") as {
      StoreWelcomeHost?: StoreWelcomeHostComponent;
    };
    const Host = mod.StoreWelcomeHost;
    cachedStoreWelcomeHost =
      typeof Host === "function" ? Host : (): null => null;
  } catch (err) {
    console.warn(
      "[providers] StoreWelcomeHost require soft-failed",
      err instanceof Error ? err.message : err,
    );
    cachedStoreWelcomeHost = (): null => null;
  }
  return cachedStoreWelcomeHost;
}

function StoreWelcomeHostLazy(): ReactElement | null {
  const Host = loadStoreWelcomeHost();
  return (
    <StoreWelcomeHostErrorBoundary>
      <Host />
    </StoreWelcomeHostErrorBoundary>
  );
}
