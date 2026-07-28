import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

import type { FeatureKey } from "@/context/FeatureFlagsContext";

/** Name union accepted by `<Ionicons name="..." />`. */
export type IoniconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Stable anchor ids for every real-UI control a coach-mark tour can
 * spotlight (see plan §7). This is the single source of truth — screens
 * wrap controls with `<TourAnchor id={ANCHORS.home.bag}>` and tour step
 * data references the same constants, so a rename here is caught by the
 * compiler instead of silently breaking a spotlight at runtime.
 */
export const ANCHORS = {
  tabbar: {
    home: "tabbar.home",
    shop: "tabbar.shop",
    profile: "tabbar.profile",
    highlights: "tabbar.highlights",
    locations: "tabbar.locations",
  },
  home: {
    search: "home.search",
    bag: "home.bag",
    /** Heart on the first "new arrivals" card — teaches the save/favourite affordance. */
    saveHeart: "home.saveHeart",
  },
  shop: {
    grid: "shop.grid",
  },
  pdp: {
    size: "pdp.size",
    addToBag: "pdp.addToBag",
  },
  cart: {
    review: "cart.review",
  },
  profile: {
    guideEntry: "profile.guideEntry",
    orders: "profile.orders",
    language: "profile.language",
    support: "profile.support",
    /** "My wishlist" menu row — where saved/favourited shoes live. */
    wishlist: "profile.wishlist",
    /** "My Collection" menu row (warranty_registration flag). */
    collection: "profile.collection",
    /** "My rewards" menu row (rewards flag). */
    rewards: "profile.rewards",
  },
  collection: {
    /** Activate-a-card button in the My Collection header. */
    activate: "collection.activate",
  },
  rewards: {
    /** Points balance card on the Rewards screen. */
    pointsCard: "rewards.pointsCard",
    /** Stamp-collection card on the Rewards screen. */
    stampCard: "rewards.stampCard",
  },
  support: {
    /** Submit button on the Support contact form. */
    submit: "support.submit",
  },
} as const;

/** Recursively collects every string literal nested inside `T`. */
type NestedAnchorValue<T> = T extends string
  ? T
  : T extends Record<string, unknown>
    ? NestedAnchorValue<T[keyof T]>
    : never;

/** Union of every valid anchor id declared in {@link ANCHORS}. */
export type AnchorId = NestedAnchorValue<typeof ANCHORS>;

/** Where the instruction card sits relative to the spotlighted anchor. */
export type GuidePlacement = "top" | "bottom" | "center";

/**
 * One coach-mark step within a {@link GuideTour}. Steps are pure data — the
 * engine (`GuideContext` + `GuideOverlay`) interprets them at runtime. One
 * idea per step; keep `bodyKey` copy plain (see plan §4 vocabulary).
 */
export interface GuideStep {
  /** i18n key for the short step title. */
  titleKey: string;
  /** i18n key for the one-idea step body. */
  bodyKey: string;
  /** Anchor id to spotlight; omit for a centered full-card step (welcome/done). */
  anchorId?: AnchorId;
  /** Route to navigate to (via expo-router) before this step is shown. */
  route?: string;
  /**
   * Card placement relative to the spotlight. When omitted, `GuideOverlay`
   * picks `"center"` (no anchor), or `"top"`/`"bottom"` based on where the
   * anchor sits on screen (so the card never covers its own spotlight).
   */
  placement?: GuidePlacement;
  /**
   * Narrow escape hatch for the handful of step bodies whose copy must
   * reflect *runtime* feature flags rather than a fixed i18n string — only
   * the `firstLaunch` tour's tab-bar step needs this today (plan §5.4: only
   * mention Highlights/Stores when those tabs are actually visible).
   * `GuideOverlay` recognizes each tag and supplies the matching
   * `{param}` values when calling `t(bodyKey, params)`; steps that omit
   * this field are translated as plain static strings.
   */
  dynamicBody?: "firstLaunchTabs";
}

/**
 * A single guided walkthrough ("lesson"). Hub cards launch tours by id via
 * `useGuide().startTour(tour.id)`; the `firstLaunch` tour is triggered
 * automatically after the home arrival ceremony (Agent 4).
 */
export interface GuideTour {
  /** Stable tour id, e.g. `"findShoes"`. Must match its key in {@link TOURS}. */
  id: string;
  /** i18n key for the hub topic card title. */
  titleKey: string;
  /** i18n key for the hub topic card one-line description. */
  descriptionKey: string;
  /** Hub topic card icon. */
  icon: IoniconName;
  /**
   * Optional feature flag gate — when set, the hub only renders this
   * topic's card (and the tour is only startable) while the flag is on.
   */
  featureFlag?: FeatureKey;
  /** Ordered coach-mark steps. */
  steps: GuideStep[];
}

/**
 * Registry of every tour in the app, keyed by {@link GuideTour.id}. Agents
 * 2-4 populate the real hub topics and `firstLaunch` here so `startTour(id)`
 * call sites never hardcode step data.
 *
 * `__engineSmokeTest` is a throwaway two-step, center-card-only tour used to
 * exercise the engine (Next/Back/Skip, reduced motion) while building it. It
 * targets no anchor and no screen references its id, so it is harmless to
 * leave registered for later agents to remove once real tours exist.
 *
 * The nine hub topics below (plan §5.4) were registered by Agent 2 with
 * their hub card metadata (title/description/icon/feature flag) so
 * `app/(tabs)/profile/guide.tsx` has a single source of truth to render
 * cards from. Agent 3 populated real coach-mark `steps` for the three
 * shopping topics (`findShoes`, `chooseSizeAddToBag`, `payCheckout`); Agent
 * 4 populated the remaining six account/help topics plus `firstLaunch` —
 * the automatic post-ceremony orientation tour (not a hub card; excluded
 * from {@link HUB_TOPIC_ORDER}, triggered directly by `app/(tabs)/index.tsx`
 * and replayable via the hub's "Show the welcome tour again" row). Its
 * `titleKey`/`descriptionKey`/`icon` exist only to satisfy {@link GuideTour}
 * — they are never rendered since no screen looks it up by hub order.
 * `startTour()` (see `GuideContext`) safely no-ops on a tour with zero
 * steps, so tapping a not-yet-implemented card never crashes.
 */
export const TOURS: Record<string, GuideTour> = {
  __engineSmokeTest: {
    id: "__engineSmokeTest",
    titleKey: "guide.__smoke.title",
    descriptionKey: "guide.__smoke.description",
    icon: "construct-outline",
    steps: [
      {
        titleKey: "guide.__smoke.step1.title",
        bodyKey: "guide.__smoke.step1.body",
        placement: "center",
      },
      {
        titleKey: "guide.__smoke.step2.title",
        bodyKey: "guide.__smoke.step2.body",
        placement: "center",
      },
    ],
  },
  /**
   * Shop tab → grid → open a shoe's page. The Shop tab and the catalog
   * grid are both reachable from anywhere in the app (the tab bar is
   * always mounted, and `/(tabs)/browse` is a stable route), so every
   * step here can safely declare an anchor/route up front.
   */
  findShoes: {
    id: "findShoes",
    titleKey: "guide.topics.findShoes.title",
    descriptionKey: "guide.topics.findShoes.desc",
    icon: "storefront-outline",
    steps: [
      {
        titleKey: "guide.steps.findShoes.s1.title",
        bodyKey: "guide.steps.findShoes.s1.body",
        anchorId: ANCHORS.tabbar.shop,
      },
      {
        titleKey: "guide.steps.findShoes.s2.title",
        bodyKey: "guide.steps.findShoes.s2.body",
        anchorId: ANCHORS.shop.grid,
        route: "/(tabs)/browse",
      },
      {
        titleKey: "guide.steps.findShoes.s3.title",
        bodyKey: "guide.steps.findShoes.s3.body",
        anchorId: ANCHORS.shop.grid,
        route: "/(tabs)/browse",
      },
    ],
  },
  /**
   * Choice between plan §5.4 options (a) navigate to Shop and ask the user
   * to open a shoe themselves, vs (b) deep-link straight to a specific
   * product. This tour uses **option (a)**: the first step routes to
   * `/(tabs)/browse` and spotlights the grid asking the user to tap a
   * shoe; the remaining steps declare no `route` and simply spotlight
   * `pdp.size` / `pdp.addToBag` on whatever product page the user opens.
   * Reasons: (1) it is more realistic/beginner-friendly — the user
   * practices the real tap instead of watching a page appear on its own;
   * (2) it needs no "first available product" lookup helper, so it can
   * never point at an out-of-stock or hidden product; (3) it degrades
   * gracefully — if the user takes a moment, the steps just wait (centered
   * card) until the real `pdp.size` / `pdp.addToBag` anchors mount.
   * The final step routes back to Home so the bag icon (which just
   * updated) can be spotlighted concretely rather than described in the
   * abstract.
   */
  chooseSizeAddToBag: {
    id: "chooseSizeAddToBag",
    titleKey: "guide.topics.chooseSizeAddToBag.title",
    descriptionKey: "guide.topics.chooseSizeAddToBag.desc",
    icon: "bag-add-outline",
    steps: [
      {
        titleKey: "guide.steps.chooseSizeAddToBag.s1.title",
        bodyKey: "guide.steps.chooseSizeAddToBag.s1.body",
        anchorId: ANCHORS.shop.grid,
        route: "/(tabs)/browse",
      },
      {
        titleKey: "guide.steps.chooseSizeAddToBag.s2.title",
        bodyKey: "guide.steps.chooseSizeAddToBag.s2.body",
        anchorId: ANCHORS.pdp.size,
      },
      {
        titleKey: "guide.steps.chooseSizeAddToBag.s3.title",
        bodyKey: "guide.steps.chooseSizeAddToBag.s3.body",
        anchorId: ANCHORS.pdp.addToBag,
      },
      {
        titleKey: "guide.steps.chooseSizeAddToBag.s4.title",
        bodyKey: "guide.steps.chooseSizeAddToBag.s4.body",
        anchorId: ANCHORS.home.bag,
        route: "/(tabs)/",
      },
    ],
  },
  /**
   * Home bag icon → review the bag on `/cart` → plain-language explanation
   * of paying. Never navigates into the real payment flow (`/checkout`) —
   * the plan explicitly avoids forcing a real transaction just to teach
   * where the button is. Edge case: when the bag is empty, `app/cart.tsx`
   * renders only the empty-state ("Start shopping") view and never mounts
   * `cart.review`, so step 2 has no rect to spotlight — the engine's
   * generic fallback (`GuideOverlay`) shows that step as a centered card
   * instead, which still reads fine ("Check your items and the total
   * here before you pay.") even with nothing in the bag yet.
   */
  payCheckout: {
    id: "payCheckout",
    titleKey: "guide.topics.payCheckout.title",
    descriptionKey: "guide.topics.payCheckout.desc",
    icon: "card-outline",
    steps: [
      {
        titleKey: "guide.steps.payCheckout.s1.title",
        bodyKey: "guide.steps.payCheckout.s1.body",
        anchorId: ANCHORS.home.bag,
        route: "/(tabs)/",
      },
      {
        titleKey: "guide.steps.payCheckout.s2.title",
        bodyKey: "guide.steps.payCheckout.s2.body",
        anchorId: ANCHORS.cart.review,
        route: "/cart",
      },
      {
        titleKey: "guide.steps.payCheckout.s3.title",
        bodyKey: "guide.steps.payCheckout.s3.body",
        placement: "center",
      },
      {
        titleKey: "guide.steps.payCheckout.s4.title",
        bodyKey: "guide.steps.payCheckout.s4.body",
        placement: "center",
      },
    ],
  },
  /**
   * Profile → the orders list → what the status words mean. The list
   * itself is a dynamic `FlatList` (empty/loading states vary per user), so
   * only the entry row is spotlighted concretely; the list-overview and
   * status-meaning steps use a centered card rather than guessing at a
   * specific order card that may not exist for every user.
   */
  seeMyOrders: {
    id: "seeMyOrders",
    titleKey: "guide.topics.seeMyOrders.title",
    descriptionKey: "guide.topics.seeMyOrders.desc",
    icon: "receipt-outline",
    steps: [
      {
        titleKey: "guide.steps.seeMyOrders.s1.title",
        bodyKey: "guide.steps.seeMyOrders.s1.body",
        anchorId: ANCHORS.profile.orders,
        route: "/(tabs)/profile",
      },
      {
        titleKey: "guide.steps.seeMyOrders.s2.title",
        bodyKey: "guide.steps.seeMyOrders.s2.body",
        route: "/(tabs)/profile/orders",
        placement: "center",
      },
      {
        titleKey: "guide.steps.seeMyOrders.s3.title",
        bodyKey: "guide.steps.seeMyOrders.s3.body",
        placement: "center",
      },
    ],
  },
  /**
   * The heart on a product card (home) → the "My wishlist" menu row
   * (Profile) → a closing centered explanation. Anchors the heart on the
   * *first* new-arrivals card on Home (see `home.saveHeart` in
   * `app/(tabs)/index.tsx`) — realistic and stable enough for a spotlight
   * while never depending on a specific product existing.
   */
  saveFavourites: {
    id: "saveFavourites",
    titleKey: "guide.topics.saveFavourites.title",
    descriptionKey: "guide.topics.saveFavourites.desc",
    icon: "heart-outline",
    steps: [
      {
        titleKey: "guide.steps.saveFavourites.s1.title",
        bodyKey: "guide.steps.saveFavourites.s1.body",
        anchorId: ANCHORS.home.saveHeart,
        route: "/(tabs)/",
      },
      {
        titleKey: "guide.steps.saveFavourites.s2.title",
        bodyKey: "guide.steps.saveFavourites.s2.body",
        anchorId: ANCHORS.profile.wishlist,
        route: "/(tabs)/profile",
      },
      {
        titleKey: "guide.steps.saveFavourites.s3.title",
        bodyKey: "guide.steps.saveFavourites.s3.body",
        placement: "center",
      },
    ],
  },
  /**
   * The language row lives in Profile (already anchored by Agent 2). The
   * language list itself opens in a `Modal` owned by the Profile screen's
   * own state — the guide engine cannot open it — so this tour spotlights
   * the row that opens it and explains the picker in words either side.
   */
  changeLanguage: {
    id: "changeLanguage",
    titleKey: "guide.topics.changeLanguage.title",
    descriptionKey: "guide.topics.changeLanguage.desc",
    icon: "language-outline",
    steps: [
      {
        titleKey: "guide.steps.changeLanguage.s1.title",
        bodyKey: "guide.steps.changeLanguage.s1.body",
        placement: "center",
      },
      {
        titleKey: "guide.steps.changeLanguage.s2.title",
        bodyKey: "guide.steps.changeLanguage.s2.body",
        anchorId: ANCHORS.profile.language,
        route: "/(tabs)/profile",
      },
      {
        titleKey: "guide.steps.changeLanguage.s3.title",
        bodyKey: "guide.steps.changeLanguage.s3.body",
        placement: "center",
      },
    ],
  },
  /**
   * Flag verified against `context/FeatureFlagsContext.tsx` and the actual
   * gate used by `app/(tabs)/profile/collection/index.tsx`
   * (`FEATURE_FLAG_KEY = "warranty_registration"`) — not `"claims"` as the
   * plan's table guessed. `claims` gates the separate warranty-credits and
   * claim-filing module, not the Collection / activate-code flow this
   * topic teaches.
   */
  myShoes: {
    id: "myShoes",
    titleKey: "guide.topics.myShoes.title",
    descriptionKey: "guide.topics.myShoes.desc",
    icon: "cube-outline",
    featureFlag: "warranty_registration",
    steps: [
      {
        titleKey: "guide.steps.myShoes.s1.title",
        bodyKey: "guide.steps.myShoes.s1.body",
        anchorId: ANCHORS.profile.collection,
        route: "/(tabs)/profile",
      },
      {
        titleKey: "guide.steps.myShoes.s2.title",
        bodyKey: "guide.steps.myShoes.s2.body",
        anchorId: ANCHORS.collection.activate,
        route: "/(tabs)/profile/collection",
      },
      {
        titleKey: "guide.steps.myShoes.s3.title",
        bodyKey: "guide.steps.myShoes.s3.body",
        placement: "center",
      },
    ],
  },
  rewards: {
    id: "rewards",
    titleKey: "guide.topics.rewards.title",
    descriptionKey: "guide.topics.rewards.desc",
    icon: "star-outline",
    featureFlag: "rewards",
    steps: [
      {
        titleKey: "guide.steps.rewards.s1.title",
        bodyKey: "guide.steps.rewards.s1.body",
        anchorId: ANCHORS.profile.rewards,
        route: "/(tabs)/profile",
      },
      {
        titleKey: "guide.steps.rewards.s2.title",
        bodyKey: "guide.steps.rewards.s2.body",
        anchorId: ANCHORS.rewards.pointsCard,
        route: "/(tabs)/profile/rewards",
      },
      {
        titleKey: "guide.steps.rewards.s3.title",
        bodyKey: "guide.steps.rewards.s3.body",
        anchorId: ANCHORS.rewards.stampCard,
      },
    ],
  },
  askForHelp: {
    id: "askForHelp",
    titleKey: "guide.topics.askForHelp.title",
    descriptionKey: "guide.topics.askForHelp.desc",
    icon: "chatbubble-ellipses-outline",
    featureFlag: "support_chat",
    steps: [
      {
        titleKey: "guide.steps.askForHelp.s1.title",
        bodyKey: "guide.steps.askForHelp.s1.body",
        anchorId: ANCHORS.profile.support,
        route: "/(tabs)/profile",
      },
      {
        titleKey: "guide.steps.askForHelp.s2.title",
        bodyKey: "guide.steps.askForHelp.s2.body",
        anchorId: ANCHORS.support.submit,
        route: "/(tabs)/profile/support",
      },
      {
        titleKey: "guide.steps.askForHelp.s3.title",
        bodyKey: "guide.steps.askForHelp.s3.body",
        placement: "center",
      },
    ],
  },
  /**
   * Automatic first-launch orientation (plan §5.4) — welcome → the tab-bar
   * map → the shopping bag → Shop → the "How to use this app" safety net
   * → done. Not a hub card (excluded from {@link HUB_TOPIC_ORDER}):
   * triggered once automatically by `app/(tabs)/index.tsx` after the home
   * arrival ceremony, and replayable any time via the hub's "Show the
   * welcome tour again" row. `GuideContext.exit()` recognizes this tour id
   * specifically to persist `markFirstGuideSeen()` on finish *or* skip, and
   * to return the user to Home when the tour finishes naturally (step 6's
   * "Got it").
   */
  firstLaunch: {
    id: "firstLaunch",
    titleKey: "guide.firstLaunch.hubTitle",
    descriptionKey: "guide.firstLaunch.hubDescription",
    icon: "sparkles-outline",
    steps: [
      {
        titleKey: "guide.firstLaunch.welcome.title",
        bodyKey: "guide.firstLaunch.welcome.body",
        placement: "center",
      },
      {
        titleKey: "guide.firstLaunch.tabs.title",
        bodyKey: "guide.firstLaunch.tabs.body",
        anchorId: ANCHORS.tabbar.home,
        dynamicBody: "firstLaunchTabs",
      },
      {
        titleKey: "guide.firstLaunch.bag.title",
        bodyKey: "guide.firstLaunch.bag.body",
        anchorId: ANCHORS.home.bag,
      },
      {
        titleKey: "guide.firstLaunch.shop.title",
        bodyKey: "guide.firstLaunch.shop.body",
        anchorId: ANCHORS.shop.grid,
        route: "/(tabs)/browse",
      },
      {
        titleKey: "guide.firstLaunch.safetyNet.title",
        bodyKey: "guide.firstLaunch.safetyNet.body",
        anchorId: ANCHORS.profile.guideEntry,
        route: "/(tabs)/profile",
      },
      {
        titleKey: "guide.firstLaunch.done.title",
        bodyKey: "guide.firstLaunch.done.body",
        placement: "center",
      },
    ],
  },
};

/**
 * Display order of hub topic cards on `app/(tabs)/profile/guide.tsx`,
 * matching plan §5.4's table top-to-bottom. Kept separate from object key
 * order in {@link TOURS} so the hub's layout never silently depends on
 * insertion order.
 */
export const HUB_TOPIC_ORDER: readonly string[] = [
  "findShoes",
  "chooseSizeAddToBag",
  "payCheckout",
  "seeMyOrders",
  "saveFavourites",
  "changeLanguage",
  "myShoes",
  "rewards",
  "askForHelp",
];
