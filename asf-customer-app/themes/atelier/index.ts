import { AtelierCartChrome } from "@/themes/atelier/CartChrome";
import { AtelierHighlightsScreen } from "@/themes/atelier/screens/Highlights";
import { AtelierHomeScreen } from "@/themes/atelier/screens/Home";
import { AtelierLocationsScreen } from "@/themes/atelier/screens/Locations";
import { AtelierProductDetailScreen } from "@/themes/atelier/screens/ProductDetail";
import { AtelierProfileHubScreen } from "@/themes/atelier/screens/ProfileHub";
import { AtelierShopScreen } from "@/themes/atelier/screens/Shop";
import { atelierTabBar } from "@/themes/atelier/tabBar";
import { atelierTokens } from "@/themes/atelier/tokens";
import type { ThemePack } from "@/themes/types";

/**
 * Atelier theme pack — lookbook / magazine (paper ground, FAB cart).
 *
 * Tier A: Home, Shop (single-column lookbook), ProductDetail (portrait),
 * Highlights, ProfileHub, Locations (Places). Cart chrome is FAB above the tab bar.
 */
export const atelierPack: ThemePack = {
  id: "atelier",
  tokens: atelierTokens,
  tabBar: atelierTabBar,
  screens: {
    Home: AtelierHomeScreen,
    Shop: AtelierShopScreen,
    ProductDetail: AtelierProductDetailScreen,
    Highlights: AtelierHighlightsScreen,
    ProfileHub: AtelierProfileHubScreen,
    Locations: AtelierLocationsScreen,
  },
  CartChrome: AtelierCartChrome,
};
