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

export type ProductMedia = Database["public"]["Tables"]["product_medias"]["Row"];
export type ProductMediaInsert = Database["public"]["Tables"]["product_medias"]["Insert"];
export type ProductMediaUpdate = Database["public"]["Tables"]["product_medias"]["Update"];

interface ProductMediaContextProps {
  /**
   * Always empty in the customer app — product medias arrive embedded on
   * {@link Product} via `ProductContext` (`product_medias` join). Kept so
   * mutation helpers and type imports stay stable.
   */
  productMedias: ProductMedia[];
  createProductMedia: (productMedia: ProductMediaInsert) => Promise<void>;
  updateProductMedia: (productMedia: ProductMediaUpdate) => Promise<void>;
  deleteProductMedia: (productMediaId: string) => Promise<void>;
  deleteAllProductMediaByProductId: (productId: string) => Promise<void>;
  loading: boolean;
}

const ProductMediaContext = createContext<ProductMediaContextProps | undefined>(undefined);

/**
 * Lean media provider: no full-table hydrate and no Realtime channel.
 * Catalog screens read medias from `ProductContext` products (already joined).
 * This removes a duplicate cold-start fetch + WebSocket against `product_medias`.
 */
export function ProductMediaProvider({ children }: PropsWithChildren): React.ReactElement {
  const [productMedias] = useState<ProductMedia[]>([]);
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
   * Create a product media row (write-only; list owned by ProductContext joins).
   *
   * @param productMedia - Insert payload for `product_medias`.
   */
  const createProductMedia = useCallback(async (productMedia: ProductMediaInsert): Promise<void> => {
    try {
      const { error } = await supabase.from("product_medias").insert(productMedia);

      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
      }
    } catch (error: unknown) {
      console.error("Failed to create product media:", error);
      showAlertRef.current?.("Failed to create product media", "error");
    }
  }, []);

  /**
   * Update a product media row.
   *
   * @param productMedia - Update payload; must include an `id`.
   */
  const updateProductMedia = useCallback(async (productMedia: ProductMediaUpdate): Promise<void> => {
    const id = productMedia.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      showAlertRef.current?.("Missing product media id for update.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_medias").update(productMedia).eq("id", id);

      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
      }
    } catch (error: unknown) {
      console.error("Failed to update product media:", error);
      showAlertRef.current?.("Failed to update product media", "error");
    }
  }, []);

  /**
   * Delete a product media row.
   *
   * @param productMediaId - Media ID to delete.
   */
  const deleteProductMedia = useCallback(async (productMediaId: string): Promise<void> => {
    if (productMediaId.trim().length === 0) {
      showAlertRef.current?.("Product media ID is required to delete.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_medias").delete().eq("id", productMediaId);

      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
      }
    } catch (error: unknown) {
      console.error("Failed to delete product media:", error);
      showAlertRef.current?.("Failed to delete product media", "error");
    }
  }, []);

  /**
   * Delete all product medias for a given product.
   *
   * @param productId - Product ID to delete medias for.
   */
  const deleteAllProductMediaByProductId = useCallback(async (productId: string): Promise<void> => {
    if (productId.trim().length === 0) {
      showAlertRef.current?.("Product ID is required to delete medias.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_medias").delete().eq("product_id", productId);

      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
      }
    } catch (error: unknown) {
      console.error("Failed to delete product medias by product id:", error);
      showAlertRef.current?.("Failed to delete product medias", "error");
    }
  }, []);

  const value = useMemo<ProductMediaContextProps>(
    () => ({
      productMedias,
      createProductMedia,
      updateProductMedia,
      deleteProductMedia,
      deleteAllProductMediaByProductId,
      loading,
    }),
    [
      productMedias,
      createProductMedia,
      updateProductMedia,
      deleteProductMedia,
      deleteAllProductMediaByProductId,
      loading,
    ]
  );

  return (
    <ProductMediaContext.Provider value={value}>
      {children}
    </ProductMediaContext.Provider>
  );
}

export function useProductMediaContext(): ProductMediaContextProps {
  const context = useContext(ProductMediaContext);

  if (context === undefined) {
    throw new Error("useProductMediaContext must be used within a ProductMediaProvider");
  }

  return context;
}
