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
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "../AlertContext";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type ProductMedia = Database["public"]["Tables"]["product_medias"]["Row"];
export type ProductMediaInsert = Database["public"]["Tables"]["product_medias"]["Insert"];
export type ProductMediaUpdate = Database["public"]["Tables"]["product_medias"]["Update"];

interface ProductMediaContextProps {
  productMedias: ProductMedia[];
  createProductMedia: (productMedia: ProductMediaInsert) => Promise<void>;
  updateProductMedia: (productMedia: ProductMediaUpdate) => Promise<void>;
  deleteProductMedia: (productMediaId: string) => Promise<void>;
  deleteAllProductMediaByProductId: (productId: string) => Promise<void>;
  loading: boolean;
}

const ProductMediaContext = createContext<ProductMediaContextProps | undefined>(undefined);

export function ProductMediaProvider({ children }: PropsWithChildren) {
  const [productMedias, setProductMedias] = useState<ProductMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();


  /**
   * A ref wrapper for AlertContext's `showAlert` to avoid effect dependency loops.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  /**
   * Fetch all product medias from Supabase.
   */
  const fetchProductMedias = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("product_medias").select("*");

      if (error) {
        showAlertRef.current?.(error.message, "error");
        return;
      }

      setProductMedias(data ?? []);
    } catch (error: unknown) {
      console.error("Failed to fetch product medias:", error);
      showAlertRef.current?.("Failed to fetch product medias", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Realtime handler for product media changes.
   */
  const handleRealtimeChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ProductMedia>): void => {
      if (payload.eventType === "INSERT") {
        setProductMedias((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setProductMedias((prev) =>
          prev.map((productMedia) => (productMedia.id === payload.new.id ? payload.new : productMedia))
        );
      }

      if (payload.eventType === "DELETE") {
        setProductMedias((prev) => prev.filter((productMedia) => productMedia.id !== payload.old.id));
      }
    },
    []
  );

  /**
   * Fetch once on mount and subscribe to realtime changes.
   * Auth-guarded: skip if there is no active user session.
   */
  useEffect(() => {
    void fetchProductMedias();

    const subscription = supabase
      .channel("product_medias")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_medias" },
        (payload: RealtimePostgresChangesPayload<ProductMedia>) => {
          handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProductMedias, handleRealtimeChanges]);

  /**
   * Create a product media row.\n   *
   * NOTE: List updates are handled by realtime subscriptions.\n   *
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
   * Update a product media row.\n   *
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
   * Delete a product media row.\n   *
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
   * Delete all product medias for a given product.\n   *
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

export function useProductMediaContext() {
  const context = useContext(ProductMediaContext);

  if (!context) {
    throw new Error("useProductMediaContext must be used within a ProductMediaProvider");
  }

  return context;
}