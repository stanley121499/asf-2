import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  PropsWithChildren,
} from "react";
import { getErrorTranslationKey } from "@/i18n/errorMap";
import { supabase } from "@/lib/supabase";
import { Database } from "@/database.types";
import { useAlertContext } from "../AlertContext";
import { useTranslation } from "../LocaleContext";

import { ProductMedia } from "./ProductMediaContext";
import { Category } from "./CategoryContext";
import {
  ProductCategory,
  useProductCategoryContext,
} from "./ProductCategoryContext";
import { ProductSize, useProductSizeContext } from "./ProductSizeContext";
import { ProductColor, useProductColorContext } from "./ProductColorContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { restoreById, softDeleteById } from "@/lib/softDelete";
import { isSoftDeletedRow } from "@/lib/softDeleteRuntime";
import {
  type ProductStockVariantRow,
  sumProductStockCounts,
} from "@/lib/productStock";
import { scheduleDeferredRealtime } from "@/lib/deferredRealtime";

/**
 * P0 first-paint page — enough for Home above-the-fold (arrivals 2×3 + early
 * Shop rows). Further pages load only when Shop / lists ask via
 * {@link ProductActionsContextProps.loadMoreProducts}.
 */
const P0_PRODUCT_FETCH_LIMIT = 24;

/** Subsequent infinite-query page size (Shop / product-list onEndReached). */
const PRODUCT_PAGE_SIZE = 24;

/**
 * Joined select used for catalog pages and single-product ensure fetches.
 * Storefront (R5–R6): `product_medias` includes `color_id` for colorway photos.
 */
const PRODUCT_JOIN_SELECT = `
  *,
  product_medias(id, product_id, media_url, arrangement, color_id, created_at, updated_at),
  product_categories(*),
  product_colors(*),
  product_sizes(*),
  product_stock(id, product_id, color_id, size_id, count)
`;

/**
 * Emits a `[prio]` Metro breadcrumb in development only.
 *
 * @param message - Short priority-loading step label
 * @param detail - Optional structured detail (counts, page index)
 */
function prioLog(message: string, detail?: unknown): void {
  if (!__DEV__) {
    return;
  }
  if (detail === undefined) {
    console.log(`[prio] ${message}`);
  } else {
    console.log(`[prio] ${message}`, detail);
  }
}

/** Product with computed client-side fields */
export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  medias: ProductMedia[];
  product_categories: ProductCategory[];
  product_colors: ProductColor[];
  product_sizes: ProductSize[];
  product_stocks: ProductStockVariantRow[];
  stock_status: string;
  stock_count: number;
};
export type Products = { products: Product[] };
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

/**
 * Frequently-changing catalog snapshot — subscribers re-render when pages
 * append or Realtime mutates the list.
 */
interface ProductDataContextProps {
  products: Product[];
  /** True only during the initial P0 fetch (blocks Home/Shop first paint). */
  loading: boolean;
  /** True while a P1+ page request is in flight. */
  loadingMore: boolean;
  /** False when the last page returned fewer rows than the page size. */
  hasMore: boolean;
}

/** Stable mutation + pagination API — does not change when the product list updates. */
interface ProductActionsContextProps {
  /**
   * Fetches the next catalog page and appends it (deduped). No-ops when
   * `hasMore` is false or a page request is already in flight.
   */
  loadMoreProducts: () => Promise<void>;
  /**
   * Ensures a single product (with joins) is present in the catalog state —
   * used by PDP / deep links when the SKU is outside the loaded pages.
   */
  ensureProduct: (productId: string) => Promise<Product | undefined>;
  createProduct: (
    product: ProductInsert,
    selectedColors: string[],
    selectedSizes: string[],
    selectedCategories: Category[]
  ) => Promise<Product | undefined>;
  updateProduct: (
    product: ProductUpdate,
    selectedColors: string[],
    selectedSizes: string[],
    selectedCategories: Category[]
  ) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  restoreProduct: (productId: string) => Promise<void>;
  updateProductTimePost: (
    productId: string,
    productTimePost: string | null
  ) => Promise<void>;
}

/** Combined public shape (backward-compatible with existing consumers). */
interface ProductContextProps
  extends ProductDataContextProps,
    ProductActionsContextProps {}

const ProductDataContext = createContext<ProductDataContextProps | undefined>(
  undefined
);
const ProductActionsContext = createContext<
  ProductActionsContextProps | undefined
>(undefined);

export function ProductProvider({ children }: Readonly<PropsWithChildren>): React.ReactElement {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { showAlert } = useAlertContext();
  const { t } = useTranslation();
  const { createProductColor, updateProductColor } = useProductColorContext();
  const { createProductSize, updateProductSize } = useProductSizeContext();
  const { createProductCategory, deleteProductCategory } =
    useProductCategoryContext();

  /**
   * A ref wrapper for AlertContext's `showAlert` to avoid effect dependency loops.
   * This keeps access to the latest showAlert without re-subscribing on every render.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);
  const tRef = useRef(t);
  /** Next `.range` start index for P1+ pages (avoids stale closures in loadMore). */
  const nextOffsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  /** Latest catalog snapshot for ensure/lookup without destabilizing actions. */
  const productsRef = useRef<Product[]>(products);
  /** In-flight ensure fetches keyed by product id (dedupe concurrent PDP opens). */
  const ensureInflightRef = useRef<Map<string, Promise<Product | undefined>>>(
    new Map()
  );

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  /**
   * Converts an unknown caught error to a safe human-readable message.
   *
   * @param error - The caught error value.
   * @returns A safe string message for logging/alerts.
   */
  const getErrorMessage = useCallback((error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "Unknown error";
  }, []);

  type ProductRow = Database["public"]["Tables"]["products"]["Row"];

  /** Joined products row shape returned by {@link PRODUCT_JOIN_SELECT}. */
  type JoinedProductRow = ProductRow & {
    product_medias?: ProductMedia[] | null;
    product_categories?: ProductCategory[] | null;
    product_colors?: ProductColor[] | null;
    product_sizes?: ProductSize[] | null;
    product_stock?: ProductStockVariantRow[] | null;
  };

  /**
   * Maps a raw `products` row into the context's `Product` shape with safe defaults.
   *
   * @param row - Raw database row.
   * @returns Normalized Product used by the UI.
   */
  const mapRowToProduct = useCallback((row: ProductRow): Product => {
    return {
      ...row,
      medias: [],
      product_categories: [],
      product_colors: [],
      product_sizes: [],
      product_stocks: [],
      stock_status: "",
      stock_count: 0,
    };
  }, []);

  /**
   * Maps a joined products row into the UI {@link Product} shape.
   *
   * Soft-deleted colors/sizes are filtered client-side after the join.
   *
   * @param row - Supabase join row including nested relations.
   */
  const mapJoinedRowToProduct = useCallback((row: JoinedProductRow): Product => {
    const stockRows: ProductStockVariantRow[] = Array.isArray(row.product_stock)
      ? row.product_stock
      : [];
    const stockCount = sumProductStockCounts(stockRows);
    const colorRows: ProductColor[] = Array.isArray(row.product_colors)
      ? row.product_colors
      : [];
    const sizeRows: ProductSize[] = Array.isArray(row.product_sizes)
      ? row.product_sizes
      : [];
    const mediaRows: ProductMedia[] = Array.isArray(row.product_medias)
      ? row.product_medias
      : [];
    const categoryRows: ProductCategory[] = Array.isArray(row.product_categories)
      ? row.product_categories
      : [];

    return {
      ...row,
      medias: mediaRows,
      product_categories: categoryRows,
      product_colors: colorRows.filter((c) => !isSoftDeletedRow(c)),
      product_sizes: sizeRows.filter((s) => !isSoftDeletedRow(s)),
      product_stocks: stockRows,
      stock_status: "",
      stock_count: stockCount,
    };
  }, []);

  /**
   * Appends products into state, skipping ids already present (Realtime / ensure).
   *
   * @param incoming - Newly fetched page or single product rows.
   */
  const appendProducts = useCallback((incoming: Product[]): void => {
    if (incoming.length === 0) {
      return;
    }
    setProducts((prev) => {
      const seen = new Set(prev.map((product) => product.id));
      const fresh = incoming.filter((product) => !seen.has(product.id));
      if (fresh.length === 0) {
        return prev;
      }
      return [...prev, ...fresh];
    });
  }, []);

  /**
   * Fetches one catalog page (joined) ordered by `created_at` desc.
   *
   * @param offset - Zero-based row offset (Supabase `.range` start).
   * @param limit - Page size.
   * @returns Mapped products, or `null` when the request failed (alert already shown).
   */
  const fetchProductPage = useCallback(
    async (offset: number, limit: number): Promise<Product[] | null> => {
      const safeOffset = Number.isFinite(offset) && offset >= 0 ? Math.floor(offset) : 0;
      const safeLimit =
        Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : PRODUCT_PAGE_SIZE;
      const rangeEnd = safeOffset + safeLimit - 1;

      try {
        const { data, error } = await supabase
          .from("products")
          .select(PRODUCT_JOIN_SELECT)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .range(safeOffset, rangeEnd);

        if (error !== null) {
          showAlertRef.current?.(error.message, "error");
          if (process.env.NODE_ENV === "development") {
            console.error(error);
          }
          return null;
        }

        const rows: JoinedProductRow[] = Array.isArray(data)
          ? (data as JoinedProductRow[])
          : [];
        return rows.map((row) => mapJoinedRowToProduct(row));
      } catch (error: unknown) {
        if (process.env.NODE_ENV === "development") {
          console.error("[ProductContext] Failed to fetch products:", error);
        }
        showAlertRef.current?.(
          tRef.current(getErrorTranslationKey("Failed to fetch products")),
          "error",
        );
        return null;
      }
    },
    [mapJoinedRowToProduct]
  );

  /**
   * P0 cold-start fetch — replaces catalog state with the first page only.
   * Does not schedule a silent full-catalog hydrate.
   */
  const fetchInitialProducts = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const mapped = await fetchProductPage(0, P0_PRODUCT_FETCH_LIMIT);
      if (mapped === null) {
        return;
      }
      setProducts(mapped);
      const more = mapped.length >= P0_PRODUCT_FETCH_LIMIT;
      hasMoreRef.current = more;
      setHasMore(more);
      nextOffsetRef.current = mapped.length;
      prioLog("P0 products ready", {
        count: mapped.length,
        hasMore: more,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchProductPage]);

  /**
   * P1+ infinite page — appends the next range when Shop/Home lists ask.
   */
  const loadMoreProducts = useCallback(async (): Promise<void> => {
    if (!hasMoreRef.current || loadingMoreRef.current) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const offset = nextOffsetRef.current;
    const pageNumber = Math.floor(offset / PRODUCT_PAGE_SIZE) + 1;

    try {
      const mapped = await fetchProductPage(offset, PRODUCT_PAGE_SIZE);
      if (mapped === null) {
        return;
      }

      appendProducts(mapped);
      nextOffsetRef.current = offset + mapped.length;
      const more = mapped.length >= PRODUCT_PAGE_SIZE;
      hasMoreRef.current = more;
      setHasMore(more);
      prioLog(`P1 page ${String(pageNumber)}`, {
        count: mapped.length,
        offset,
        hasMore: more,
      });
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [appendProducts, fetchProductPage]);

  /**
   * Loads one product by id into catalog state when missing (PDP / deep link).
   *
   * @param productId - Target product uuid.
   * @returns The product when found, otherwise `undefined`.
   */
  const ensureProduct = useCallback(
    async (productId: string): Promise<Product | undefined> => {
      const trimmed = productId.trim();
      if (trimmed.length === 0) {
        return undefined;
      }

      const existing = productsRef.current.find(
        (product) => product.id === trimmed
      );
      if (existing !== undefined) {
        return existing;
      }

      const inflight = ensureInflightRef.current.get(trimmed);
      if (inflight !== undefined) {
        return inflight;
      }

      const request = (async (): Promise<Product | undefined> => {
        try {
          const { data, error } = await supabase
            .from("products")
            .select(PRODUCT_JOIN_SELECT)
            .eq("id", trimmed)
            .is("deleted_at", null)
            .maybeSingle();

          if (error !== null) {
            if (process.env.NODE_ENV === "development") {
              console.error("[ProductContext] ensureProduct failed:", error);
            }
            return undefined;
          }
          if (data === null) {
            return undefined;
          }

          const mapped = mapJoinedRowToProduct(data as JoinedProductRow);
          appendProducts([mapped]);
          prioLog("ensureProduct", { id: trimmed });
          return mapped;
        } catch (error: unknown) {
          if (process.env.NODE_ENV === "development") {
            console.error("[ProductContext] ensureProduct error:", error);
          }
          return undefined;
        } finally {
          ensureInflightRef.current.delete(trimmed);
        }
      })();

      ensureInflightRef.current.set(trimmed, request);
      return request;
    },
    [appendProducts, mapJoinedRowToProduct]
  );

  /**
   * Handles realtime changes for products and keeps local state in sync.
   */
  const handleRealtimeChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ProductRow>): void => {
      if (payload.eventType === "INSERT") {
        // Ignore inserts of soft-deleted rows (should not happen, but be defensive).
        if (isSoftDeletedRow(payload.new)) {
          return;
        }
        startTransition(() => {
          setProducts((prev) => [...prev, mapRowToProduct(payload.new)]);
        });
      }

      if (payload.eventType === "UPDATE") {
        // Soft delete is an UPDATE; treat it like removal from active lists.
        if (isSoftDeletedRow(payload.new)) {
          startTransition(() => {
            setProducts((prev) => prev.filter((p) => p.id !== payload.new.id));
          });
          return;
        }

        startTransition(() => {
          setProducts((prev) =>
            prev.map((product) =>
              product.id === payload.new.id
                ? { ...product, ...payload.new }
                : product
            )
          );
        });
      }

      if (payload.eventType === "DELETE") {
        startTransition(() => {
          setProducts((prev) =>
            prev.filter((product) => product.id !== payload.old.id)
          );
        });
      }
    },
    [mapRowToProduct]
  );

  /**
   * First paint: P0 page only. Deferred Realtime stays; no silent full-catalog
   * hydrate — further pages come from {@link loadMoreProducts} on demand.
   */
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      await fetchInitialProducts();
      if (cancelled) {
        return;
      }
    };

    void bootstrap();

    const stopRealtime = scheduleDeferredRealtime(() =>
      supabase
        .channel("products")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          (payload: RealtimePostgresChangesPayload<ProductRow>) => {
            handleRealtimeChanges(payload);
          }
        )
        .subscribe()
    );

    return () => {
      cancelled = true;
      stopRealtime();
    };
  }, [fetchInitialProducts, handleRealtimeChanges]);

  /**
   * Creates a product and all related variant records (colors, sizes, categories).
   *
   * IMPORTANT: Variant creation uses `Promise.all(map(...))` to ensure we await completion.
   *
   * @param product - Base product row to insert.
   * @param selectedColors - Selected color names to create.
   * @param selectedSizes - Selected size names to create.
   * @param selectedCategories - Selected categories to attach to the product.
   * @returns The created product (with empty client-side arrays) or `undefined` (never on success).
   * @throws Error when base insert or any variant creation fails.
   */
  const createProduct = useCallback(
    async (
      product: ProductInsert,
      selectedColors: string[],
      selectedSizes: string[],
      selectedCategories: Category[]
    ): Promise<Product | undefined> => {
      // Step 1: Create the base product row
      const { data, error } = await supabase.from("products").insert(product).select("*");
      if (error) {
        // Fail fast: surface the DB error to the user and caller
        showAlertRef.current?.(error.message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        throw new Error(error.message);
      }

      // Step 2: Validate we received a created row back before using its ID
      const createdRow: ProductRow | undefined = data?.[0];
      if (!createdRow) {
        const message = "Product creation returned no created row.";
        showAlertRef.current?.(message, "error");
        throw new Error(message);
      }

      const productId = createdRow.id;

      // Step 3: Create all variant relations in parallel (and await completion)
      try {
        await Promise.all(
          selectedColors.map((color) =>
            createProductColor({
              product_id: productId,
              color: color,
              active: true,
            })
          )
        );
      } catch (error: unknown) {
        const message = `Failed to create product colors: ${getErrorMessage(error)}`;
        showAlertRef.current?.(message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        throw error instanceof Error ? error : new Error(message);
      }

      try {
        await Promise.all(
          selectedSizes.map((size) =>
            createProductSize({
              product_id: productId,
              size: size,
              active: true,
            })
          )
        );
      } catch (error: unknown) {
        const message = `Failed to create product sizes: ${getErrorMessage(error)}`;
        showAlertRef.current?.(message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        throw error instanceof Error ? error : new Error(message);
      }

      try {
        await Promise.all(
          selectedCategories.map((category) =>
            createProductCategory({
              product_id: productId,
              category_id: category.id,
            })
          )
        );
      } catch (error: unknown) {
        const message = `Failed to create product categories: ${getErrorMessage(error)}`;
        showAlertRef.current?.(message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        throw error instanceof Error ? error : new Error(message);
      }

      // Step 4: Return a normalized Product shape with client-side arrays defaulted
      const createdProduct: Product = {
        ...createdRow,
        medias: [],
        product_categories: [],
        product_colors: [],
        product_sizes: [],
        product_stocks: [],
        stock_status: "",
        stock_count: 0,
      };

      return createdProduct;
    },
    [createProductCategory, createProductColor, createProductSize, getErrorMessage]
  );

  /**
   * Synchronizes product colors by toggling existing rows and inserting missing ones.
   *
   * @param productId - Product id to sync for.
   * @param selectedColors - Desired active color names.
   */
  const syncProductColors = useCallback(
    async (productId: string, selectedColors: string[]): Promise<void> => {
      if (selectedColors.length === 0) {
        return;
      }

      const { data: colors, error: colorError } = await supabase
        .from("product_colors")
        .select("id,color")
        .eq("product_id", productId);
      if (colorError) {
        showAlertRef.current?.(colorError.message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(colorError);
        }
        throw new Error(colorError.message);
      }

      const existingColors = colors ?? [];
      const notDeletedColors = existingColors.filter((c) => !isSoftDeletedRow(c));
      const selectedColorSet = new Set(selectedColors);

      // Step A: Update active flags for all existing colors in parallel
      try {
        await Promise.all(
          notDeletedColors.map((colorRow) =>
            updateProductColor({
              id: colorRow.id,
              active: selectedColorSet.has(colorRow.color),
            })
          )
        );
      } catch (error: unknown) {
        const message = `Failed to update product colors: ${getErrorMessage(error)}`;
        showAlertRef.current?.(message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        throw error instanceof Error ? error : new Error(message);
      }

      // Step B: Create missing colors (those selected but not present in DB)
      const existingColorSet = new Set(notDeletedColors.map((c) => c.color));
      const colorsToCreate = selectedColors.filter((color) => !existingColorSet.has(color));
      try {
        await Promise.all(
          colorsToCreate.map((color) =>
            createProductColor({
              product_id: productId,
              color: color,
              active: true,
            })
          )
        );
      } catch (error: unknown) {
        const message = `Failed to create product colors: ${getErrorMessage(error)}`;
        showAlertRef.current?.(message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [createProductColor, getErrorMessage, updateProductColor]
  );

  /**
   * Synchronizes product sizes by toggling existing rows and inserting missing ones.
   *
   * @param productId - Product id to sync for.
   * @param selectedSizes - Desired active size names.
   */
  const syncProductSizes = useCallback(
    async (productId: string, selectedSizes: string[]): Promise<void> => {
      if (selectedSizes.length === 0) {
        return;
      }

      const { data: sizes, error: sizeError } = await supabase
        .from("product_sizes")
        .select("id,size")
        .eq("product_id", productId);
      if (sizeError) {
        showAlertRef.current?.(sizeError.message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(sizeError);
        }
        throw new Error(sizeError.message);
      }

      const existingSizes = sizes ?? [];
      const notDeletedSizes = existingSizes.filter((s) => !isSoftDeletedRow(s));
      const selectedSizeSet = new Set(selectedSizes);

      // Step A: Update active flags for all existing sizes in parallel
      try {
        await Promise.all(
          notDeletedSizes.map((sizeRow) =>
            updateProductSize({
              id: sizeRow.id,
              active: selectedSizeSet.has(sizeRow.size),
            })
          )
        );
      } catch (error: unknown) {
        const message = `Failed to update product sizes: ${getErrorMessage(error)}`;
        showAlertRef.current?.(message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        throw error instanceof Error ? error : new Error(message);
      }

      // Step B: Create missing sizes (those selected but not present in DB)
      const existingSizeSet = new Set(notDeletedSizes.map((s) => s.size));
      const sizesToCreate = selectedSizes.filter((size) => !existingSizeSet.has(size));
      try {
        await Promise.all(
          sizesToCreate.map((size) =>
            createProductSize({
              product_id: productId,
              size: size,
              active: true,
            })
          )
        );
      } catch (error: unknown) {
        const message = `Failed to create product sizes: ${getErrorMessage(error)}`;
        showAlertRef.current?.(message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [createProductSize, getErrorMessage, updateProductSize]
  );

  /**
   * Synchronizes product-category links by deleting existing links and inserting the desired set.
   *
   * @param productId - Product id to sync for.
   * @param selectedCategories - Desired categories.
   */
  const syncProductCategories = useCallback(
    async (productId: string, selectedCategories: Category[]): Promise<void> => {
      if (selectedCategories.length === 0) {
        return;
      }

      const { data: categories, error: categoryError } = await supabase
        .from("product_categories")
        .select("id")
        .eq("product_id", productId);
      if (categoryError) {
        showAlertRef.current?.(categoryError.message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(categoryError);
        }
        throw new Error(categoryError.message);
      }

      const existingCategories = categories ?? [];

      // Step A: Delete all existing category links in parallel
      try {
        await Promise.all(existingCategories.map((categoryRow) => deleteProductCategory(categoryRow.id)));
      } catch (error: unknown) {
        const message = `Failed to delete existing product categories: ${getErrorMessage(error)}`;
        showAlertRef.current?.(message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        throw error instanceof Error ? error : new Error(message);
      }

      // Step B: Create the desired category links in parallel
      try {
        await Promise.all(
          selectedCategories.map((category) =>
            createProductCategory({
              product_id: productId,
              category_id: category.id,
            })
          )
        );
      } catch (error: unknown) {
        const message = `Failed to create product categories: ${getErrorMessage(error)}`;
        showAlertRef.current?.(message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [createProductCategory, deleteProductCategory, getErrorMessage]
  );

  /**
   * Updates a product and synchronizes its variants (colors, sizes, categories).
   *
   * IMPORTANT: All async operations over arrays use `Promise.all(map(...))` so we
   * reliably await completion and properly surface failures.
   *
   * @param product - Partial product update; must include `id`.
   * @param selectedColors - Desired active colors for the product.
   * @param selectedSizes - Desired active sizes for the product.
   * @param selectedCategories - Desired categories for the product.
   * @returns Promise resolving when updates are complete.
   * @throws Error when base update or any variant sync operation fails.
   */
  const updateProduct = useCallback(
    async (
      product: ProductUpdate,
      selectedColors: string[],
      selectedSizes: string[],
      selectedCategories: Category[]
    ): Promise<void> => {
      const productId = product.id;
      if (typeof productId !== "string" || productId.trim().length === 0) {
        const message = "Missing product id for update.";
        showAlertRef.current?.(message, "error");
        throw new Error(message);
      }

      // Step 1: Update the base product row
      const { error } = await supabase
        .from("products")
        .update(product)
        .eq("id", productId)
        .select("*")
        .single();
      if (error) {
        showAlertRef.current?.(error.message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        throw new Error(error.message);
      }

      // Step 2: Sync variants and category links.\n      // These are split into helpers to keep this function readable and lint-friendly.
      await syncProductColors(productId, selectedColors);
      await syncProductSizes(productId, selectedSizes);
      await syncProductCategories(productId, selectedCategories);
    },
    [
      syncProductCategories,
      syncProductColors,
      syncProductSizes,
    ]
  );

  /**
   * Deletes a product by id.
   *
   * @param productId - Product id to delete.
   */
  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    if (productId.trim().length === 0) {
      showAlertRef.current?.("Product ID is required to delete.", "error");
      return;
    }

    try {
      // Soft delete prevents FK constraint errors while preserving order history.
      await softDeleteById("products", productId);
      showAlertRef.current?.("Product deleted successfully", "success");
    } catch (error: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to delete product:", error);
      }
      showAlertRef.current?.("Failed to delete product", "error");
      throw error instanceof Error ? error : new Error(getErrorMessage(error));
    }
  }, [getErrorMessage]);

  /**
   * Restores a previously soft-deleted product by clearing deleted_at.
   *
   * @param productId - Product id to restore.
   */
  const restoreProduct = useCallback(async (productId: string): Promise<void> => {
    if (productId.trim().length === 0) {
      showAlertRef.current?.("Product ID is required to restore.", "error");
      return;
    }

    try {
      await restoreById("products", productId);
      showAlertRef.current?.("Product restored successfully", "success");
    } catch (error: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to restore product:", error);
      }
      showAlertRef.current?.("Failed to restore product", "error");
      throw error instanceof Error ? error : new Error(getErrorMessage(error));
    }
  }, [getErrorMessage]);

  /**
   * Updates the scheduled post time for a product.
   *
   * @param productId - Product id to update.
   * @param productTimePost - Time value to persist (nullable).
   */
  const updateProductTimePost = useCallback(
    async (productId: string, productTimePost: string | null): Promise<void> => {
      // Validation: we cannot update a product without an ID.
      if (productId.trim().length === 0) {
        const message = "Missing product id for schedule update.";
        showAlertRef.current?.(message, "error");
        throw new Error(message);
      }

      const { error } = await supabase
        .from("products")
        // Persist the schedule time and bump `updated_at` for visibility.
        .update({ time_post: productTimePost, updated_at: new Date().toISOString() })
        .eq("id", productId);
      if (error) {
        showAlertRef.current?.(error.message, "error");
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        // Throw so callers can avoid showing a false success alert.
        throw new Error(error.message);
      }
    },
    []
  );

  /**
   * Data slice — changes whenever catalog pages / loading flags update.
   * Screens that only need mutations should use {@link useProductActions}
   * so they skip re-renders when the catalog list grows.
   */
  const dataValue = useMemo<ProductDataContextProps>(
    () => ({
      products,
      loading,
      loadingMore,
      hasMore,
    }),
    [products, loading, loadingMore, hasMore]
  );

  /**
   * Actions slice — identity-stable across catalog page appends.
   */
  const actionsValue = useMemo<ProductActionsContextProps>(
    () => ({
      loadMoreProducts,
      ensureProduct,
      createProduct,
      updateProduct,
      deleteProduct,
      restoreProduct,
      updateProductTimePost,
    }),
    [
      loadMoreProducts,
      ensureProduct,
      createProduct,
      updateProduct,
      deleteProduct,
      restoreProduct,
      updateProductTimePost,
    ]
  );

  return (
    <ProductActionsContext.Provider value={actionsValue}>
      <ProductDataContext.Provider value={dataValue}>
        {children}
      </ProductDataContext.Provider>
    </ProductActionsContext.Provider>
  );
}

/**
 * Catalog list + loading flag only. Prefer this over {@link useProductContext}
 * when the screen does not call product mutations (avoids depending on the
 * actions object identity, though data updates still re-render).
 */
export function useProductData(): ProductDataContextProps {
  const context = useContext(ProductDataContext);
  if (context === undefined) {
    throw new Error("useProductData must be used within a ProductProvider");
  }
  return context;
}

/**
 * Product mutation helpers only. Does not re-render when `products` changes.
 */
export function useProductActions(): ProductActionsContextProps {
  const context = useContext(ProductActionsContext);
  if (context === undefined) {
    throw new Error("useProductActions must be used within a ProductProvider");
  }
  return context;
}

/**
 * Combined catalog API (data + actions). Re-renders on every products update.
 * Prefer {@link useProductData} / {@link useProductActions} when splitting helps.
 */
export function useProductContext(): ProductContextProps {
  const data = useContext(ProductDataContext);
  const actions = useContext(ProductActionsContext);
  if (data === undefined || actions === undefined) {
    throw new Error("useProductContext must be used within a ProductProvider");
  }
  return useMemo(
    () => ({
      ...data,
      ...actions,
    }),
    [data, actions]
  );
}

