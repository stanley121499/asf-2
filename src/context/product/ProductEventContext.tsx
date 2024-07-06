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

export type ProductEvent =
  Database["public"]["Tables"]["product_events"]["Row"] & {
    product: Database["public"]["Tables"]["products"]["Row"];
  };
export type ProductEvents = {
  productEvents: ProductEvent[];
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

const ProductEventContext = createContext<ProductEventContextProps>(undefined!);

export function ProductEventProvider({ children }: PropsWithChildren) {
  const [productEvents, setProductEvents] = useState<ProductEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    const fetchProductEvents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("product_events")
          .select("*, product:product_id(*)")
          .order("created_at", { ascending: false });
        if (error) {
          showAlert(error.message, "error");
          console.error(error);
        }
        setProductEvents(data || []);
        setLoading(false);
      } catch (error) {
        showAlert("An error occurred while fetching product events", "error");
      }
    };

    fetchProductEvents();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setProductEvents((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setProductEvents((prev) =>
          prev.map((productEvent) =>
            productEvent.id === payload.new.id ? payload.new : productEvent
          )
        );
      }

      if (payload.eventType === "DELETE") {
        setProductEvents((prev) =>
          prev.filter((productEvent) => productEvent.id !== payload.old.id)
        );
      }
    };

    const subscription = supabase
      .channel("product_events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_events" },
        (payload) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createProductEvent = async (productEvent: ProductEventInsert) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("product_events")
        .insert([productEvent])
        .single();
      if (error) {
        showAlert(error.message, "error");
        console.error(error);
      }
      if (data) {
        return data;
      }
      setLoading(false);
    } catch (error) {
      showAlert("An error occurred while creating product event", "error");
    }
  };

  const updateProductEvent = async (productEvent: ProductEventUpdate) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("product_events")
        .update(productEvent)
        .eq("id", productEvent.id);
      if (error) {
        showAlert(error.message, "error");
        console.error(error);
      }
      setLoading(false);
    } catch (error) {
      showAlert("An error occurred while updating product event", "error");
    }
  };

  const deleteProductEvent = async (productEventId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("product_events")
        .delete()
        .eq("id", productEventId);
      if (error) {
        showAlert(error.message, "error");
        console.error(error);
      }
      setLoading(false);
    } catch (error) {
      showAlert("An error occurred while deleting product event", "error");
    }
  };
  return (
    <ProductEventContext.Provider
      value={{
        productEvents,
        createProductEvent,
        updateProductEvent,
        deleteProductEvent,
        loading,
      }}>
      {children}
    </ProductEventContext.Provider>
  );
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
