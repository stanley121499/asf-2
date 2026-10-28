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

export type ProductColor = Database["public"]["Tables"]["product_colors"]["Row"];
export type ProductColorInsert = Database["public"]["Tables"]["product_colors"]["Insert"];
export type ProductColorUpdate = Database["public"]["Tables"]["product_colors"]["Update"];

interface ProductColorContextProps {
  productColors: ProductColor[];
  createProductColor: (productColor: ProductColorInsert) => Promise<ProductColor | undefined>;
  updateProductColor: (productColor: ProductColorUpdate) => Promise<void>;
  deleteProductColor: (productColorId: string) => Promise<void>;
  restoreProductColor: (productColorId: string) => Promise<void>;
  loading: boolean;
}

const ProductColorContext = createContext<ProductColorContextProps | undefined>(undefined);

export function ProductColorProvider({ children }: PropsWithChildren) {
  /** Lists unused in customer UI — colors embed on Product joins. */
  const [productColors] = useState<ProductColor[]>([]);
  const [loading] = useState(false);
  const { showAlert } = useAlertContext();


  /**
   * A ref wrapper for AlertContext's `showAlert` to avoid effect dependency loops.
   * This keeps a stable callback dependency list while still calling the latest showAlert.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  /**
   * Create a new product color row.
   *
   * @param productColor - Insert payload for `product_colors`.
   * @returns The created row, or undefined on error.
   */
  const createProductColor = useCallback(
    async (productColor: ProductColorInsert): Promise<ProductColor | undefined> => {
      try {
        const { data, error } = await supabase
          .from("product_colors")
          .insert(productColor)
          .select("*")
          .single();

        if (error) {
          showAlertRef.current?.(error.message, "error");
          return undefined;
        }

        return data ?? undefined;
      } catch (error: unknown) {
        console.error("Failed to create product color:", error);
        showAlertRef.current?.("Failed to create product color", "error");
        return undefined;
      }
    },
    []
  );

  /**
   * Update an existing product color row.
   *
   * @param productColor - Update payload; must include an `id`.
   */
  const updateProductColor = useCallback(async (productColor: ProductColorUpdate): Promise<void> => {
    const id = productColor.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      showAlertRef.current?.("Missing product color id for update.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_colors").update(productColor).eq("id", id);

      if (error) {
        showAlertRef.current?.(error.message, "error");
      }
    } catch (error: unknown) {
      console.error("Failed to update product color:", error);
      showAlertRef.current?.("Failed to update product color", "error");
    }
  }, []);

  /**
   * Delete a product color by id.
   *
   * @param productColorId - ID of the product color to delete.
   */
  const deleteProductColor = useCallback(async (productColorId: string): Promise<void> => {
    if (productColorId.trim().length === 0) {
      showAlertRef.current?.("Product color ID is required to delete.", "error");
      return;
    }

    try {
      await softDeleteById("product_colors", productColorId, { setActive: true });
      showAlertRef.current?.("Product color deleted successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to delete product color:", error);
      showAlertRef.current?.("Failed to delete product color", "error");
    }
  }, []);

  /**
   * Restores a soft-deleted product color by clearing deleted_at and setting active=true.
   *
   * @param productColorId - ID of the product color to restore.
   */
  const restoreProductColor = useCallback(async (productColorId: string): Promise<void> => {
    if (productColorId.trim().length === 0) {
      showAlertRef.current?.("Product color ID is required to restore.", "error");
      return;
    }

    try {
      await restoreById("product_colors", productColorId, { setActive: true });
      showAlertRef.current?.("Product color restored successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to restore product color:", error);
      showAlertRef.current?.("Failed to restore product color", "error");
    }
  }, []);

  const value = useMemo<ProductColorContextProps>(
    () => ({
      productColors,
      createProductColor,
      updateProductColor,
      deleteProductColor,
      restoreProductColor,
      loading,
    }),
    [
      productColors,
      createProductColor,
      updateProductColor,
      deleteProductColor,
      restoreProductColor,
      loading,
    ]
  );

  return (
    <ProductColorContext.Provider value={value}>
      {children}
    </ProductColorContext.Provider>
  );
}

export function useProductColorContext(): ProductColorContextProps {
  const context = useContext(ProductColorContext);

  if (!context) {
    throw new Error("useProductColorContext must be used within a ProductColorProvider");
  }

  return context;
}
