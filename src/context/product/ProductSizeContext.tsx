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
import { restoreById, softDeleteById } from "../../utils/softDelete";
import { isSoftDeletedRow } from "../../utils/softDeleteRuntime";

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
  const [productSizes, setProductSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(true);
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
   * Fetch all product sizes from Supabase.
   */
  const fetchProductSizes = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_sizes")
        .select("*");

      if (error) {
        showAlertRef.current?.(error.message, "error");
        return;
      }

      setProductSizes((data ?? []).filter((s) => !isSoftDeletedRow(s)));
    } catch (error: unknown) {
      console.error("Failed to fetch product sizes:", error);
      showAlertRef.current?.("Failed to fetch product sizes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Realtime handler for product size changes.
   */
  const handleRealtimeChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ProductSize>): void => {
      if (payload.eventType === "INSERT") {
        if (isSoftDeletedRow(payload.new)) {
          return;
        }
        setProductSizes((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        if (isSoftDeletedRow(payload.new)) {
          setProductSizes((prev) => prev.filter((s) => s.id !== payload.new.id));
          return;
        }

        setProductSizes((prev) =>
          prev.map((productSize) => (productSize.id === payload.new.id ? payload.new : productSize))
        );
      }

      if (payload.eventType === "DELETE") {
        setProductSizes((prev) => prev.filter((productSize) => productSize.id !== payload.old.id));
      }
    },
    []
  );

  /**
   * Fetch once on mount and subscribe to realtime changes.
   */
  useEffect(() => {
    void fetchProductSizes();

    const subscription = supabase
      .channel("product_sizes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_sizes" },
        (payload: RealtimePostgresChangesPayload<ProductSize>) => {
          handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProductSizes, handleRealtimeChanges]);

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