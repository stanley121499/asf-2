import type { PropsWithChildren } from "react";
import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

import { BackgroundLocationRegistrar } from "@/components/BackgroundLocationRegistrar";
import { PushTokenRegistrar } from "@/components/PushTokenRegistrar";
import { AuthProvider } from "@/context/AuthContext";
import "@/lib/backgroundLocation";
import { AlertProvider } from "@/context/AlertContext";
import { ContentTranslationProvider } from "@/context/ContentTranslationContext";
import { FeatureFlagsProvider } from "@/context/FeatureFlagsContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { RouteContextBundle } from "@/context/RouteContextBundle";

const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

/**
 * App shell: Stripe, auth, feature flags, alerts, locale, theme, content translation,
 * and the slim customer `RouteContextBundle`.
 * FeatureFlagsProvider sits above RouteContextBundle so that all feature-specific
 * providers can conditionally skip mounting when their flag is off.
 * LocaleProvider wraps ContentTranslationProvider so overlays can read `locale`.
 * ThemeProvider sits beside locale so tabs/stack can read `useTheme` / `useThemeTokens`.
 * {@link PushTokenRegistrar} and {@link BackgroundLocationRegistrar} mount inside
 * RouteContextBundle so they can use NotificationContext / auth for push + Always location.
 */
export function AppProviders({ children }: PropsWithChildren): React.ReactElement {
  return (
    <StripeProvider publishableKey={stripeKey} urlScheme="asf-customer-app">
      <AuthProvider>
        <FeatureFlagsProvider>
          <AlertProvider>
            <LocaleProvider>
              <ThemeProvider>
                <ContentTranslationProvider>
                  <RouteContextBundle>
                    <PushTokenRegistrar />
                    <BackgroundLocationRegistrar />
                    {children}
                  </RouteContextBundle>
                </ContentTranslationProvider>
              </ThemeProvider>
            </LocaleProvider>
          </AlertProvider>
        </FeatureFlagsProvider>
      </AuthProvider>
    </StripeProvider>
  );
}
