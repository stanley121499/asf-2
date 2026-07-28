import { ClassicCartChrome } from "@/themes/classic/CartChrome";
import { ClassicHighlightsScreen } from "@/themes/classic/screens/Highlights";
import { ClassicHomeScreen } from "@/themes/classic/screens/Home";
import { ClassicProductDetailScreen } from "@/themes/classic/screens/ProductDetail";
import { ClassicProfileHubScreen } from "@/themes/classic/screens/ProfileHub";
import { ClassicShopScreen } from "@/themes/classic/screens/Shop";
import { classicTabBar } from "@/themes/classic/tabBar";
import { classicTokens } from "@/themes/classic/tokens";
import type { ThemePack } from "@/themes/types";

/**
 * Classic theme pack — boutique landing (current app feel).
 * Header-bag cart chrome lives inside screen headers via `CartButton`;
 * pack `CartChrome` is a no-op overlay for `CartChromeHost`.
 */
export const classicPack: ThemePack = {
  id: "classic",
  tokens: classicTokens,
  tabBar: classicTabBar,
  screens: {
    Home: ClassicHomeScreen,
    Shop: ClassicShopScreen,
    ProductDetail: ClassicProductDetailScreen,
    Highlights: ClassicHighlightsScreen,
    ProfileHub: ClassicProfileHubScreen,
  },
  CartChrome: ClassicCartChrome,
};
