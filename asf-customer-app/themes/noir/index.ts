import { NoirCartChrome } from "@/themes/noir/CartChrome";
import { NoirHighlightsScreen } from "@/themes/noir/screens/Highlights";
import { NoirHomeScreen } from "@/themes/noir/screens/Home";
import { NoirLocationsScreen } from "@/themes/noir/screens/Locations";
import { NoirProductDetailScreen } from "@/themes/noir/screens/ProductDetail";
import { NoirProfileHubScreen } from "@/themes/noir/screens/ProfileHub";
import { NoirShopScreen } from "@/themes/noir/screens/Shop";
import { noirTabBar } from "@/themes/noir/tabBar";
import { noirTokens } from "@/themes/noir/tokens";
import type { ThemePack } from "@/themes/types";

/**
 * Noir theme pack — immersive night retail.
 *
 * Headers-everywhere cart: bags live in Home / Shop / Highlights / Profile hub
 * headers (and SubPageHeader `showCart`). Pack `CartChrome` is a no-op host
 * overlay — no FAB. Stores uses pack `Locations` (dark locator).
 */
export const noirPack: ThemePack = {
  id: "noir",
  tokens: noirTokens,
  tabBar: noirTabBar,
  screens: {
    Home: NoirHomeScreen,
    Shop: NoirShopScreen,
    ProductDetail: NoirProductDetailScreen,
    Highlights: NoirHighlightsScreen,
    ProfileHub: NoirProfileHubScreen,
    Locations: NoirLocationsScreen,
  },
  CartChrome: NoirCartChrome,
};
