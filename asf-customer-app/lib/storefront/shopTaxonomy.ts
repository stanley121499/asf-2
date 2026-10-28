/**
 * Storefront Shop taxonomy helpers — occupation spine (plan §3.3).
 *
 * **Sidebar:** active occupation **ranges** only (no departments, no brands,
 * no flat dump of all categories). UI-filtered by
 * {@link SHOP_VISIBLE_OCCUPATION_KEYS} (currently nurse only); other
 * occupations remain in the catalog / DB.
 *
 * **Next-level tiles:** categories where `range_id = selectedOccupationId`
 * (same product-type labels under every occupation via `kind_key`).
 *
 * **Products:** in the selected occupation (`products.range_id`); when a
 * category tile is selected, also require that category via `category_id` ∪
 * `product_categories`. Search is AND-ed **within** that selection.
 *
 * **Shop tile grid:** only `kind_key === "shoes"` is shown; bags/accessories
 * stay in the catalog but are UI-hidden. The right pane pads to a fixed
 * 3-across × 2-row grid (`SHOP_CATEGORY_TILE_COLUMNS` ×
 * `SHOP_CATEGORY_TILE_ROWS`) with synthetic Coming Soon placeholders.
 *
 * **Coming soon (products):** when a visible category has zero eligible
 * products, {@link isComingSoonCategory} drives the product-area placeholder.
 *
 * Stable sort within each list: `created_at` ascending when both sides have a
 * non-empty timestamp, else `label` / `name` localeCompare, else `id`.
 */

/** Taxonomy kinds used by occupation sidebar / category tiles. */
export type StorefrontTaxonomyKind = "range" | "category";

/**
 * @deprecated Department / brand rows are no longer part of Storefront Shop IA.
 * Kept only so transitional call sites typecheck until Agent 03 rewires Shop.
 */
export type StorefrontLegacyTaxonomyKind =
  | StorefrontTaxonomyKind
  | "department"
  | "brand";

/**
 * One sidebar row (occupation) or next-level category tile.
 *
 * `label` is the canonical display name (caller may overlay translations).
 */
export type StorefrontSidebarItem = {
  kind: StorefrontTaxonomyKind;
  id: string;
  /** Display label (canonical name; UI may translate). */
  label: string;
  mediaUrl?: string | null;
  /** Present on category tiles when the category row carries `kind_key`. */
  kindKey?: string | null;
  /**
   * Synthetic non-navigating Coming Soon cell in the Shop 3-across tile grid.
   * Not a real taxonomy id — UI must ignore presses.
   */
  placeholder?: boolean;
};

/** Shop right-pane category tiles: columns (3-across) × rows. */
export const SHOP_CATEGORY_TILE_COLUMNS = 3;
export const SHOP_CATEGORY_TILE_ROWS = 2;
export const SHOP_CATEGORY_TILE_GRID_SLOTS =
  SHOP_CATEGORY_TILE_COLUMNS * SHOP_CATEGORY_TILE_ROWS;

/**
 * Product-type `kind_key` values shown as real tappable Shop tiles.
 * Bags / accessories remain in the catalog but are hidden from this grid.
 */
export const SHOP_VISIBLE_CATEGORY_KIND_KEYS: ReadonlySet<string> = new Set([
  "shoes",
]);

/**
 * Stable occupation keys for Shop left-rail filtering.
 * `ranges` has no DB slug/`kind_key` — keys are derived from canonical
 * seed names via {@link occupationKeyFromRangeName}.
 */
export type StorefrontOccupationKey =
  | "nurse"
  | "chef"
  | "electrician"
  | "security"
  | "doctor"
  | "teacher"
  | "waiter";

/**
 * Canonical range `name` (zh seed labels) → stable occupation key.
 * English aliases accepted so translated overlays still match if used as name.
 */
const OCCUPATION_KEY_BY_LABEL: Readonly<Record<string, StorefrontOccupationKey>> =
  {
    护士: "nurse",
    nurse: "nurse",
    厨师: "chef",
    chef: "chef",
    电工: "electrician",
    electrician: "electrician",
    保安: "security",
    security: "security",
    医生: "doctor",
    doctor: "doctor",
    教师: "teacher",
    teacher: "teacher",
    服务员: "waiter",
    waiter: "waiter",
  };

/**
 * Occupation keys shown in the Shop left rail.
 *
 * - Non-empty: only listed keys appear (currently nurse only).
 * - Empty set: show **all** active occupations (restore full rail).
 *
 * Does not delete or soft-delete ranges in the DB.
 */
export const SHOP_VISIBLE_OCCUPATION_KEYS: ReadonlySet<string> = new Set([
  "nurse",
]);

/**
 * Resolves a stable occupation key from a range display name.
 *
 * @param name - Canonical `ranges.name` (or known alias)
 * @returns Occupation key, or `null` when unrecognized
 */
export function occupationKeyFromRangeName(
  name: string | null | undefined
): StorefrontOccupationKey | null {
  if (typeof name !== "string") {
    return null;
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const direct = OCCUPATION_KEY_BY_LABEL[trimmed];
  if (direct !== undefined) {
    return direct;
  }
  const lower = trimmed.toLowerCase();
  const fromLower = OCCUPATION_KEY_BY_LABEL[lower];
  if (fromLower !== undefined) {
    return fromLower;
  }
  return null;
}

/**
 * True when an occupation should appear in the Shop left rail.
 * Empty {@link SHOP_VISIBLE_OCCUPATION_KEYS} → all occupations visible.
 */
export function isShopVisibleOccupation(
  name: string | null | undefined
): boolean {
  if (SHOP_VISIBLE_OCCUPATION_KEYS.size === 0) {
    return true;
  }
  const key = occupationKeyFromRangeName(name);
  if (key === null) {
    return false;
  }
  return SHOP_VISIBLE_OCCUPATION_KEYS.has(key);
}

/**
 * Occupation Shop selection: always an occupation range, optional category.
 */
export type StorefrontOccupationSelection = {
  /** Selected occupation (`ranges.id`). */
  occupationId: string;
  /**
   * Selected category under the occupation, or `null` for all products in
   * that occupation.
   */
  categoryId: string | null;
};

/**
 * @deprecated Prefer {@link StorefrontOccupationSelection}. Legacy single-entity
 * selection used by pre-occupation Shop (Agent 03 will migrate call sites).
 */
export type StorefrontShopSelection = {
  kind: StorefrontLegacyTaxonomyKind;
  id: string;
};

/** Minimal department row (unused by Storefront occupation sidebar). */
export type ShopDepartment = {
  id: string;
  name: string | null;
  media_url?: string | null;
  deleted_at?: string | null;
  created_at?: string;
};

/** Minimal range row — Storefront occupation. */
export type ShopRange = {
  id: string;
  name: string | null;
  department_id: string | null;
  media_url?: string | null;
  deleted_at?: string | null;
  created_at?: string;
};

/** Minimal category row (product type under an occupation). */
export type ShopCategory = {
  id: string;
  name: string;
  range_id: string | null;
  /** Shared product-type slug across occupations (`shoes` | `bags` | …). */
  kind_key?: string | null;
  media_url?: string | null;
  deleted_at?: string | null;
  created_at?: string;
};

/** Minimal brand row (unused by Storefront occupation IA). */
export type ShopBrand = {
  id: string;
  name: string | null;
  media_url?: string | null;
  deleted_at?: string | null;
  created_at?: string;
};

/** Product fields for Shop filtering. */
export type ShopProduct = {
  id: string;
  name: string;
  department_id: string | null;
  range_id: string | null;
  category_id: string | null;
  brand_id: string | null;
  deleted_at?: string | null;
  active?: boolean | null;
  status?: string | null;
  product_categories?: ReadonlyArray<{ category_id: string | null }>;
};

/**
 * Client-side page size for Shop product lazy load (`onEndReached`).
 * Catalogs smaller than this still exercise the end-reached path (no-op append).
 */
export const SHOP_PRODUCT_PAGE_SIZE = 20;

/**
 * Soft-delete guard for taxonomy entities.
 */
export function isShopTaxonomyActive(row: {
  deleted_at?: string | null;
}): boolean {
  if (row.deleted_at !== null && row.deleted_at !== undefined) {
    return row.deleted_at.length === 0;
  }
  return true;
}

/**
 * Stable sort: `created_at` asc when present, else `name` / `id`.
 */
function sortByCreatedThenName<
  T extends { id: string; name: string | null; created_at?: string },
>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    const aCreated = a.created_at;
    const bCreated = b.created_at;
    if (
      typeof aCreated === "string" &&
      aCreated.length > 0 &&
      typeof bCreated === "string" &&
      bCreated.length > 0
    ) {
      const cmp = aCreated.localeCompare(bCreated);
      if (cmp !== 0) {
        return cmp;
      }
    }
    const aName = a.name ?? "";
    const bName = b.name ?? "";
    const nameCmp = aName.localeCompare(bName);
    if (nameCmp !== 0) {
      return nameCmp;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Display label for a taxonomy row (empty string when name missing).
 */
function taxonomyDisplayLabel(name: string | null | undefined): string {
  if (typeof name === "string") {
    return name;
  }
  return "";
}

/**
 * Builds the Storefront Shop left rail: **occupation ranges only**.
 *
 * Filtered by {@link isShopVisibleOccupation} (nurse-only UI flag today).
 * Sort: `created_at` asc, then label, then id.
 *
 * @param ranges - Catalog ranges (occupations)
 */
export function buildOccupationSidebarItems(
  ranges: readonly ShopRange[]
): StorefrontSidebarItem[] {
  return sortByCreatedThenName(
    ranges.filter(
      (range) => isShopTaxonomyActive(range) && isShopVisibleOccupation(range.name)
    )
  ).map((range) => ({
    kind: "range" as const,
    id: range.id,
    label: taxonomyDisplayLabel(range.name),
    mediaUrl: range.media_url ?? null,
  }));
}

/**
 * @deprecated Use {@link buildOccupationSidebarItems}. Ignores departments,
 * categories, and brands — Storefront sidebar is occupations only.
 */
export function buildFlatShopSidebarItems(input: {
  departments: readonly ShopDepartment[];
  ranges: readonly ShopRange[];
  categories: readonly ShopCategory[];
  brands: readonly ShopBrand[];
}): StorefrontSidebarItem[] {
  void input.departments;
  void input.categories;
  void input.brands;
  return buildOccupationSidebarItems(input.ranges);
}

/**
 * Default occupation selection: first sidebar range, category cleared.
 *
 * @param sidebar - Occupation sidebar from {@link buildOccupationSidebarItems}
 */
export function defaultOccupationSelection(
  sidebar: readonly StorefrontSidebarItem[]
): StorefrontOccupationSelection | null {
  const first = sidebar.find((item) => item.kind === "range");
  if (first === undefined) {
    return null;
  }
  return { occupationId: first.id, categoryId: null };
}

/**
 * @deprecated Prefer {@link defaultOccupationSelection}. Returns first range
 * as a legacy `{ kind: "range", id }` selection.
 */
export function defaultShopSelection(
  sidebar: readonly StorefrontSidebarItem[]
): StorefrontShopSelection | null {
  const occupation = defaultOccupationSelection(sidebar);
  if (occupation === null) {
    return null;
  }
  return { kind: "range", id: occupation.occupationId };
}

/**
 * Category tiles for the selected occupation (`categories.range_id = id`).
 *
 * Empty / coming-soon categories are **included** — callers use
 * {@link isComingSoonCategory} for badge / product-area placeholder.
 *
 * Does **not** hide bags/accessories; prefer
 * {@link resolveOccupationCategoryTiles} for the Shop right pane.
 *
 * @param occupationId - Selected occupation range id
 * @param categories - Catalog categories
 */
export function listCategoriesForOccupation(
  occupationId: string,
  categories: readonly ShopCategory[]
): StorefrontSidebarItem[] {
  return sortByCreatedThenName(
    categories.filter(
      (c) => isShopTaxonomyActive(c) && c.range_id === occupationId
    )
  ).map((category) => ({
    kind: "category" as const,
    id: category.id,
    label: taxonomyDisplayLabel(category.name),
    mediaUrl: category.media_url ?? null,
    kindKey: category.kind_key ?? null,
  }));
}

/**
 * True when a category tile should appear as a real (tappable) Shop cell.
 * Currently only `kind_key === "shoes"`; bags / accessories are UI-hidden.
 */
export function isShopVisibleCategoryKind(
  kindKey: string | null | undefined
): boolean {
  if (typeof kindKey !== "string") {
    return false;
  }
  const normalized = kindKey.trim().toLowerCase();
  if (normalized.length === 0) {
    return false;
  }
  return SHOP_VISIBLE_CATEGORY_KIND_KEYS.has(normalized);
}

/**
 * Occupation categories that remain visible in the Shop tile grid (shoes only).
 */
export function listVisibleCategoriesForOccupation(
  occupationId: string,
  categories: readonly ShopCategory[]
): StorefrontSidebarItem[] {
  return listCategoriesForOccupation(occupationId, categories).filter((tile) =>
    isShopVisibleCategoryKind(tile.kindKey)
  );
}

/**
 * Pads visible category tiles to a fixed 3-across × 2-row grid with Coming Soon
 * placeholders (`SHOP_CATEGORY_TILE_GRID_SLOTS`).
 *
 * @param visibleTiles - Real tiles (typically shoes only)
 * @param occupationId - Used to stabilize synthetic placeholder ids
 */
export function padOccupationCategoryTileGrid(
  visibleTiles: readonly StorefrontSidebarItem[],
  occupationId: string
): StorefrontSidebarItem[] {
  const slots = visibleTiles.slice(0, SHOP_CATEGORY_TILE_GRID_SLOTS);
  const padded: StorefrontSidebarItem[] = [...slots];
  let index = 0;
  while (padded.length < SHOP_CATEGORY_TILE_GRID_SLOTS) {
    padded.push({
      kind: "category",
      id: `__coming_soon_${occupationId}_${index}`,
      label: "",
      mediaUrl: null,
      kindKey: null,
      placeholder: true,
    });
    index += 1;
  }
  return padded;
}

/**
 * Next-level taxonomy tiles for the right pane (occupation mode).
 *
 * - range → categories with `range_id = id`
 * - category → sibling categories under the same occupation (keeps tile row)
 * - department / brand → empty (retired from Storefront IA)
 */
export function resolveNextLevelTiles(
  selection: StorefrontShopSelection,
  input: {
    ranges: readonly ShopRange[];
    categories: readonly ShopCategory[];
    brands: readonly ShopBrand[];
    products: readonly ShopProduct[];
  }
): StorefrontSidebarItem[] {
  void input.ranges;
  void input.brands;
  void input.products;

  if (selection.kind === "range") {
    return listCategoriesForOccupation(selection.id, input.categories);
  }

  if (selection.kind === "category") {
    const selected = input.categories.find((c) => c.id === selection.id);
    if (selected === undefined || selected.range_id === null) {
      return [];
    }
    return listCategoriesForOccupation(selected.range_id, input.categories);
  }

  return [];
}

/**
 * Occupation-mode next-level tiles for the Shop right pane.
 *
 * Shows only shoes (hides bags / accessories in UI) and pads to a fixed
 * 3-across × 2-row grid with synthetic Coming Soon placeholders.
 *
 * @param occupationId - Selected occupation range id
 * @param categories - Catalog categories
 */
export function resolveOccupationCategoryTiles(
  occupationId: string,
  categories: readonly ShopCategory[]
): StorefrontSidebarItem[] {
  return padOccupationCategoryTileGrid(
    listVisibleCategoriesForOccupation(occupationId, categories),
    occupationId
  );
}

/**
 * True when product belongs to category via FK or `product_categories` junction.
 */
export function productInCategory(
  product: ShopProduct,
  categoryId: string
): boolean {
  if (product.category_id === categoryId) {
    return true;
  }
  const links = product.product_categories;
  if (links === undefined) {
    return false;
  }
  return links.some((row) => row.category_id === categoryId);
}

/**
 * Soft-delete / inactive / draft guard shared by Shop product filters.
 */
function isShopProductEligible(product: ShopProduct): boolean {
  if (product.deleted_at !== null && product.deleted_at !== undefined) {
    if (product.deleted_at.length > 0) {
      return false;
    }
  }
  if (product.active === false) {
    return false;
  }
  if (typeof product.status === "string" && product.status.length > 0) {
    const normalized = product.status.toLowerCase();
    if (
      normalized === "draft" ||
      normalized === "archived" ||
      normalized === "inactive"
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Product predicate for occupation + optional category (plan §3.3).
 *
 * @param product - Catalog product
 * @param occupationId - Selected occupation `ranges.id`
 * @param categoryId - Optional category under that occupation; `null` = all
 */
export function productMatchesOccupationSelection(
  product: ShopProduct,
  occupationId: string,
  categoryId: string | null
): boolean {
  if (!isShopProductEligible(product)) {
    return false;
  }
  if (product.range_id !== occupationId) {
    return false;
  }
  if (categoryId === null) {
    return true;
  }
  return productInCategory(product, categoryId);
}

/**
 * True when the occupation × category combo has **zero** eligible products
 * (Coming soon tile / product-area placeholder).
 *
 * @param occupationId - Occupation range id
 * @param categoryId - Category id under that occupation
 * @param products - Catalog products
 */
export function isComingSoonCategory(
  occupationId: string,
  categoryId: string,
  products: readonly ShopProduct[]
): boolean {
  return !products.some((product) =>
    productMatchesOccupationSelection(product, occupationId, categoryId)
  );
}

/**
 * @deprecated Prefer {@link productMatchesOccupationSelection}. Supports legacy
 * single-entity selection; department/brand always fail (retired from IA).
 */
export function productMatchesShopSelection(
  product: ShopProduct,
  selection: StorefrontShopSelection
): boolean {
  if (!isShopProductEligible(product)) {
    return false;
  }

  if (selection.kind === "range") {
    return product.range_id === selection.id;
  }
  if (selection.kind === "category") {
    return productInCategory(product, selection.id);
  }
  // department / brand — no longer used by Storefront Shop
  return false;
}

/**
 * Options for Shop product filters.
 */
export type FilterShopProductsOptions = {
  /**
   * When set, case-insensitive search matches this display name
   * (e.g. ContentTranslationContext product name) instead of `product.name`.
   */
  resolveDisplayName?: (product: ShopProduct) => string;
};

/**
 * Applies optional case-insensitive name search to an already selection-filtered list.
 * Empty query returns `products` unchanged (no defensive copy).
 */
function applyShopSearch(
  products: ShopProduct[],
  searchQuery: string,
  options?: FilterShopProductsOptions
): ShopProduct[] {
  const trimmed = searchQuery.trim().toLowerCase();
  if (trimmed.length === 0) {
    return products;
  }
  const resolveName = options?.resolveDisplayName;
  return products.filter((product) => {
    const displayName =
      resolveName !== undefined ? resolveName(product) : product.name;
    return displayName.toLowerCase().includes(trimmed);
  });
}

/**
 * Filters products by occupation (+ optional category), AND-ing a name query.
 *
 * **Search scope:** within the current occupation (and category when selected).
 * Empty query → selection-only filter.
 *
 * @param products - Catalog products
 * @param selection - Occupation selection, or `null` (eligible products only)
 * @param searchQuery - Free-text query; empty → selection-only
 * @param options - Optional display-name resolver for translated search
 */
export function filterOccupationShopProducts(
  products: readonly ShopProduct[],
  selection: StorefrontOccupationSelection | null,
  searchQuery: string = "",
  options?: FilterShopProductsOptions
): ShopProduct[] {
  const selected = products.filter((product) => {
    if (selection !== null) {
      return productMatchesOccupationSelection(
        product,
        selection.occupationId,
        selection.categoryId
      );
    }
    return isShopProductEligible(product);
  });
  return applyShopSearch(selected, searchQuery, options);
}

/**
 * @deprecated Prefer {@link filterOccupationShopProducts}. Filters by legacy
 * single-entity selection; search remains within that selection.
 */
export function filterShopProducts(
  products: readonly ShopProduct[],
  selection: StorefrontShopSelection | null,
  searchQuery: string = "",
  options?: FilterShopProductsOptions
): ShopProduct[] {
  const selected = products.filter((product) => {
    if (selection !== null) {
      return productMatchesShopSelection(product, selection);
    }
    return isShopProductEligible(product);
  });
  return applyShopSearch(selected, searchQuery, options);
}

/**
 * Returns the first `visibleCount` products for client-side lazy paging.
 *
 * @param products - Already-filtered product list
 * @param visibleCount - How many items to show (grows via `onEndReached`)
 */
export function pageShopProducts<T>(
  products: readonly T[],
  visibleCount: number
): T[] {
  const safeCount = Number.isFinite(visibleCount)
    ? Math.max(0, Math.floor(visibleCount))
    : 0;
  return products.slice(0, safeCount);
}

/**
 * True when more filtered products remain beyond the current visible window.
 */
export function hasMoreShopProducts(
  totalFiltered: number,
  visibleCount: number
): boolean {
  return visibleCount < totalFiltered;
}
