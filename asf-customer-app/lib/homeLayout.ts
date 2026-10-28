/**
 * Shared Home layout primitives for Classic + Noir (tidy Frame model).
 *
 * **Round 4 — cover + editorial body (current Home IA):**
 * - Frame 1 = **tall cover** ≈ full first viewport below the in-flow bar
 *   (search + bag, no wordmark). Size with {@link getHomeUsableHeight} →
 *   {@link frame1CoverMediaHeight}(usable, commerceChrome). Do **not** use
 *   {@link getHomeAboveFoldBudget} to reserve promo + product row inside Frame 1.
 * - Below fold = long vertical body: stacked promo banners → **2-column**
 *   product grid ({@link getHomeGridMetrics}) → journal (lead + 2-up) →
 *   category chips. Prefer vertical scroll length over horizontal snap pages.
 * - Keep Round 2 tidy: no peek, no Home wordmark, fixed promo banner height,
 *   Home≠Shop product cap (~{@link HOME_PRODUCT_GRID_CAP}).
 *
 * **Round 2 tidy grammar (keep)** — no half-card peek; fixed-height promo
 * banners ({@link HOME_PROMO_BANNER_HEIGHT}); no Home wordmark. Snap helpers
 * ({@link getHomeSnapMetrics}, {@link HOME_SNAP_CARDS_PER_PAGE}) remain for
 * rare non-Home or legacy paged use — **not** primary for Home products/posts.
 *
 * **Round 3 above-fold packing (deprecated for Home cover)** — short Frame 1
 * via {@link getHomeAboveFoldBudget} / {@link frame1HeightBudget} so promo +
 * first 2-up product page fit onload. That killed the focal point and kept
 * vertical scroll short. Helpers stay exported for history / non-Home callers;
 * Round 4 Home must not re-apply them as the Frame 1 driver.
 *
 * **Usable height** = window − top safe inset − bottom safe inset − tab bar row
 * (− in-flow header when the theme uses one).
 *
 * **Agent 2 (Classic) / Agent 3 (Noir) Round 4 wiring:**
 * ```
 * const usable = getHomeUsableHeight({ ... inFlowHeader ... });
 * const mediaHeight = frame1CoverMediaHeight(usable, commerceChrome);
 * const grid = getHomeGridMetrics({
 *   windowWidth,
 *   horizontalPadding: 16,
 *   gap: HOME_SPACE.sm,
 *   columns: HOME_GRID_COLUMNS,
 * });
 * ```
 */

/**
 * Tab bar **row** height (icons + label), excluding safe-area bottom padding.
 *
 * Source: `classicTabBar.minHeight` / `noirTabBar.minHeight` (both `60`) and
 * `DEFAULT_TAB_BAR_ROW_HEIGHT` in `app/(tabs)/_layout.tsx`. Total on-screen
 * tab bar height is `HOME_TAB_BAR_ROW_HEIGHT + bottomInset` (see
 * {@link getHomeTabBarTotalHeight}).
 */
export const HOME_TAB_BAR_ROW_HEIGHT = 60;

/**
 * Noir in-flow solid top bar row height (search + bag; no wordmark), excluding
 * the top safe-area inset from `SafeAreaView edges={["top"]}`.
 *
 * Source: `themes/noir/screens/Home.tsx` — inner `View` `height: 48`.
 */
export const HOME_NOIR_INFLOW_HEADER_ROW_HEIGHT = 48;

/**
 * Classic Home top-bar row height (search + bag), excluding the top safe-area
 * inset. **Round 2:** Classic uses an in-flow (push-down) bar — pass this as
 * `inFlowHeaderHeight` to {@link getHomeUsableHeight}. Do **not** also add it
 * to Frame 1 `chromeBudget` (commerce + optional promo cue only).
 *
 * Source: `themes/classic/screens/Home.tsx` — navbar inner `View` `height: 56`.
 * Name retained for continuity with Round 1 token exports.
 */
export const HOME_CLASSIC_OVERLAY_NAV_ROW_HEIGHT = 56;

/**
 * Vertical rhythm for Home sections and card gaps.
 *
 * - `xs` — tight inner padding / chip gaps
 * - `sm` — gap between equal cards in a **2-col grid** or legacy snap page
 * - `md` — mid section breathing / preferred section tops between major bands
 *   (cover → offers → products → posts → categories). Prefer `md` over stacked
 *   `lg` deserts so the scroll reads as an edit, not empty mall.
 * - `lg` — reserved for rare large breaks only (not default section spacing)
 *
 * Themes must not invent ad-hoc gaps; use these tokens only.
 */
export const HOME_SPACE = {
  xs: 8,
  sm: 12,
  md: 20,
  lg: 28,
} as const;

/** Keys of {@link HOME_SPACE}. */
export type HomeSpaceToken = keyof typeof HOME_SPACE;

/**
 * Aspect ratios (`width / height`) for Home media slots.
 * Use with RN `aspectRatio` (or derive height from width). Keep one aspect
 * per section so cards stay equal.
 *
 * **Round 2:** `postCard` matches `productCard` so product and post tiles share
 * identical geometry on Home. Prefer `HOME_ASPECT.productCard` for both rows
 * when wiring Classic/Noir; `postCard` remains as an alias for clarity.
 */
export const HOME_ASPECT = {
  /** Frame 1 primary product media box. */
  frame1: 3 / 4,
  /** New-product / curated stream cards. */
  productCard: 3 / 4,
  /**
   * Latest-posts cards — Round 2 forces the same aspect as {@link HOME_ASPECT.productCard}
   * (products === posts tile geometry; no 4:5 mini strip).
   */
  postCard: 3 / 4,
  /**
   * Legacy offer-card aspect for non-Home callers of `HomeOffersStrip`.
   * Round 2 Home uses {@link HOME_PROMO_BANNER_HEIGHT} banners instead.
   */
  offerCard: 5 / 4,
} as const;

/**
 * Product / post snap pages show this many full equal cards (no fractional peek).
 * Recommended Round 2 page size — shoppable while staying tidy.
 *
 * **Round 4 Home:** prefer {@link HOME_GRID_COLUMNS} vertical grids over snap
 * pages for products/posts. Snap page size remains for rare paged use only.
 */
export const HOME_SNAP_CARDS_PER_PAGE = 2;

/**
 * Default column count for Round 4 Home product / post grids.
 */
export const HOME_GRID_COLUMNS = 2;

/**
 * Recommended Home product-grid item cap (Home≠Shop — not a full catalog dump).
 * Themes should clamp curated arrivals to roughly 10–14; this mid-band default
 * is the shared target for Classic + Noir parity.
 */
export const HOME_PRODUCT_GRID_CAP = 12;

/**
 * Fixed height (px) for full-width Home promo banners.
 *
 * Chosen to fit title (up to 2 lines) + discount + optional code inside one
 * identical box across Classic/Noir, without variable-height text cards.
 * Themes skin color/type; height stays shared so banners never unequal.
 *
 * Round 4: stack banners vertically with {@link HOME_SPACE.md} gaps (prefer
 * `HomePromoBannerStack`). Pass `0` into legacy above-fold helpers only when
 * those helpers are still used outside Round 4 Home cover sizing.
 */
export const HOME_PROMO_BANNER_HEIGHT = 120;

/**
 * @deprecated Round 3 Home cover packing — do **not** use for Round 4 Frame 1.
 * Prefer {@link frame1CoverMediaHeight} so the cover spans ~full usable height.
 *
 * Round 3 default: Frame 1 block (hero media + commerce plate) as a share of
 * {@link getHomeUsableHeight}. Target band ~42–52% usable so promo + first
 * 2-up product page could fit onload (this killed the focal point).
 */
export const HOME_FRAME1_USABLE_FRACTION = 0.48;

/**
 * @deprecated Round 3 Home cover packing — do **not** use for Round 4 Frame 1.
 * Floor Frame 1 share of usable height on short phones when the preferred
 * fraction overflowed the above-fold composition.
 */
export const HOME_FRAME1_USABLE_FRACTION_MIN = 0.38;

/**
 * Default estimate (px) for a {@link HomeSnapSection} title row used in
 * above-fold product-row math when themes do not pass a measured height.
 *
 * Matches typical Classic title (~24px line) + header `marginBottom`
 * {@link HOME_SPACE.md}. Themes with larger titles / optional editorial
 * sublines should pass an explicit `sectionHeaderHeight` to
 * {@link estimateHomeProductRowHeight}.
 */
export const HOME_PRODUCT_SECTION_HEADER_ESTIMATE =
  24 + HOME_SPACE.md;

/**
 * Inputs for {@link getHomeSnapMetrics}.
 */
export type GetHomeSnapMetricsParams = {
  /** `Dimensions.get("window").width` (or equivalent). */
  windowWidth: number;
  /**
   * Horizontal inset applied on each side of the snap content
   * (typically section `paddingHorizontal`, e.g. `16`).
   */
  horizontalPadding: number;
  /** Gap between equal cards within a page (use {@link HOME_SPACE.sm}). */
  gap: number;
  /**
   * Whole cards visible per snap page.
   * Defaults to {@link HOME_SNAP_CARDS_PER_PAGE}.
   */
  cardsPerPage?: number;
};

/**
 * Snap page geometry for product/post horizontal rows.
 *
 * Invariant: `cardsPerPage * cardWidth + (cardsPerPage - 1) * gap` equals
 * `pageWidth` and fits inside the padded content width with **no fractional
 * card**. Leftover sub-pixel / floor remainder stays as unused trailing gutter
 * inside the content box — never as a peek of the next card.
 *
 * **ScrollView wiring:** each child page should be a full-bleed shell
 * (`width: snapToInterval` === `windowWidth`) with `paddingHorizontal` inside,
 * then a row of `cardsPerPage` cards at `cardWidth` with `gap`. Do **not** put
 * horizontal padding on the ScrollView `contentContainerStyle` — that skews
 * snap offsets and can look like a peek.
 */
export type HomeSnapMetrics = {
  /** Echo of the window width used for the full-bleed page shell. */
  windowWidth: number;
  /** Usable width inside horizontal padding. */
  contentWidth: number;
  /** Horizontal padding echoed from params (apply inside each page shell). */
  horizontalPadding: number;
  /** Width of one equal card (integer px). */
  cardWidth: number;
  /**
   * Inner row width (`cards + gaps`). May be ≤ `contentWidth` after floor;
   * unused px stay as trailing gutter inside the padded shell — not a peek.
   */
  pageWidth: number;
  /**
   * Pass to `ScrollView` `snapToInterval` / page shell `width`.
   * Equals `windowWidth` so pages are full-bleed and snap without peek.
   */
  snapToInterval: number;
  /** Gap echoed from params (apply between cards inside a page). */
  gap: number;
  /** Whole cards per page after clamping. */
  cardsPerPage: number;
};

/**
 * Inputs for {@link getHomeChipPageMetrics}.
 */
export type GetHomeChipPageMetricsParams = {
  /** `Dimensions.get("window").width` (or equivalent). */
  windowWidth: number;
  /** Horizontal inset on each side of the chip row. */
  horizontalPadding: number;
  /** Fixed width of one equal chip (integer px). */
  chipWidth: number;
  /** Gap between chips (use {@link HOME_SPACE.xs}). */
  gap: number;
  /**
   * Optional hard cap on chips per page. When omitted, fits as many whole
   * chips as possible without clipping.
   */
  maxChipsPerPage?: number;
};

/**
 * Chip-slider page geometry so category chips are never mid-glyph clipped.
 *
 * Same full-bleed shell rule as {@link HomeSnapMetrics}: page shell width is
 * `windowWidth`; apply `horizontalPadding` inside each page, not on the
 * ScrollView content container.
 */
export type HomeChipPageMetrics = {
  /** Echo of the window width used for the full-bleed page shell. */
  windowWidth: number;
  /** Usable width inside horizontal padding. */
  contentWidth: number;
  /** Horizontal padding echoed from params. */
  horizontalPadding: number;
  /** Whole chips that fit on one snap page (≥ 1 when chipWidth is valid). */
  chipsPerPage: number;
  /** Inner row width (chips + gaps). */
  pageWidth: number;
  /** Pass to `ScrollView` `snapToInterval` (equals `windowWidth`). */
  snapToInterval: number;
  /** Echo of the chip width used for the fit. */
  chipWidth: number;
  /** Gap echoed from params. */
  gap: number;
};

/** Keys of {@link HOME_ASPECT}. */
export type HomeAspectToken = keyof typeof HOME_ASPECT;

/**
 * Inputs for {@link getHomeUsableHeight}.
 */
export type GetHomeUsableHeightParams = {
  /** `Dimensions.get("window").height` (or equivalent). */
  windowHeight: number;
  /** Top safe-area inset (status bar / notch). */
  topInset: number;
  /** Bottom safe-area inset (home indicator). */
  bottomInset: number;
  /**
   * In-flow header height below the top inset (Classic + Noir push-down bars).
   * Pass {@link HOME_CLASSIC_OVERLAY_NAV_ROW_HEIGHT} or
   * {@link HOME_NOIR_INFLOW_HEADER_ROW_HEIGHT}. Omit or `0` only when the theme
   * has no in-flow top chrome (rare after Round 2).
   */
  inFlowHeaderHeight?: number;
  /**
   * Tab bar row height excluding bottom inset.
   * Defaults to {@link HOME_TAB_BAR_ROW_HEIGHT}.
   */
  tabBarRowHeight?: number;
};

/**
 * Total tab bar height as laid out in `app/(tabs)/_layout.tsx`
 * (`minHeight: tabBarRowHeight + insets.bottom`).
 *
 * @param bottomInset - Safe-area bottom inset from `useSafeAreaInsets()`.
 * @param tabBarRowHeight - Optional override; defaults to {@link HOME_TAB_BAR_ROW_HEIGHT}.
 * @returns Integer px for the full tab bar chrome.
 */
export function getHomeTabBarTotalHeight(
  bottomInset: number,
  tabBarRowHeight: number = HOME_TAB_BAR_ROW_HEIGHT
): number {
  const safeBottom = Number.isFinite(bottomInset) ? Math.max(0, bottomInset) : 0;
  const row =
    Number.isFinite(tabBarRowHeight) && tabBarRowHeight > 0
      ? tabBarRowHeight
      : HOME_TAB_BAR_ROW_HEIGHT;
  return Math.round(row + safeBottom);
}

/**
 * Usable Home content height for strict Frame sizing.
 *
 * Subtracts top inset, bottom inset, tab bar row, and optional in-flow header.
 * (Bottom inset + tab bar row together match the tabs shell total height.)
 *
 * @param params - Window height and chrome measurements.
 * @returns Integer usable px (≥ 0).
 */
export function getHomeUsableHeight(params: GetHomeUsableHeightParams): number {
  const windowHeight = Number.isFinite(params.windowHeight)
    ? Math.max(0, params.windowHeight)
    : 0;
  const topInset = Number.isFinite(params.topInset)
    ? Math.max(0, params.topInset)
    : 0;
  const bottomInset = Number.isFinite(params.bottomInset)
    ? Math.max(0, params.bottomInset)
    : 0;
  const inFlowHeaderHeight =
    typeof params.inFlowHeaderHeight === "number" &&
    Number.isFinite(params.inFlowHeaderHeight)
      ? Math.max(0, params.inFlowHeaderHeight)
      : 0;
  const tabBarRowHeight =
    typeof params.tabBarRowHeight === "number" &&
    Number.isFinite(params.tabBarRowHeight) &&
    params.tabBarRowHeight > 0
      ? params.tabBarRowHeight
      : HOME_TAB_BAR_ROW_HEIGHT;

  return Math.max(
    0,
    Math.round(
      windowHeight -
        topInset -
        bottomInset -
        tabBarRowHeight -
        inFlowHeaderHeight
    )
  );
}

/**
 * Optional breathing room (px) subtracted from usable height for Round 4 cover.
 * Default `0` = cover fills the full usable first viewport. Themes may pass a
 * small value (e.g. {@link HOME_SPACE.xs}) if they want a hair of air below
 * the commerce plate before the editorial body — do **not** use this to
 * recreate Round 3 promo/product packing inside Frame 1.
 */
export const HOME_COVER_BREATHING_DEFAULT = 0;

/**
 * Round 4 Frame 1 **cover block** height (hero media + commerce plate).
 *
 * Targets ~full usable height below the in-flow header so Home opens on a
 * strong focal cover — not a Round 3 fraction-squashed strip.
 *
 * **Round 4 Home must NOT use {@link getHomeAboveFoldBudget} to reserve promo
 * + product row inside Frame 1.** Promos and product grids live below the fold.
 *
 * @param usableHeight - From {@link getHomeUsableHeight}.
 * @param breathingPx - Optional px subtracted from usable (default
 *   {@link HOME_COVER_BREATHING_DEFAULT} = 0 for a full-usable cover).
 * @returns Integer cover block height (≥ 0).
 */
export function frame1CoverHeight(
  usableHeight: number,
  breathingPx: number = HOME_COVER_BREATHING_DEFAULT
): number {
  const usable =
    Number.isFinite(usableHeight) ? Math.max(0, usableHeight) : 0;
  const breath =
    Number.isFinite(breathingPx) ? Math.max(0, breathingPx) : 0;
  return Math.max(0, Math.round(usable - breath));
}

/**
 * Round 4 Frame 1 **hero media** height inside a full-usable cover.
 *
 * ```
 * mediaHeight = frame1CoverHeight(usableHeight, breathingPx) − commerceChrome
 *             ≈ usableHeight − commerceChrome  (when breathing is 0)
 * ```
 *
 * Pass the same `commerceChrome` themes already reserve for name / price /
 * CTA / optional thin promo cue (Classic push-down plate or Noir overlay plate
 * that still sits **inside** the cover height).
 *
 * **Do not** feed {@link getHomeAboveFoldBudget}.`frame1Budget` into
 * {@link frame1HeroHeight} for Round 4 Home — that re-applies R3 packing.
 * Prefer this helper (or `frame1HeroHeight(frame1CoverHeight(usable), chrome)`).
 *
 * @param usableHeight - From {@link getHomeUsableHeight}.
 * @param commerceChrome - Non-media Frame 1 commerce chrome in px (≥ 0).
 * @param breathingPx - Optional cover breathing; defaults to
 *   {@link HOME_COVER_BREATHING_DEFAULT}.
 * @returns Integer hero media height (≥ 0).
 */
export function frame1CoverMediaHeight(
  usableHeight: number,
  commerceChrome: number,
  breathingPx: number = HOME_COVER_BREATHING_DEFAULT
): number {
  const cover = frame1CoverHeight(usableHeight, breathingPx);
  const chrome =
    Number.isFinite(commerceChrome) ? Math.max(0, commerceChrome) : 0;
  return Math.max(0, Math.round(cover - chrome));
}

/**
 * Inputs for {@link getHomeGridMetrics}.
 */
export type GetHomeGridMetricsParams = {
  /** `Dimensions.get("window").width` (or equivalent). */
  windowWidth: number;
  /**
   * Horizontal inset on each side of the grid
   * (typically section `paddingHorizontal`, e.g. `16`).
   */
  horizontalPadding: number;
  /** Gap between equal cards (use {@link HOME_SPACE.sm}). */
  gap: number;
  /**
   * Column count. Defaults to {@link HOME_GRID_COLUMNS} (2).
   * Clamped to ≥ 1.
   */
  columns?: number;
};

/**
 * Vertical 2-column (or N-column) grid geometry for Round 4 Home body.
 *
 * Invariant: `columns * cardWidth + (columns - 1) * gap ≤ contentWidth`,
 * with leftover sub-pixel / floor remainder as unused trailing gutter —
 * never a peek of a next column.
 */
export type HomeGridMetrics = {
  /** Echo of the window width. */
  windowWidth: number;
  /** Usable width inside horizontal padding. */
  contentWidth: number;
  /** Horizontal padding echoed from params. */
  horizontalPadding: number;
  /** Width of one equal card (integer px). */
  cardWidth: number;
  /** Gap echoed from params (apply between cards and between rows). */
  gap: number;
  /** Column count after clamping. */
  columns: number;
};

/**
 * Computes equal-card widths for a vertical Home product / post grid.
 *
 * Round 4 primary geometry for Home “The edit” and journal 2-up rows.
 * Prefer this over {@link getHomeSnapMetrics} when cards scroll with the page
 * instead of paging horizontally.
 *
 * @param params - Window width, padding, gap, and column count.
 * @returns Integer `cardWidth`, `contentWidth`, echoed gap/columns.
 */
export function getHomeGridMetrics(
  params: GetHomeGridMetricsParams
): HomeGridMetrics {
  const windowWidth = Number.isFinite(params.windowWidth)
    ? Math.max(0, params.windowWidth)
    : 0;
  const horizontalPadding = Number.isFinite(params.horizontalPadding)
    ? Math.max(0, params.horizontalPadding)
    : 0;
  const gap = Number.isFinite(params.gap) ? Math.max(0, params.gap) : 0;
  const rawColumns =
    typeof params.columns === "number" && Number.isFinite(params.columns)
      ? Math.floor(params.columns)
      : HOME_GRID_COLUMNS;
  const columns = Math.max(1, rawColumns);

  const roundedWindow = Math.round(windowWidth);
  const contentWidth = Math.max(
    0,
    Math.round(roundedWindow - horizontalPadding * 2)
  );
  const totalGap = gap * (columns - 1);
  const widthForCards = Math.max(0, contentWidth - totalGap);
  const cardWidth = Math.max(0, Math.floor(widthForCards / columns));

  return {
    windowWidth: roundedWindow,
    contentWidth,
    horizontalPadding,
    cardWidth,
    gap,
    columns,
  };
}

/**
 * Chunks items into grid rows of `columns` (last row may be shorter).
 *
 * @param items - Flat list of section items.
 * @param columns - Columns per row (defaults to {@link HOME_GRID_COLUMNS}).
 * @returns Array of row arrays.
 */
export function chunkHomeGridRows<T>(
  items: readonly T[],
  columns: number = HOME_GRID_COLUMNS
): T[][] {
  const perRow =
    Number.isFinite(columns) && columns > 0
      ? Math.floor(columns)
      : HOME_GRID_COLUMNS;
  if (items.length === 0) {
    return [];
  }
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += perRow) {
    rows.push(items.slice(index, index + perRow));
  }
  return rows;
}

/**
 * Frame 1 hero / drop **media** height that fits inside a Frame 1 block budget
 * after reserving commerce chrome (name, price, CTA, optional thin promo cue).
 *
 * **Round 4 Home cover:** prefer {@link frame1CoverMediaHeight}(usable, chrome)
 * so media = full usable − commerce. Passing full usable into this helper as
 * `frame1Budget` is valid when the budget itself is a Round 4 cover height
 * from {@link frame1CoverHeight}.
 *
 * @deprecated For Round 4 Home, do **not** pair this with
 * {@link getHomeAboveFoldBudget} / {@link frame1HeightBudget} to pack promo +
 * products into Frame 1. That Round 3 pattern is deprecated for Home cover.
 *
 * Round 3 wiring (legacy):
 * 1. `usable = getHomeUsableHeight(...)`
 * 2. `frame1Budget = getHomeAboveFoldBudget(...).frame1Budget`
 * 3. `heroHeight = frame1HeroHeight(frame1Budget, commerceChromeBudget)`
 *
 * @param frame1Budget - Max px for the whole Frame 1 block.
 * @param chromeBudget - Non-media Frame 1 commerce chrome in px (≥ 0).
 * @returns Integer hero media height (≥ 0).
 */
export function frame1HeroHeight(
  frame1Budget: number,
  chromeBudget: number
): number {
  const budget =
    Number.isFinite(frame1Budget) ? Math.max(0, frame1Budget) : 0;
  const chrome =
    Number.isFinite(chromeBudget) ? Math.max(0, chromeBudget) : 0;
  return Math.max(0, Math.round(budget - chrome));
}

/**
 * Clamps a Frame 1 usable-height fraction into the Round 3 band
 * [{@link HOME_FRAME1_USABLE_FRACTION_MIN}, ~0.52] with a soft upper cap so
 * callers cannot accidentally restore full-usable Frame 1.
 *
 * @deprecated Round 3 Home cover packing — Round 4 Home uses
 * {@link frame1CoverHeight} / {@link frame1CoverMediaHeight} instead.
 *
 * @param fraction - Requested share of usable height.
 * @returns Finite fraction in `[MIN, 0.52]` (defaults to
 *   {@link HOME_FRAME1_USABLE_FRACTION} when invalid).
 */
export function clampHomeFrame1Fraction(fraction: number): number {
  const fallback = HOME_FRAME1_USABLE_FRACTION;
  if (!Number.isFinite(fraction) || fraction <= 0) {
    return fallback;
  }
  const upper = 0.52;
  return Math.min(upper, Math.max(HOME_FRAME1_USABLE_FRACTION_MIN, fraction));
}

/**
 * Max px for the entire Frame 1 block (hero media + commerce plate).
 *
 * @deprecated Round 3 fraction budget — Round 4 Home must use
 * {@link frame1CoverHeight} (≈ full usable), not this fraction cap.
 *
 * Round 3: ~{@link HOME_FRAME1_USABLE_FRACTION} of usable by default — not
 * 100%. Derive media with {@link frame1HeroHeight}:
 * `hero = frame1HeightBudget(usable, fraction) − commerceChrome`.
 *
 * @param usableHeight - From {@link getHomeUsableHeight}.
 * @param fraction - Share of usable; defaults to {@link HOME_FRAME1_USABLE_FRACTION}.
 *   Clamped via {@link clampHomeFrame1Fraction}.
 * @returns Integer Frame 1 block budget (≥ 0).
 */
export function frame1HeightBudget(
  usableHeight: number,
  fraction: number = HOME_FRAME1_USABLE_FRACTION
): number {
  const usable =
    Number.isFinite(usableHeight) ? Math.max(0, usableHeight) : 0;
  const safeFraction = clampHomeFrame1Fraction(fraction);
  return Math.max(0, Math.round(usable * safeFraction));
}

/**
 * Hero media height from usable height + fraction + commerce chrome in one step.
 *
 * Equivalent to:
 * `frame1HeroHeight(frame1HeightBudget(usableHeight, fraction), chromeBudget)`.
 *
 * @deprecated Round 3 Home cover packing — Round 4 Home should call
 * {@link frame1CoverMediaHeight}(usableHeight, chromeBudget) instead.
 *
 * @param usableHeight - From {@link getHomeUsableHeight}.
 * @param chromeBudget - Non-media Frame 1 commerce chrome in px.
 * @param fraction - Optional Frame 1 share; defaults to
 *   {@link HOME_FRAME1_USABLE_FRACTION}.
 * @returns Integer hero media height (≥ 0).
 */
export function frame1HeroHeightFromFraction(
  usableHeight: number,
  chromeBudget: number,
  fraction: number = HOME_FRAME1_USABLE_FRACTION
): number {
  return frame1HeroHeight(
    frame1HeightBudget(usableHeight, fraction),
    chromeBudget
  );
}

/**
 * Inputs for {@link estimateHomeProductRowHeight}.
 */
export type EstimateHomeProductRowHeightParams = {
  /**
   * Equal card width from {@link getHomeSnapMetrics} (`cardWidth`).
   * Height follows {@link HOME_ASPECT.productCard}.
   */
  cardWidth: number;
  /**
   * Section title row + header bottom margin (and optional editorial subline).
   * Defaults to {@link HOME_PRODUCT_SECTION_HEADER_ESTIMATE}.
   */
  sectionHeaderHeight?: number;
};

/**
 * Estimates the first product snap page height for above-fold budgeting.
 *
 * @deprecated Round 3 above-fold packing helper. Round 4 Home places the
 * product grid **below the fold** — do not reserve this inside Frame 1.
 *
 * **Formula (legacy):**
 * ```
 * cardHeight = cardWidth / HOME_ASPECT.productCard
 * productRowEstimate = sectionHeaderHeight + cardHeight
 * ```
 *
 * @param params - Snap card width and optional measured header height.
 * @returns Integer px estimate (≥ 0).
 */
export function estimateHomeProductRowHeight(
  params: EstimateHomeProductRowHeightParams
): number {
  const cardWidth =
    Number.isFinite(params.cardWidth) ? Math.max(0, params.cardWidth) : 0;
  const aspect = HOME_ASPECT.productCard;
  const cardHeight =
    aspect > 0 ? Math.round(cardWidth / aspect) : 0;
  const header =
    typeof params.sectionHeaderHeight === "number" &&
    Number.isFinite(params.sectionHeaderHeight)
      ? Math.max(0, Math.round(params.sectionHeaderHeight))
      : HOME_PRODUCT_SECTION_HEADER_ESTIMATE;
  return Math.max(0, header + cardHeight);
}

/**
 * Inputs for {@link getHomeAboveFoldBudget}.
 *
 * Onload composition (strict, no cutoff):
 * Frame 1 block + optional promo banner + first product snap page, with
 * {@link HOME_SPACE.md} gaps between bands (Round 3 denser section tops).
 */
export type GetHomeAboveFoldBudgetParams = {
  /** From {@link getHomeUsableHeight}. */
  usableHeight: number;
  /**
   * Preferred Frame 1 share of usable. Defaults to
   * {@link HOME_FRAME1_USABLE_FRACTION}; clamped by
   * {@link clampHomeFrame1Fraction}.
   */
  frame1Fraction?: number;
  /**
   * Promo band height — use {@link HOME_PROMO_BANNER_HEIGHT} when active
   * promos + flag, otherwise `0`.
   */
  promoBannerHeight: number;
  /**
   * First product snap page height including section title row.
   * Prefer {@link estimateHomeProductRowHeight} with
   * `getHomeSnapMetrics(...).cardWidth`.
   */
  productRowEstimate: number;
  /**
   * Vertical gap between major above-fold bands (Frame 1 → promo → products).
   * Defaults to {@link HOME_SPACE.md} (Round 3 preferred section top).
   */
  sectionGap?: number;
};

/**
 * Above-fold budget result for Classic/Noir Frame 1 wiring.
 */
export type HomeAboveFoldBudget = {
  /** Echo of usable height. */
  usableHeight: number;
  /** Preferred fraction after clamp. */
  frame1Fraction: number;
  /** Frame 1 budget from preferred fraction alone (before shrink-to-fit). */
  preferredFrame1Budget: number;
  /** Promo band reserved (`0` when absent). */
  promoBannerHeight: number;
  /** Product row estimate echoed. */
  productRowEstimate: number;
  /**
   * Total section gaps reserved between Frame 1 and the product row
   * (one gap if no promo; two if promo present).
   */
  sectionGapsTotal: number;
  /** Height reserved below Frame 1 (promo + products + gaps). */
  reservedBelowFrame1: number;
  /** Whether preferred Frame 1 + reserved bands fit in usable height. */
  fits: boolean;
  /**
   * Frame 1 block budget to use for layout: preferred when `fits`; otherwise
   * shrunk so promo + product row still fit. Floored by min fraction when
   * possible; may go below min only if usable is extremely short
   * (`overflowAtMin`).
   */
  frame1Budget: number;
  /**
   * True when even {@link HOME_FRAME1_USABLE_FRACTION_MIN} cannot leave room
   * for promo + products — themes should still honor `frame1Budget` (remaining
   * space) and must not peek or clip cards.
   */
  overflowAtMin: boolean;
};

/**
 * Reasons about Round 3 above-fold composition and returns a Frame 1 budget.
 *
 * Reserves promo (or 0) + first product snap page + section gaps
 * (`HOME_SPACE.md` by default), then checks whether the preferred Frame 1
 * fraction still fits. If not, shrinks Frame 1 toward
 * {@link HOME_FRAME1_USABLE_FRACTION_MIN} before dropping promo or products.
 *
 * @deprecated **Round 4 Home must not use this to reserve promo + product row
 * inside Frame 1.** That packing squashed the cover and kept vertical scroll
 * short. Use {@link frame1CoverMediaHeight} for a full-usable cover; put
 * stacked promos + {@link getHomeGridMetrics} grids in the below-fold body.
 *
 * Legacy Agent 2/3 Round 3 pattern (do not re-apply on Home):
 * ```
 * const above = getHomeAboveFoldBudget({ ... });
 * const heroHeight = frame1HeroHeight(above.frame1Budget, commerceChromeBudget);
 * ```
 *
 * @param params - Usable height, fraction, promo height, product row estimate.
 * @returns Fit flag, preferred vs suggested Frame 1 budgets, reserved bands.
 */
export function getHomeAboveFoldBudget(
  params: GetHomeAboveFoldBudgetParams
): HomeAboveFoldBudget {
  const usableHeight =
    Number.isFinite(params.usableHeight)
      ? Math.max(0, params.usableHeight)
      : 0;
  const frame1Fraction = clampHomeFrame1Fraction(
    typeof params.frame1Fraction === "number"
      ? params.frame1Fraction
      : HOME_FRAME1_USABLE_FRACTION
  );
  const promoBannerHeight =
    Number.isFinite(params.promoBannerHeight)
      ? Math.max(0, Math.round(params.promoBannerHeight))
      : 0;
  const productRowEstimate =
    Number.isFinite(params.productRowEstimate)
      ? Math.max(0, Math.round(params.productRowEstimate))
      : 0;
  const sectionGap =
    typeof params.sectionGap === "number" &&
    Number.isFinite(params.sectionGap)
      ? Math.max(0, Math.round(params.sectionGap))
      : HOME_SPACE.md;

  /** Frame 1 → products always; extra gap when promo sits between them. */
  const gapCount = promoBannerHeight > 0 ? 2 : 1;
  const sectionGapsTotal = sectionGap * gapCount;
  const reservedBelowFrame1 =
    promoBannerHeight + productRowEstimate + sectionGapsTotal;

  const preferredFrame1Budget = frame1HeightBudget(
    usableHeight,
    frame1Fraction
  );
  const remainingForFrame1 = Math.max(
    0,
    Math.round(usableHeight - reservedBelowFrame1)
  );
  const fits = preferredFrame1Budget <= remainingForFrame1;

  const minFrame1Budget = frame1HeightBudget(
    usableHeight,
    HOME_FRAME1_USABLE_FRACTION_MIN
  );
  let frame1Budget: number;
  let overflowAtMin: boolean;

  if (fits) {
    frame1Budget = preferredFrame1Budget;
    overflowAtMin = false;
  } else if (remainingForFrame1 >= minFrame1Budget) {
    frame1Budget = remainingForFrame1;
    overflowAtMin = false;
  } else {
    frame1Budget = remainingForFrame1;
    overflowAtMin = true;
  }

  return {
    usableHeight: Math.round(usableHeight),
    frame1Fraction,
    preferredFrame1Budget,
    promoBannerHeight,
    productRowEstimate,
    sectionGapsTotal,
    reservedBelowFrame1,
    fits,
    frame1Budget,
    overflowAtMin,
  };
}

/**
 * Computes no-peek snap metrics for product/post (or any equal-card) rows.
 *
 * Math: `cardsPerPage * cardWidth + (cardsPerPage - 1) * gap === pageWidth`,
 * and `pageWidth ≤ contentWidth` where
 * `contentWidth = windowWidth - 2 * horizontalPadding`.
 *
 * @param params - Window width, padding, gap, and cards per page.
 * @returns Integer card/page widths and `snapToInterval`.
 */
export function getHomeSnapMetrics(
  params: GetHomeSnapMetricsParams
): HomeSnapMetrics {
  const windowWidth = Number.isFinite(params.windowWidth)
    ? Math.max(0, params.windowWidth)
    : 0;
  const horizontalPadding = Number.isFinite(params.horizontalPadding)
    ? Math.max(0, params.horizontalPadding)
    : 0;
  const gap = Number.isFinite(params.gap) ? Math.max(0, params.gap) : 0;
  const rawCardsPerPage =
    typeof params.cardsPerPage === "number" &&
    Number.isFinite(params.cardsPerPage)
      ? Math.floor(params.cardsPerPage)
      : HOME_SNAP_CARDS_PER_PAGE;
  const cardsPerPage = Math.max(1, rawCardsPerPage);

  const roundedWindow = Math.round(windowWidth);
  const contentWidth = Math.max(
    0,
    Math.round(roundedWindow - horizontalPadding * 2)
  );
  const totalGap = gap * (cardsPerPage - 1);
  const widthForCards = Math.max(0, contentWidth - totalGap);
  const cardWidth = Math.max(0, Math.floor(widthForCards / cardsPerPage));
  const pageWidth = cardWidth * cardsPerPage + totalGap;

  return {
    windowWidth: roundedWindow,
    contentWidth,
    horizontalPadding,
    cardWidth,
    pageWidth,
    snapToInterval: roundedWindow,
    gap,
    cardsPerPage,
  };
}

/**
 * Page count for a snap row given item count and cards per page.
 *
 * @param itemCount - Total items in the section (≥ 0).
 * @param cardsPerPage - Whole cards per page (defaults to {@link HOME_SNAP_CARDS_PER_PAGE}).
 * @returns Integer pages (≥ 0; empty list → 0).
 */
export function getHomeSnapPageCount(
  itemCount: number,
  cardsPerPage: number = HOME_SNAP_CARDS_PER_PAGE
): number {
  const count =
    Number.isFinite(itemCount) ? Math.max(0, Math.floor(itemCount)) : 0;
  const perPage =
    Number.isFinite(cardsPerPage) && cardsPerPage > 0
      ? Math.floor(cardsPerPage)
      : HOME_SNAP_CARDS_PER_PAGE;
  if (count === 0) {
    return 0;
  }
  return Math.ceil(count / perPage);
}

/**
 * Chunks items into snap pages of `cardsPerPage` (last page may be shorter).
 *
 * @param items - Flat list of section items.
 * @param cardsPerPage - Whole cards per page (defaults to {@link HOME_SNAP_CARDS_PER_PAGE}).
 * @returns Array of page arrays.
 */
export function chunkHomeSnapPages<T>(
  items: readonly T[],
  cardsPerPage: number = HOME_SNAP_CARDS_PER_PAGE
): T[][] {
  const perPage =
    Number.isFinite(cardsPerPage) && cardsPerPage > 0
      ? Math.floor(cardsPerPage)
      : HOME_SNAP_CARDS_PER_PAGE;
  if (items.length === 0) {
    return [];
  }
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += perPage) {
    pages.push(items.slice(index, index + perPage));
  }
  return pages;
}

/**
 * Computes no-peek snap metrics for equal-width category chips.
 *
 * Fits as many whole chips as possible into the padded content width
 * (`chipWidth + gaps`), optionally capped by `maxChipsPerPage`. Never
 * returns a fractional chip width — callers must use a fixed `chipWidth`.
 *
 * @param params - Window width, padding, chip width, gap, optional cap.
 * @returns Chip page geometry for `snapToInterval` paging.
 */
export function getHomeChipPageMetrics(
  params: GetHomeChipPageMetricsParams
): HomeChipPageMetrics {
  const windowWidth = Number.isFinite(params.windowWidth)
    ? Math.max(0, params.windowWidth)
    : 0;
  const horizontalPadding = Number.isFinite(params.horizontalPadding)
    ? Math.max(0, params.horizontalPadding)
    : 0;
  const gap = Number.isFinite(params.gap) ? Math.max(0, params.gap) : 0;
  const chipWidth =
    Number.isFinite(params.chipWidth) && params.chipWidth > 0
      ? Math.floor(params.chipWidth)
      : 0;
  const roundedWindow = Math.round(windowWidth);
  const contentWidth = Math.max(
    0,
    Math.round(roundedWindow - horizontalPadding * 2)
  );

  let chipsPerPage = 1;
  if (chipWidth > 0 && contentWidth >= chipWidth) {
    chipsPerPage = Math.floor((contentWidth + gap) / (chipWidth + gap));
    chipsPerPage = Math.max(1, chipsPerPage);
  }

  if (
    typeof params.maxChipsPerPage === "number" &&
    Number.isFinite(params.maxChipsPerPage) &&
    params.maxChipsPerPage >= 1
  ) {
    chipsPerPage = Math.min(
      chipsPerPage,
      Math.floor(params.maxChipsPerPage)
    );
  }

  const pageWidth =
    chipWidth > 0
      ? chipWidth * chipsPerPage + gap * (chipsPerPage - 1)
      : contentWidth;

  return {
    windowWidth: roundedWindow,
    contentWidth,
    horizontalPadding,
    chipsPerPage,
    pageWidth,
    snapToInterval: roundedWindow,
    chipWidth,
    gap,
  };
}
