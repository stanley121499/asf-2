import { StorefrontCartChrome } from "@/themes/storefront/CartChrome";
import { StorefrontHighlightsScreen } from "@/themes/storefront/screens/Highlights";
import { StorefrontHomeScreen } from "@/themes/storefront/screens/Home";
import { StorefrontProductDetailScreen } from "@/themes/storefront/screens/ProductDetail";
import { StorefrontProfileHubScreen } from "@/themes/storefront/screens/ProfileHub";
import { StorefrontShopScreen } from "@/themes/storefront/screens/Shop";
import { storefrontTabBar } from "@/themes/storefront/tabBar";
import { storefrontTokens } from "@/themes/storefront/tokens";
import type { ThemePack } from "@/themes/types";

/**
 * Storefront theme pack — Classic clone scaffold (tokens + screens).
 * Home/Shop IA rewrites land in later agents; this pack isolates the skin.
 * Header-bag cart chrome lives inside screen headers via `CartButton`;
 * pack `CartChrome` is a no-op overlay for `CartChromeHost`.
 */
export const storefrontPack: ThemePack = {
  id: "storefront",
  tokens: storefrontTokens,
  tabBar: storefrontTabBar,
  screens: {
    Home: StorefrontHomeScreen,
    Shop: StorefrontShopScreen,
    ProductDetail: StorefrontProductDetailScreen,
    Highlights: StorefrontHighlightsScreen,
    ProfileHub: StorefrontProfileHubScreen,
  },
  CartChrome: StorefrontCartChrome,
};
