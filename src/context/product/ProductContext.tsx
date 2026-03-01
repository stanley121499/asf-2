import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "../AlertContext";

import { ProductMedia } from "./ProductMediaContext";
import { Category } from "./CategoryContext";
import {
  ProductCategory,
  useProductCategoryContext,
} from "./ProductCategoryContext";
import { ProductSize, useProductSizeContext } from "./ProductSizeContext";
import { ProductColor, useProductColorContext } from "./ProductColorContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { restoreById, softDeleteById } from "../../utils/softDelete";
import { isSoftDeletedRow } from "../../utils/softDeleteRuntime";

/** Product with computed client-side fields */
export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  medias: ProductMedia[];
  product_categories: ProductCategory[];
  product_colors: ProductColor[];
  product_sizes: ProductSize[];
  stock_status: string;
  stock_count: number;
};
export type Products = { products: Product[] };
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

interface ProductContextProps {
  products: Product[];
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
  loading: boolean;
  updateProductTimePost: (
    productId: string,
    productTimePost: string | null
  ) => Promise<void>;
}

const ProductContext = createContext<ProductContextProps | undefined>(undefined);

export function ProductProvider({ children }: Readonly<PropsWithChildren>): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { createProductColor, updateProductColor } = useProductColorContext();
  const { createProductSize, updateProductSize } = useProductSizeContext();
  const { createProductCategory, deleteProductCategory } =
    useProductCategoryContext();

  /**
   * A ref wrapper for AlertContext's `showAlert` to avoid effect dependency loops.
   * This keeps access to the latest showAlert without re-subscribing on every render.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

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
  type RpcReturnedProduct =
    Database["public"]["Functions"]["fetch_products_with_computed_attributes"]["Returns"][number];

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
      stock_status: "",
      stock_count: 0,
    };
  }, []);

  /**
   * Fetches products via RPC (computed attributes) and merges in base product rows for missing fields.
   */
  const fetchProducts = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("fetch_products_with_computed_attributes");

      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
        return;
      }

      // Merge base rows to include classification IDs that the RPC may omit.
      const ids: string[] = (data ?? []).map((p: RpcReturnedProduct) => p.id);
      let rowsById: Record<string, ProductRow> = {};
      let allowedIds = new Set<string>();

      if (ids.length > 0) {
        const { data: baseRows, error: baseError } = await supabase
          .from("products")
          .select("*")
          .in("id", ids);

        if (baseError) {
          showAlertRef.current?.(baseError.message, "error");
          console.error(baseError);
        }

        if (baseRows) {
          const filteredBaseRows = baseRows.filter((r) => !isSoftDeletedRow(r));
          rowsById = Object.fromEntries(filteredBaseRows.map((r) => [r.id, r]));
          allowedIds = new Set(filteredBaseRows.map((r) => r.id));
        }
      }

      const mapped: Product[] = (data ?? [])
        // If we fetched base rows (ids.length > 0), only keep products that are not soft deleted.
        .filter((p: RpcReturnedProduct) => (ids.length > 0 ? allowedIds.has(p.id) : true))
        .map((p: RpcReturnedProduct) => {
          const base = rowsById[p.id];

          // If we have the base row (from `products` table), prefer it for fields the RPC omits.
          // Otherwise, build a complete `products.Row` from the RPC payload with safe fallbacks.
          const row: ProductRow =
            base ??
            ({
              id: p.id,
              name: p.name,
              price: p.price,
              description: p.description ?? null,
              article_number: p.article_number ?? null,
              festival: p.festival ?? null,
              season: p.season ?? null,
              status: p.status,
              stock_code: p.stock_code ?? null,
              stock_place: p.stock_place ?? null,
              created_at: p.created_at,
              updated_at: p.updated_at,
              time_post: p.time_post ?? null,
              product_folder_id: p.product_folder_id ?? null,
              // The RPC does not return deleted_at; default to NULL for active products.
              deleted_at: null,
              // The RPC does not return these; default to null.
              brand_id: null,
              category_id: null,
              department_id: null,
              range_id: null,
              warranty_description: null,
              warranty_period: null,
            } satisfies ProductRow);

          return {
            ...row,
            medias: [],
            product_categories: [],
            product_colors: [],
            product_sizes: [],
            stock_status: p.stock_status ?? "",
            stock_count: typeof p.stock_count === "number" ? p.stock_count : 0,
          };
        });

      setProducts(mapped);
    } catch (error: unknown) {
      console.error("[ProductContext] Failed to fetch products:", error);
      showAlertRef.current?.("Failed to fetch products", "error");
    } finally {
      setLoading(false);
    }
  }, []);

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
        setProducts((prev) => [...prev, mapRowToProduct(payload.new)]);
      }

      if (payload.eventType === "UPDATE") {
        // Soft delete is an UPDATE; treat it like removal from active lists.
        if (isSoftDeletedRow(payload.new)) {
          setProducts((prev) => prev.filter((p) => p.id !== payload.new.id));
          return;
        }

        setProducts((prev) =>
          prev.map((product) =>
            product.id === payload.new.id ? { ...product, ...payload.new } : product
          )
        );
      }

      if (payload.eventType === "DELETE") {
        setProducts((prev) => prev.filter((product) => product.id !== payload.old.id));
      }
    },
    [mapRowToProduct]
  );

  /**
   * Initial fetch + realtime subscription.
   */
  useEffect(() => {
    void fetchProducts();

    const subscription = supabase
      .channel("products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload: RealtimePostgresChangesPayload<ProductRow>) => {
          handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProducts, handleRealtimeChanges]);

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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
        throw error instanceof Error ? error : new Error(message);
      }

      // Step 4: Return a normalized Product shape with client-side arrays defaulted
      const createdProduct: Product = {
        ...createdRow,
        medias: [],
        product_categories: [],
        product_colors: [],
        product_sizes: [],
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
        console.error(colorError);
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
        console.error(error);
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
        console.error(error);
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
        console.error(sizeError);
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
        console.error(error);
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
        console.error(error);
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
        console.error(categoryError);
        throw new Error(categoryError.message);
      }

      const existingCategories = categories ?? [];

      // Step A: Delete all existing category links in parallel
      try {
        await Promise.all(existingCategories.map((categoryRow) => deleteProductCategory(categoryRow.id)));
      } catch (error: unknown) {
        const message = `Failed to delete existing product categories: ${getErrorMessage(error)}`;
        showAlertRef.current?.(message, "error");
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
      console.error("Failed to delete product:", error);
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
      console.error("Failed to restore product:", error);
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
        console.error(error);
        // Throw so callers can avoid showing a false success alert.
        throw new Error(error.message);
      }
    },
    []
  );

  const value = useMemo<ProductContextProps>(
    () => ({
      products,
      createProduct,
      updateProduct,
      deleteProduct,
      restoreProduct,
      loading,
      updateProductTimePost,
    }),
    [
      products,
      createProduct,
      updateProduct,
      deleteProduct,
      restoreProduct,
      loading,
      updateProductTimePost,
    ]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProductContext must be used within a ProductProvider");
  }
  return context;
}
