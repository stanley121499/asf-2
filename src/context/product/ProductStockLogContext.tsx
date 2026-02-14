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

type ProductStockLogRow = Database["public"]["Tables"]["product_stock_logs"]["Row"];
type ProductStockRow = Database["public"]["Tables"]["product_stock"]["Row"];

/** Product stock log row with its related product_stock row attached. */
export type ProductStockLog = ProductStockLogRow & {
  product_stock: ProductStockRow;
};
export type ProductStockLogInsert =
  Database["public"]["Tables"]["product_stock_logs"]["Insert"];
export type ProductStockLogUpdate =
  Database["public"]["Tables"]["product_stock_logs"]["Update"];

interface ProductStockLogContextProps {
  productStockLogs: ProductStockLog[];
  createProductStockLog: (
    productStockLog: ProductStockLogInsert
  ) => Promise<ProductStockLog | undefined>;
  updateProductStockLog: (
    productStockLog: ProductStockLogUpdate
  ) => Promise<void>;
  deleteProductStockLog: (productStockLogId: string) => Promise<void>;
  loading: boolean;
}

const ProductStockLogContext = createContext<ProductStockLogContextProps | undefined>(undefined);

export function ProductStockLogProvider({ children }: PropsWithChildren) {
  const [productStockLogs, setProductStockLogs] = useState<ProductStockLog[]>([]);
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
   * Fetch product stock logs and attach their product_stock rows (bulk join done client-side for strict typing).
   */
  const fetchProductStockLogs = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // Step 1: Fetch logs as strictly typed rows.
      const { data: logRows, error: logError } = await supabase
        .from("product_stock_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (logError) {
        showAlertRef.current?.(logError.message, "error");
        console.error(logError);
        return;
      }

      const logs: ProductStockLogRow[] = logRows ?? [];
      const stockIds = Array.from(new Set(logs.map((l) => l.product_stock_id))).filter(
        (id) => id.trim().length > 0
      );

      // Step 2: Fetch referenced stock rows in a single query.
      let stockById: Record<string, ProductStockRow> = {};
      if (stockIds.length > 0) {
        const { data: stocks, error: stockError } = await supabase
          .from("product_stock")
          .select("*")
          .in("id", stockIds);

        if (stockError) {
          showAlertRef.current?.(stockError.message, "error");
          console.error(stockError);
        }

        if (stocks) {
          stockById = Object.fromEntries(stocks.map((s) => [s.id, s]));
        }
      }

      // Step 3: Attach stock rows; drop logs that reference missing stock ids.
      const mapped: ProductStockLog[] = logs.flatMap((log) => {
        const stock = stockById[log.product_stock_id];
        if (!stock) {
          return [];
        }
        return [{ ...log, product_stock: stock }];
      });

      setProductStockLogs(mapped);
    } catch (error: unknown) {
      console.error("Failed to fetch product stock logs:", error);
      showAlertRef.current?.("Failed to fetch product stock logs", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handles realtime changes for product_stock_logs.\n   *
   * INSERT/UPDATE require us to ensure `product_stock` is attached; we do that with a targeted fetch.\n   */
  const handleRealtimeChanges = useCallback(
    async (
      payload: RealtimePostgresChangesPayload<ProductStockLogRow>
    ): Promise<void> => {
      if (payload.eventType === "INSERT") {
        const { data: stock, error } = await supabase
          .from("product_stock")
          .select("*")
          .eq("id", payload.new.product_stock_id)
          .single();

        if (error) {
          showAlertRef.current?.(error.message, "error");
          console.error(error);
          return;
        }

        if (!stock) {
          showAlertRef.current?.("Missing product stock row for new log.", "error");
          return;
        }

        const inserted: ProductStockLog = { ...payload.new, product_stock: stock };
        setProductStockLogs((prev) => [inserted, ...prev]);
        return;
      }

      if (payload.eventType === "UPDATE") {
        setProductStockLogs((prev) =>
          prev.map((existing) => {
            if (existing.id !== payload.new.id) {
              return existing;
            }
            // Preserve the attached product_stock row; overwrite only log fields.
            return { ...existing, ...payload.new };
          })
        );
        return;
      }

      if (payload.eventType === "DELETE") {
        setProductStockLogs((prev) => prev.filter((p) => p.id !== payload.old.id));
      }
    },
    []
  );

  /**
   * Initial fetch + realtime subscription.
   */
  useEffect(() => {
    void fetchProductStockLogs();

    const subscription = supabase
      .channel("product_stock_logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_stock_logs" },
        (payload: RealtimePostgresChangesPayload<ProductStockLogRow>) => {
          void handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProductStockLogs, handleRealtimeChanges]);

  /**
   * Create a product stock log.\n   *
   * @param productStockLog - Insert payload.\n   * @returns Created log with attached product_stock, or undefined on error.\n   */
  const createProductStockLog = useCallback(
    async (productStockLog: ProductStockLogInsert): Promise<ProductStockLog | undefined> => {
      try {
        const { data: created, error } = await supabase
          .from("product_stock_logs")
          .insert(productStockLog)
          .select("*")
          .single();

        if (error) {
          showAlertRef.current?.(error.message, "error");
          console.error(error);
          return undefined;
        }

        if (!created) {
          showAlertRef.current?.("Product stock log creation returned no created row.", "error");
          return undefined;
        }

        const { data: stock, error: stockError } = await supabase
          .from("product_stock")
          .select("*")
          .eq("id", created.product_stock_id)
          .single();

        if (stockError) {
          showAlertRef.current?.(stockError.message, "error");
          console.error(stockError);
          return undefined;
        }

        if (!stock) {
          showAlertRef.current?.("Missing product stock row for created log.", "error");
          return undefined;
        }

        return { ...created, product_stock: stock };
      } catch (error: unknown) {
        console.error("Failed to create product stock log:", error);
        showAlertRef.current?.("Failed to create product stock log", "error");
        return undefined;
      }
    },
    []
  );

  /**
   * Update a product stock log row.\n   *
   * @param productStockLog - Update payload; must include `id`.\n   */
  const updateProductStockLog = useCallback(async (productStockLog: ProductStockLogUpdate): Promise<void> => {
    const id = productStockLog.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      showAlertRef.current?.("Missing product stock log id for update.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_stock_logs").update(productStockLog).eq("id", id);
      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
      }
    } catch (error: unknown) {
      console.error("Failed to update product stock log:", error);
      showAlertRef.current?.("Failed to update product stock log", "error");
    }
  }, []);

  /**
   * Delete a product stock log by id.\n   *
   * @param productStockLogId - Log id to delete.\n   */
  const deleteProductStockLog = useCallback(async (productStockLogId: string): Promise<void> => {
    if (productStockLogId.trim().length === 0) {
      showAlertRef.current?.("Product stock log id is required to delete.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_stock_logs").delete().eq("id", productStockLogId);
      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
      }
    } catch (error: unknown) {
      console.error("Failed to delete product stock log:", error);
      showAlertRef.current?.("Failed to delete product stock log", "error");
    }
  }, []);

  const value = useMemo<ProductStockLogContextProps>(
    () => ({
      productStockLogs,
      createProductStockLog,
      updateProductStockLog,
      deleteProductStockLog,
      loading,
    }),
    [productStockLogs, createProductStockLog, updateProductStockLog, deleteProductStockLog, loading]
  );

  return (
    <ProductStockLogContext.Provider
      value={value}>
      {children}
    </ProductStockLogContext.Provider>
  );
}

export const useProductStockLogContext = () => {
  const context = useContext(ProductStockLogContext);
  if (!context) {
    throw new Error(
      "useProductStockLogContext must be used within a ProductStockLogProvider"
    );
  }
  return context;
};
