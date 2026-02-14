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

/** Product stock row type from Supabase. */
export type ProductStock = Database["public"]["Tables"]["product_stock"]["Row"];
export type ProductStockInsert =
  Database["public"]["Tables"]["product_stock"]["Insert"];
export type ProductStockUpdate =
  Database["public"]["Tables"]["product_stock"]["Update"];

interface ProductStockContextProps {
  productStocks: ProductStock[];
  createProductStock: (
    productStock: ProductStockInsert
  ) => Promise<ProductStock | undefined>;
  updateProductStock: (
    productStock: ProductStockUpdate
  ) => Promise<void>;
  deleteProductStock: (productStockId: string) => Promise<void>;
  loading: boolean;
}

const ProductStockContext = createContext<ProductStockContextProps | undefined>(undefined);

export function ProductStockProvider({ children }: PropsWithChildren) {
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
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
   * Fetch product stock rows from Supabase.
   */
  const fetchProductStocks = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_stock")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
        return;
      }

      setProductStocks(data ?? []);
    } catch (error: unknown) {
      console.error("Failed to fetch product stock:", error);
      showAlertRef.current?.("Failed to fetch product stock", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Realtime handler for product stock changes.
   */
  const handleRealtimeChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ProductStock>): void => {
      if (payload.eventType === "INSERT") {
        setProductStocks((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setProductStocks((prev) =>
          prev.map((row) => (row.id === payload.new.id ? payload.new : row))
        );
      }

      if (payload.eventType === "DELETE") {
        setProductStocks((prev) => prev.filter((row) => row.id !== payload.old.id));
      }
    },
    []
  );

  /**
   * Initial fetch + realtime subscription.
   */
  useEffect(() => {
    void fetchProductStocks();

    const subscription = supabase
      .channel("product_stock")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_stock" },
        (payload: RealtimePostgresChangesPayload<ProductStock>) => {
          handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProductStocks, handleRealtimeChanges]);

  /**
   * Create a product stock row.\n   *
   * NOTE: List updates are handled by realtime subscriptions.\n   *
   * @param productStock - Insert payload for `product_stock`.\n   * @returns The created row, or undefined on error.\n   */
  const createProductStock = useCallback(
    async (productStock: ProductStockInsert): Promise<ProductStock | undefined> => {
      try {
        const { data, error } = await supabase
          .from("product_stock")
          .insert(productStock)
          .select("*")
          .single();

        if (error) {
          showAlertRef.current?.(error.message, "error");
          console.error(error);
          return undefined;
        }

        return data ?? undefined;
      } catch (error: unknown) {
        console.error("Failed to create product stock:", error);
        showAlertRef.current?.("Failed to create product stock", "error");
        return undefined;
      }
    },
    []
  );

  /**
   * Update a product stock row.\n   *
   * @param productStock - Update payload; must include `id`.\n   */
  const updateProductStock = useCallback(async (productStock: ProductStockUpdate): Promise<void> => {
    const id = productStock.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      showAlertRef.current?.("Missing product stock id for update.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_stock").update(productStock).eq("id", id);
      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
      }
    } catch (error: unknown) {
      console.error("Failed to update product stock:", error);
      showAlertRef.current?.("Failed to update product stock", "error");
    }
  }, []);

  /**
   * Delete a product stock row by id.\n   *
   * @param productStockId - Stock id to delete.\n   */
  const deleteProductStock = useCallback(async (productStockId: string): Promise<void> => {
    if (productStockId.trim().length === 0) {
      showAlertRef.current?.("Product stock id is required to delete.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_stock").delete().eq("id", productStockId);
      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
      }
    } catch (error: unknown) {
      console.error("Failed to delete product stock:", error);
      showAlertRef.current?.("Failed to delete product stock", "error");
    }
  }, []);

  const value = useMemo<ProductStockContextProps>(
    () => ({
      productStocks,
      createProductStock,
      updateProductStock,
      deleteProductStock,
      loading,
    }),
    [productStocks, createProductStock, updateProductStock, deleteProductStock, loading]
  );

  return (
    <ProductStockContext.Provider value={value}>{children}</ProductStockContext.Provider>
  );
}

export const useProductStockContext = (): ProductStockContextProps => {
  const context = useContext(ProductStockContext);
  if (!context) {
    throw new Error(
      "useProductStockContext must be used within a ProductStockProvider"
    );
  }
  return context;
};
