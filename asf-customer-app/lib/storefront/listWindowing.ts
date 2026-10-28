import { Platform } from "react-native";

/**
 * FlatList scroll-window buffer for Storefront lists.
 *
 * `windowSize` is measured in viewports (not rows). Value `5` ≈ 2.5 screens
 * above + below the visible area — enough to scroll smoothly while recycling
 * off-screen cells so heavy feed / product tiles do not stay mounted forever.
 *
 * ProductContext still hydrates a full (or first-paint) catalog in memory;
 * these props only limit **mounted native views**, not the JS data array.
 * Pair with client `onEndReached` / page slices so `data` itself stays bounded
 * when the full list is already in context.
 */

/** Viewports kept mounted around the scroll position (~2.5 screens). */
export const STOREFRONT_LIST_WINDOW_SIZE = 5;

/**
 * Milliseconds to coalesce cell updates during scroll.
 * Slightly above RN’s 50ms default reduces main-thread thrash on mid-range Android.
 */
export const STOREFRONT_LIST_UPDATE_CELLS_MS = 75;

/**
 * Home feed: {@link StorefrontFeedBlock} rows — render one page on mount.
 * Kept in sync with {@link STOREFRONT_FEED_PAGE_SIZE} (3) at call sites.
 */
export const STOREFRONT_HOME_FEED_MAX_BATCH = 2;

/**
 * Shop product grid (2 columns): first paint ≈ 2–3 rows.
 */
export const STOREFRONT_SHOP_PRODUCT_INITIAL = 6;

/** Shop product grid batch while scrolling. */
export const STOREFRONT_SHOP_PRODUCT_MAX_BATCH = 4;

/**
 * Shop occupation sidebar: denser, lighter rows — allow a longer first paint.
 */
export const STOREFRONT_SHOP_SIDEBAR_INITIAL = 12;

export const STOREFRONT_SHOP_SIDEBAR_MAX_BATCH = 8;

/**
 * `removeClippedSubviews` frees native views off-screen. Enable on Android only:
 * iOS has historically blanked cells with complex / absolutely positioned rows
 * (feed blocks, product tiles).
 */
export const STOREFRONT_LIST_REMOVE_CLIPPED_SUBVIEWS: boolean =
  Platform.OS === "android";
