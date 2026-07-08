import type { PropsWithChildren } from "react";
import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

import { AuthProvider } from "@/context/AuthContext";
import { AlertProvider } from "@/context/AlertContext";
import { ContentTranslationProvider } from "@/context/ContentTranslationContext";
import { FeatureFlagsProvider } from "@/context/FeatureFlagsContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { RouteContextBundle } from "@/context/RouteContextBundle";

const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

/**
 * App shell: Stripe, auth, feature flags, alerts, locale, content translation,
 * and the slim customer `RouteContextBundle`.
 * FeatureFlagsProvider sits above RouteContextBundle so that all feature-specific
 * providers can conditionally skip mounting when their flag is off.
 * LocaleProvider wraps ContentTranslationProvider so overlays can read `locale`.
 */
export function AppProviders({ children }: PropsWithChildren): React.ReactElement {
  return (
    <StripeProvider publishableKey={stripeKey} urlScheme="asf-customer-app">
      <AuthProvider>
        <FeatureFlagsProvider>
          <AlertProvider>
            <LocaleProvider>
              <ContentTranslationProvider>
                <RouteContextBundle>{children}</RouteContextBundle>
              </ContentTranslationProvider>
            </LocaleProvider>
          </AlertProvider>
        </FeatureFlagsProvider>
      </AuthProvider>
    </StripeProvider>
  );
}
