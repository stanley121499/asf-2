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
// import { useProductContext } from "./ProductContext";

export type ProductPurchaseOrder =
  Database["public"]["Tables"]["product_purchase_orders"]["Row"] & {
    items: any[];
  }
export type ProductPurchaseOrders = {
  product_purchase_orders: ProductPurchaseOrder[];
};
export type ProductPurchaseOrderInsert =
  Database["public"]["Tables"]["product_purchase_orders"]["Insert"];
export type ProductPurchaseOrderUpdate =
  Database["public"]["Tables"]["product_purchase_orders"]["Update"];

export type ProductPurchaseOrderEntry =
  Database["public"]["Tables"]["product_purchase_order_entries"]["Row"];
export type ProductPurchaseOrderEntries = {
  product_purchase_order_entries: ProductPurchaseOrderEntry[];
};
export type ProductPurchaseOrderEntryInsert =
  Database["public"]["Tables"]["product_purchase_order_entries"]["Insert"];
export type ProductPurchaseOrderEntryUpdate =
  Database["public"]["Tables"]["product_purchase_order_entries"]["Update"];

interface ProductPurchaseOrderContextProps {
  product_purchase_orders: ProductPurchaseOrder[];
  createProductPurchaseOrder: (
    product_purchase_order: ProductPurchaseOrderInsert,
    product_purchase_order_entries: any[]
  ) => Promise<ProductPurchaseOrder | undefined>;
  updateProductPurchaseOrder: (
    product_purchase_order: ProductPurchaseOrderUpdate
  ) => Promise<void>;
  deleteProductPurchaseOrder: (
    product_purchase_orderId: string
  ) => Promise<void>;
  loading: boolean;
}

const ProductPurchaseOrderContext =
  createContext<ProductPurchaseOrderContextProps>(undefined!);

export function ProductPurchaseOrderProvider({ children }: PropsWithChildren) {
  const [product_purchase_orders, setProductPurchaseOrders] = useState<
    ProductPurchaseOrder[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  // const { products } = useProductContext();

  useEffect(() => {
    setLoading(true);
    const fetchProductPurchaseOrders = async () => {
      const { data, error } = await supabase.rpc("fetch_purchase_orders");

      if (error) {
        showAlert(error.message, "error");
        console.error(error);
      } else {
        setProductPurchaseOrders(data!);
        setLoading(false);
      }
    };

    fetchProductPurchaseOrders();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setProductPurchaseOrders([...product_purchase_orders, payload.new]);
      } else if (payload.eventType === "UPDATE") {
        const updatedProductPurchaseOrders = product_purchase_orders.map(
          (product_purchase_order) =>
            product_purchase_order.id === payload.new.id
              ? payload.new
              : product_purchase_order
        );
        setProductPurchaseOrders(updatedProductPurchaseOrders);
      } else if (payload.eventType === "DELETE") {
        const updatedProductPurchaseOrders = product_purchase_orders.filter(
          (product_purchase_order) =>
            product_purchase_order.id !== payload.old.id
        );
        setProductPurchaseOrders(updatedProductPurchaseOrders);
      }
    };

    const subscription = supabase
      .channel("product_purchase_orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_purchase_orders" },
        (payload) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  async function createProductPurchaseOrder(
    product_purchase_order: ProductPurchaseOrderInsert,
    product_purchase_order_entries: any[]
  ) {
    console.log(product_purchase_order_entries)
    console.log(product_purchase_order)
    const { data, error } = await supabase
      .from("product_purchase_orders")
      .insert(product_purchase_order)
      .select("*")
      .single();

    if (error) {
      console.error(error);
      showAlert(error.message, "error");
    } else {
      const newProductPurchaseOrder = data as ProductPurchaseOrder;
      const newProductPurchaseOrderEntries = product_purchase_order_entries.map(
        (product_purchase_order_entry) => ({
          ...product_purchase_order_entry,
          product_purchase_order_id: newProductPurchaseOrder.id,
        })
      );
      const entries: ProductPurchaseOrderEntryInsert[] = [];
      // loop through the entries and split the sizes
      // as the sizes in the params is in the format of [{size: "size_id", quantity: "quantity"}]
      // we need to split them into individual entries
      newProductPurchaseOrderEntries.forEach((entry) => {
        const { sizes, ...rest } = entry;
        sizes.forEach((size: any) => {
          entries.push({
            ...rest,
            size_id: size.size,
            quantity: size.quantity,
          });
        });
      });

      const { error: entriesError } = await supabase
        .from("product_purchase_order_entries")
        .insert(entries);

      if (entriesError) {
        showAlert(entriesError.message, "error");
        console.log(entriesError);
        return;
      }

      showAlert("Product purchase order created", "success");
      return newProductPurchaseOrder;
    }
  }

  async function updateProductPurchaseOrder(
    product_purchase_order: ProductPurchaseOrderUpdate
  ) {
    const { error } = await supabase
      .from("product_purchase_orders")
      .update(product_purchase_order)
      .eq("id", product_purchase_order.id)
      .single();

    if (error) {
      showAlert(error.message, "error");
    } else {
      showAlert("Product purchase order updated", "success");
    }
  }

  async function deleteProductPurchaseOrder(product_purchase_orderId: string) {
    const { error } = await supabase
      .from("product_purchase_orders")
      .delete()
      .eq("id", product_purchase_orderId);

    if (error) {
      showAlert(error.message, "error");
    } else {
      const updatedProductPurchaseOrders = product_purchase_orders.filter(
        (product_purchase_order) =>
          product_purchase_order.id !== product_purchase_orderId
      );
      setProductPurchaseOrders(updatedProductPurchaseOrders);
      showAlert("Product purchase order deleted", "success");
    }
  }

  return (
    <ProductPurchaseOrderContext.Provider
      value={{
        product_purchase_orders,
        createProductPurchaseOrder,
        updateProductPurchaseOrder,
        deleteProductPurchaseOrder,
        loading,
      }}>
      {children}
    </ProductPurchaseOrderContext.Provider>
  );
}

export function useProductPurchaseOrderContext() {
  const context = useContext(ProductPurchaseOrderContext);

  if (!context) {
    throw new Error(
      "useProductPurchaseOrderContext must be used within a ProductPurchaseOrderProvider"
    );
  }

  return context;
}
