import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/database.types";
import { useAlertContext } from "../AlertContext";

export type ProductCategory = Database["public"]["Tables"]["product_categories"]["Row"];
export type ProductCategoryInsert = Database["public"]["Tables"]["product_categories"]["Insert"];
export type ProductCategoryUpdate = Database["public"]["Tables"]["product_categories"]["Update"];

interface ProductCategoryContextProps {
  productCategories: ProductCategory[];
  createProductCategory: (productCategory: ProductCategoryInsert) => Promise<ProductCategory | undefined>;
  updateProductCategory: (productCategory: ProductCategoryUpdate) => Promise<void>;
  deleteProductCategory: (productCategoryId: string) => Promise<void>;
  loading: boolean;
}

const ProductCategoryContext = createContext<ProductCategoryContextProps | undefined>(undefined);

export function ProductCategoryProvider({ children }: PropsWithChildren) {
  /** Lists unused in customer UI — category links embed on Product joins. */
  const [productCategories] = useState<ProductCategory[]>([]);
  const [loading] = useState(false);
  const { showAlert } = useAlertContext();


  /**
   * A ref wrapper for AlertContext's `showAlert` to avoid effect dependency loops.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  /**
   * Create a product-category link.
   *
   * @param productCategory - Insert payload for `product_categories`.
   * @returns The created row, or undefined on error.
   */
  const createProductCategory = useCallback(
    async (productCategory: ProductCategoryInsert): Promise<ProductCategory | undefined> => {
      try {
        const { data, error } = await supabase
          .from("product_categories")
          .insert(productCategory)
          .select("*")
          .single();

        if (error) {
          showAlertRef.current?.(error.message, "error");
          return undefined;
        }

        return data ?? undefined;
      } catch (error: unknown) {
        console.error("Failed to create product category:", error);
        showAlertRef.current?.("Failed to create product category", "error");
        return undefined;
      }
    },
    []
  );

  /**
   * Update a product-category link.
   *
   * @param productCategory - Update payload; must include an `id`.
   */
  const updateProductCategory = useCallback(
    async (productCategory: ProductCategoryUpdate): Promise<void> => {
      const id = productCategory.id;
      if (typeof id !== "string" || id.trim().length === 0) {
        showAlertRef.current?.("Missing product category id for update.", "error");
        return;
      }

      try {
        const { error } = await supabase
          .from("product_categories")
          .update(productCategory)
          .eq("id", id);

        if (error) {
          showAlertRef.current?.(error.message, "error");
        }
      } catch (error: unknown) {
        console.error("Failed to update product category:", error);
        showAlertRef.current?.("Failed to update product category", "error");
      }
    },
    []
  );

  /**
   * Delete a product-category link by id.
   *
   * @param productCategoryId - Link ID to delete.
   */
  const deleteProductCategory = useCallback(async (productCategoryId: string): Promise<void> => {
    if (productCategoryId.trim().length === 0) {
      showAlertRef.current?.("Product category ID is required to delete.", "error");
      return;
    }

    try {
      const { error } = await supabase
        .from("product_categories")
        .delete()
        .eq("id", productCategoryId);

      if (error) {
        showAlertRef.current?.(error.message, "error");
      }
    } catch (error: unknown) {
      console.error("Failed to delete product category:", error);
      showAlertRef.current?.("Failed to delete product category", "error");
    }
  }, []);

  const value = useMemo<ProductCategoryContextProps>(
    () => ({
      productCategories,
      createProductCategory,
      updateProductCategory,
      deleteProductCategory,
      loading,
    }),
    [productCategories, createProductCategory, updateProductCategory, deleteProductCategory, loading]
  );

  return (
    <ProductCategoryContext.Provider value={value}>
      {children}
    </ProductCategoryContext.Provider>
  );
}

export function useProductCategoryContext() {
  const context = useContext(ProductCategoryContext);

  if (!context) {
    throw new Error("useProductCategoryContext must be used within a ProductCategoryProvider");
  }

  return context;
}
