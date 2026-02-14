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

export type ProductEvent =
  Database["public"]["Tables"]["product_events"]["Row"] & {
    product: Database["public"]["Tables"]["products"]["Row"];
  };
export type ProductEventInsert =
  Database["public"]["Tables"]["product_events"]["Insert"];
export type ProductEventUpdate =
  Database["public"]["Tables"]["product_events"]["Update"];

interface ProductEventContextProps {
  productEvents: ProductEvent[];
  createProductEvent: (
    productEvent: ProductEventInsert
  ) => Promise<ProductEvent | undefined>;
  updateProductEvent: (productEvent: ProductEventUpdate) => Promise<void>;
  deleteProductEvent: (productEventId: string) => Promise<void>;
  loading: boolean;
}

type ProductEventRow = Database["public"]["Tables"]["product_events"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const ProductEventContext = createContext<ProductEventContextProps | undefined>(undefined);

export function ProductEventProvider({ children }: PropsWithChildren) {
  const [productEvents, setProductEvents] = useState<ProductEvent[]>([]);
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
   * Fetch product events and attach their referenced products (bulk join done client-side for strict typing).
   */
  const fetchProductEvents = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data: eventRows, error: eventError } = await supabase
        .from("product_events")
        .select("*")
        .order("created_at", { ascending: false });

      if (eventError) {
        showAlertRef.current?.(eventError.message, "error");
        console.error(eventError);
        return;
      }

      const events: ProductEventRow[] = eventRows ?? [];
      const productIds = Array.from(new Set(events.map((e) => e.product_id))).filter(
        (id) => id.trim().length > 0
      );

      let productById: Record<string, ProductRow> = {};
      if (productIds.length > 0) {
        const { data: products, error: productError } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        if (productError) {
          showAlertRef.current?.(productError.message, "error");
          console.error(productError);
        }

        if (products) {
          productById = Object.fromEntries(products.map((p) => [p.id, p]));
        }
      }

      const mapped: ProductEvent[] = events.flatMap((event) => {
        const product = productById[event.product_id];
        if (!product) {
          return [];
        }
        return [{ ...event, product }];
      });

      setProductEvents(mapped);
    } catch (error: unknown) {
      console.error("Failed to fetch product events:", error);
      showAlertRef.current?.("Failed to fetch product events", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handles realtime changes for product events.\n   *
   * INSERT/UPDATE require us to ensure `product` is attached; we do that with a targeted fetch.\n   */
  const handleRealtimeChanges = useCallback(
    async (payload: RealtimePostgresChangesPayload<ProductEventRow>): Promise<void> => {
      if (payload.eventType === "INSERT") {
        const { data: product, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", payload.new.product_id)
          .single();

        if (error) {
          showAlertRef.current?.(error.message, "error");
          console.error(error);
          return;
        }

        if (!product) {
          showAlertRef.current?.("Missing product row for new event.", "error");
          return;
        }

        const inserted: ProductEvent = { ...payload.new, product };
        setProductEvents((prev) => [inserted, ...prev]);
        return;
      }

      if (payload.eventType === "UPDATE") {
        // If the product_id changed (or if we have no existing entry), fetch the product row again.
        const { data: product, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", payload.new.product_id)
          .single();

        if (error) {
          showAlertRef.current?.(error.message, "error");
          console.error(error);
          return;
        }

        if (!product) {
          showAlertRef.current?.("Missing product row for updated event.", "error");
          return;
        }

        const updated: ProductEvent = { ...payload.new, product };
        setProductEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        return;
      }

      if (payload.eventType === "DELETE") {
        setProductEvents((prev) => prev.filter((e) => e.id !== payload.old.id));
      }
    },
    []
  );

  /**
   * Initial fetch + realtime subscription.
   */
  useEffect(() => {
    void fetchProductEvents();

    const subscription = supabase
      .channel("product_events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_events" },
        (payload: RealtimePostgresChangesPayload<ProductEventRow>) => {
          void handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProductEvents, handleRealtimeChanges]);

  /**
   * Create a product event.\n   *
   * @param productEvent - Insert payload.\n   * @returns Created product event with attached product row, or undefined on error.\n   */
  const createProductEvent = useCallback(
    async (productEvent: ProductEventInsert): Promise<ProductEvent | undefined> => {
      try {
        const { data: created, error } = await supabase
          .from("product_events")
          .insert(productEvent)
          .select("*")
          .single();

        if (error) {
          showAlertRef.current?.(error.message, "error");
          console.error(error);
          return undefined;
        }

        if (!created) {
          showAlertRef.current?.("Product event creation returned no created row.", "error");
          return undefined;
        }

        const { data: product, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", created.product_id)
          .single();

        if (productError) {
          showAlertRef.current?.(productError.message, "error");
          console.error(productError);
          return undefined;
        }

        if (!product) {
          showAlertRef.current?.("Missing product row for created event.", "error");
          return undefined;
        }

        return { ...created, product };
      } catch (error: unknown) {
        console.error("Failed to create product event:", error);
        showAlertRef.current?.("Failed to create product event", "error");
        return undefined;
      }
    },
    []
  );

  /**
   * Update a product event.\n   *
   * @param productEvent - Update payload; must include `id`.\n   */
  const updateProductEvent = useCallback(async (productEvent: ProductEventUpdate): Promise<void> => {
    const id = productEvent.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      showAlertRef.current?.("Missing product event id for update.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_events").update(productEvent).eq("id", id);
      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
      }
    } catch (error: unknown) {
      console.error("Failed to update product event:", error);
      showAlertRef.current?.("Failed to update product event", "error");
    }
  }, []);

  /**
   * Delete a product event by id.\n   *
   * @param productEventId - Event id to delete.\n   */
  const deleteProductEvent = useCallback(async (productEventId: string): Promise<void> => {
    if (productEventId.trim().length === 0) {
      showAlertRef.current?.("Product event id is required to delete.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_events").delete().eq("id", productEventId);
      if (error) {
        showAlertRef.current?.(error.message, "error");
        console.error(error);
      }
    } catch (error: unknown) {
      console.error("Failed to delete product event:", error);
      showAlertRef.current?.("Failed to delete product event", "error");
    }
  }, []);

  const value = useMemo<ProductEventContextProps>(
    () => ({
      productEvents,
      createProductEvent,
      updateProductEvent,
      deleteProductEvent,
      loading,
    }),
    [productEvents, createProductEvent, updateProductEvent, deleteProductEvent, loading]
  );

  return <ProductEventContext.Provider value={value}>{children}</ProductEventContext.Provider>;
}

export function useProductEventContext() {
  const context = useContext(ProductEventContext);

  if (!context) {
    throw new Error(
      "useProductEventContext must be used within a ProductEventProvider"
    );
  }

  return context;
}
