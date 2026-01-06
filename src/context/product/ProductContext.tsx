import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";
import { ProductMedia } from "./ProductMediaContext";
import { Category } from "./CategoryContext";
import { useProductCategoryContext } from "./ProductCategoryContext";
import { ProductCategory } from "./ProductCategoryContext";
import { useProductSizeContext } from "./ProductSizeContext";
import { useProductColorContext } from "./ProductColorContext";
import { ProductColor } from "./ProductColorContext";
import { ProductSize } from "./ProductSizeContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

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
  loading: boolean;
  updateProductTimePost: (
    productId: string,
    _productTimePost: string
  ) => Promise<void>;
}

const ProductContext = createContext<ProductContextProps | undefined>(undefined);

export function ProductProvider({ children }: PropsWithChildren) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { createProductColor, updateProductColor } = useProductColorContext();
  const { createProductSize, updateProductSize } = useProductSizeContext();
  const { createProductCategory, deleteProductCategory } =
    useProductCategoryContext();

  /**
   * Converts an unknown caught error to a safe human-readable message.
   *
   * @param error - The caught error value.
   * @returns A safe string message for logging/alerts.
   */
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "Unknown error";
  };

  useEffect(() => {
    setLoading(true);

    const fetchProducts = async () => {
      type RpcReturnedProduct = Database["public"]["Functions"]["fetch_products_with_computed_attributes"]["Returns"][number];
      const { data, error } = await supabase.rpc("fetch_products_with_computed_attributes");

      if (error) {
        showAlert(error.message, "error");
        console.error(error);
        return;
      }

      // Map RPC result to Product with safe defaults.
      // Merge base rows to include classification ids that RPC omits
      const ids: string[] = (data ?? []).map((p) => (p as { id: string }).id);
      let rowsById: Record<string, Database["public"]["Tables"]["products"]["Row"]> = {};
      if (ids.length > 0) {
        const { data: baseRows } = await supabase
          .from("products")
          .select("*")
          .in("id", ids);
        if (baseRows) {
          rowsById = Object.fromEntries(baseRows.map((r) => [r.id, r]));
        }
      }

      const mapped: Product[] = (data ?? []).map((p: RpcReturnedProduct) => {
        const id = (p as { id: string }).id;
        const base = rowsById[id];
        const row: Database["public"]["Tables"]["products"]["Row"] = base
          ? { ...base }
          : (p as unknown as Database["public"]["Tables"]["products"]["Row"]);

        return {
          ...row,
          medias: [],
          product_categories: [],
          product_colors: [],
          product_sizes: [],
          stock_status: (p as { stock_status?: string }).stock_status ?? "",
          stock_count: typeof (p as { stock_count?: number }).stock_count === "number" ? (p as { stock_count?: number }).stock_count as number : 0,
        };
      });
      setProducts(mapped);
    };

    fetchProducts();

    const mapRowToProduct = (
      row: Database["public"]["Tables"]["products"]["Row"]
    ): Product => ({
      ...row,
      medias: [],
      product_categories: [],
      product_colors: [],
      product_sizes: [],
      stock_status: "",
      stock_count: 0,
    });

    const handleChanges = (
      payload: RealtimePostgresChangesPayload<Database["public"]["Tables"]["products"]["Row"]>
    ) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new as Database["public"]["Tables"]["products"]["Row"];
        setProducts((prev) => [...prev, mapRowToProduct(inserted)]);
      }

      if (payload.eventType === "UPDATE") {
        const updated = payload.new as Database["public"]["Tables"]["products"]["Row"];
        setProducts((prev) => prev.map((product) => (product.id === updated.id ? mapRowToProduct(updated) : product)));
      }

      if (payload.eventType === "DELETE") {
        const removed = payload.old as Database["public"]["Tables"]["products"]["Row"];
        setProducts((prev) => prev.filter((product) => product.id !== removed.id));
      }
    };

    const subscription = supabase
      .channel("products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload: RealtimePostgresChangesPayload<Database["public"]["Tables"]["products"]["Row"]>) => {
        handleChanges(payload);
      })
      .subscribe();

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

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
  const createProduct = async (
    product: ProductInsert,
    selectedColors: string[],
    selectedSizes: string[],
    selectedCategories: Category[]
  ) => {
    // Step 1: Create the base product row
    const { data, error } = await supabase.from("products").insert(product).select();
    if (error) {
      // Fail fast: surface the DB error to the user and caller
      showAlert(error.message, "error");
      console.error(error);
      throw new Error(error.message);
    }

    // Step 2: Validate we received a created row back before using its ID
    const createdRow = data?.[0];
    if (!createdRow) {
      const message = "Product creation returned no created row.";
      showAlert(message, "error");
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
      showAlert(message, "error");
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
      showAlert(message, "error");
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
      showAlert(message, "error");
      console.error(error);
      throw error instanceof Error ? error : new Error(message);
    }

    // Step 4: Return a normalized Product shape with client-side arrays defaulted
    return {
      ...(createdRow as Database["public"]["Tables"]["products"]["Row"]),
      medias: [],
      product_categories: [],
      product_colors: [],
      product_sizes: [],
      stock_status: "",
      stock_count: 0,
    } as Product;
  };

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
  const updateProduct = async (
    product: ProductUpdate,
    selectedColors: string[],
    selectedSizes: string[],
    selectedCategories: Category[]
  ) => {
    if (!product.id) {
      const message = "Missing product id for update.";
      showAlert(message, "error");
      throw new Error(message);
    }
    const productId = product.id;

    // Step 1: Update the base product row
    const { error } = await supabase
      .from("products")
      .update(product)
      .eq("id", productId)
      .select()
      .single();
    if (error) {
      showAlert(error.message, "error");
      console.error(error);
      throw new Error(error.message);
    }

    // Check if there are any colors to update
    if (selectedColors.length > 0) {
      const { data: colors, error: colorError } = await supabase
        .from("product_colors")
        .select("id,color")
        .eq("product_id", productId);
      if (colorError) {
        showAlert(colorError.message, "error");
        console.error(colorError);
        throw new Error(colorError.message);
      }

      const existingColors = colors ?? [];
      const selectedColorSet = new Set(selectedColors);

      // Step 2a: Update active flags for all existing colors in parallel
      try {
        await Promise.all(
          existingColors.map((colorRow) =>
            updateProductColor({
              id: colorRow.id,
              active: selectedColorSet.has(colorRow.color),
            })
          )
        );
      } catch (error: unknown) {
        const message = `Failed to update product colors: ${getErrorMessage(error)}`;
        showAlert(message, "error");
        console.error(error);
        throw error instanceof Error ? error : new Error(message);
      }

      // Step 2b: Create missing colors (those selected but not present in DB)
      const existingColorSet = new Set(existingColors.map((c) => c.color));
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
        showAlert(message, "error");
        console.error(error);
        throw error instanceof Error ? error : new Error(message);
      }
    }

    // Check if there are any sizes to update
    if (selectedSizes.length > 0) {
      const { data: sizes, error: sizeError } = await supabase
        .from("product_sizes")
        .select("id,size")
        .eq("product_id", productId);
      if (sizeError) {
        showAlert(sizeError.message, "error");
        console.error(sizeError);
        throw new Error(sizeError.message);
      }

      const existingSizes = sizes ?? [];
      const selectedSizeSet = new Set(selectedSizes);

      // Step 3a: Update active flags for all existing sizes in parallel
      try {
        await Promise.all(
          existingSizes.map((sizeRow) =>
            updateProductSize({
              id: sizeRow.id,
              active: selectedSizeSet.has(sizeRow.size),
            })
          )
        );
      } catch (error: unknown) {
        const message = `Failed to update product sizes: ${getErrorMessage(error)}`;
        showAlert(message, "error");
        console.error(error);
        throw error instanceof Error ? error : new Error(message);
      }

      // Step 3b: Create missing sizes (those selected but not present in DB)
      const existingSizeSet = new Set(existingSizes.map((s) => s.size));
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
        showAlert(message, "error");
        console.error(error);
        throw error instanceof Error ? error : new Error(message);
      }
    }

    // Check if there are any categories to update
    if (selectedCategories.length > 0) {
      const { data: categories, error: categoryError } = await supabase
        .from("product_categories")
        .select("id")
        .eq("product_id", productId);
      if (categoryError) {
        showAlert(categoryError.message, "error");
        console.error(categoryError);
        throw new Error(categoryError.message);
      }

      const existingCategories = categories ?? [];

      // Step 4a: Delete all existing category links in parallel
      try {
        await Promise.all(
          existingCategories.map((categoryRow) => deleteProductCategory(categoryRow.id))
        );
      } catch (error: unknown) {
        const message = `Failed to delete existing product categories: ${getErrorMessage(error)}`;
        showAlert(message, "error");
        console.error(error);
        throw error instanceof Error ? error : new Error(message);
      }

      // Step 4b: Create the desired category links in parallel
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
        showAlert(message, "error");
        console.error(error);
        throw error instanceof Error ? error : new Error(message);
      }
    }
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (error) {
      showAlert(error.message, "error");
      console.error(error);
    }
  };

  const updateProductTimePost = async (
    productId: string,
    productTimePost: string
  ) => {
    const { error } = await supabase
      .from("products")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", productId);
    if (error) {
      showAlert(error.message, "error");
      console.error(error);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        createProduct,
        updateProduct,
        deleteProduct,
        loading,
        updateProductTimePost,
      }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProductContext must be used within a ProductProvider");
  }
  return context;
}
