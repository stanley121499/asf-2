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
import { restoreById, softDeleteById } from "@/lib/softDelete";

export type ProductSize = Database["public"]["Tables"]["product_sizes"]["Row"];
export type ProductSizeInsert = Database["public"]["Tables"]["product_sizes"]["Insert"];
export type ProductSizeUpdate = Database["public"]["Tables"]["product_sizes"]["Update"];

interface ProductSizeContextProps {
  productSizes: ProductSize[];
  createProductSize: (productSize: ProductSizeInsert) => Promise<ProductSize | undefined>;
  updateProductSize: (productSize: ProductSizeUpdate) => Promise<void>;
  deleteProductSize: (productSizeId: string) => Promise<void>;
  restoreProductSize: (productSizeId: string) => Promise<void>;
  loading: boolean;
}

const ProductSizeContext = createContext<ProductSizeContextProps | undefined>(undefined);

export function ProductSizeProvider({ children }: PropsWithChildren) {
  /** Lists unused in customer UI — sizes embed on Product joins. */
  const [productSizes] = useState<ProductSize[]>([]);
  const [loading] = useState(false);
  const { showAlert } = useAlertContext();


  /**
   * A ref wrapper for AlertContext's `showAlert` to avoid effect dependency loops.
   * This keeps access to the latest function without re-subscribing on every render.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  /**
   * Create a new product size row.
   *
   * @param productSize - Insert payload for `product_sizes`.
   * @returns The created row, or undefined on error.
   */
  const createProductSize = useCallback(
    async (productSize: ProductSizeInsert): Promise<ProductSize | undefined> => {
      try {
        const { data, error } = await supabase
          .from("product_sizes")
          .insert(productSize)
          .select("*")
          .single();

        if (error) {
          showAlertRef.current?.(error.message, "error");
          return undefined;
        }

        return data ?? undefined;
      } catch (error: unknown) {
        console.error("Failed to create product size:", error);
        showAlertRef.current?.("Failed to create product size", "error");
        return undefined;
      }
    },
    []
  );

  /**
   * Update an existing product size row.
   *
   * @param productSize - Update payload; must include an `id`.
   */
  const updateProductSize = useCallback(async (productSize: ProductSizeUpdate): Promise<void> => {
    const id = productSize.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      showAlertRef.current?.("Missing product size id for update.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_sizes").update(productSize).eq("id", id);

      if (error) {
        showAlertRef.current?.(error.message, "error");
      }
    } catch (error: unknown) {
      console.error("Failed to update product size:", error);
      showAlertRef.current?.("Failed to update product size", "error");
    }
  }, []);

  /**
   * Delete a product size by id.
   *
   * @param productSizeId - ID of the product size to delete.
   */
  const deleteProductSize = useCallback(async (productSizeId: string): Promise<void> => {
    if (productSizeId.trim().length === 0) {
      showAlertRef.current?.("Product size ID is required to delete.", "error");
      return;
    }

    try {
      await softDeleteById("product_sizes", productSizeId, { setActive: true });
      showAlertRef.current?.("Product size deleted successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to delete product size:", error);
      showAlertRef.current?.("Failed to delete product size", "error");
    }
  }, []);

  /**
   * Restores a soft-deleted product size by clearing deleted_at and setting active=true.
   *
   * @param productSizeId - ID of the product size to restore.
   */
  const restoreProductSize = useCallback(async (productSizeId: string): Promise<void> => {
    if (productSizeId.trim().length === 0) {
      showAlertRef.current?.("Product size ID is required to restore.", "error");
      return;
    }

    try {
      await restoreById("product_sizes", productSizeId, { setActive: true });
      showAlertRef.current?.("Product size restored successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to restore product size:", error);
      showAlertRef.current?.("Failed to restore product size", "error");
    }
  }, []);

  const value = useMemo<ProductSizeContextProps>(
    () => ({
      productSizes,
      createProductSize,
      updateProductSize,
      deleteProductSize,
      restoreProductSize,
      loading,
    }),
    [
      productSizes,
      createProductSize,
      updateProductSize,
      deleteProductSize,
      restoreProductSize,
      loading,
    ]
  );

  return (
    <ProductSizeContext.Provider value={value}>
      {children}
    </ProductSizeContext.Provider>
  );
}

export function useProductSizeContext() {
  const context = useContext(ProductSizeContext);

  if (!context) {
    throw new Error("useProductSizeContext must be used within a ProductSizeProvider");
  }

  return context;
}
