import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "../AlertContext";

// Type aliases bound to Supabase generated types
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
export type ProductStockRow = Database["public"]["Tables"]["product_stock"]["Row"];
export type ProductStockUpdate = Database["public"]["Tables"]["product_stock"]["Update"];
export type ProductStockLogInsert = Database["public"]["Tables"]["product_stock_logs"]["Insert"];

export interface CartLineInput {
  id: string; // product_id
  price: number;
  quantity: number;
  color_id?: string | null;
  size_id?: string | null;
}

interface OrderContextProps {
  orders: OrderRow[];
  createOrderWithItemsAndStock: (
    payload: {
      userId: string;
      shippingAddress: string | null;
      totalAmount: number;
      discountType?: string | null;
      discountedAmount?: number | null;
      pointsEarned?: number | null;
      pointsSpent?: number | null;
    },
    items: CartLineInput[]
  ) => Promise<{ order: OrderRow; orderItems: OrderItemRow[] } | undefined>;
  updateOrderStatus: (orderId: string, newStatus: string, changedBy?: string) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
  loading: boolean;
}

const OrderContext = createContext<OrderContextProps | undefined>(undefined);

/**
 * OrderProvider
 *
 * Provides an API to create and list orders. On creation, it persists the order,
 * inserts order items, decrements product stock appropriately (by product/color/size),
 * and appends a product stock log entry per decremented stock movement.
 */
export const OrderProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert } = useAlertContext();

  /**
   * Fetch orders from database
   */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        throw error;
      }
      setOrders(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showAlert(message, "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh orders data
   */
  const refreshOrders = async () => {
    await fetchOrders();
  };

  useEffect(() => {
    let isMounted = true;
    const loadOrders = async () => {
      await fetchOrders();
    };
    
    if (isMounted) {
      loadOrders();
    }
    
    return () => {
      isMounted = false;
    };
  }, [showAlert]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * createOrderWithItemsAndStock
   *
   * Creates an order and its items, then updates product stock and logs movements.
   * Performs defensive checks and reports errors through the global alert system.
   */
  const createOrderWithItemsAndStock = async (
    payload: {
      userId: string;
      shippingAddress: string | null;
      totalAmount: number;
      discountType?: string | null;
      discountedAmount?: number | null;
      pointsEarned?: number | null;
      pointsSpent?: number | null;
    },
    items: CartLineInput[]
  ): Promise<{ order: OrderRow; orderItems: OrderItemRow[] } | undefined> => {
    try {
      if (items.length === 0) {
        showAlert("Cart is empty.", "error");
        return undefined;
      }

      // 1) Insert order
      const orderInsert: OrderInsert = {
        user_id: payload.userId,
        shipping_address: payload.shippingAddress,
        total_amount: payload.totalAmount,
        discount_type: payload.discountType ?? null,
        discounted_amount: payload.discountedAmount ?? null,
        points_earned: payload.pointsEarned ?? null,
        points_spent: payload.pointsSpent ?? null,
      };
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert(orderInsert)
        .select("*")
        .single();
      if (orderError || !orderData) {
        throw new Error(orderError?.message || "Failed to create order");
      }

      // 2) Insert order items
      const orderItemsInsert: OrderItemInsert[] = items.map((line) => ({
        product_id: line.id,
        order_id: orderData.id,
        amount: line.quantity,
        color_id: line.color_id ?? null,
        size_id: line.size_id ?? null,
      }));

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsInsert)
        .select("*");
      if (itemsError || !itemsData) {
        throw new Error(itemsError?.message || "Failed to create order items");
      }

      // 3) Decrement product_stock and create product_stock_logs
      for (const line of items) {
        // locate product_stock row by product_id + optional color/size
        let stockQuery = supabase
          .from("product_stock")
          .select("*")
          .eq("product_id", line.id);

        if (line.color_id === undefined || line.color_id === null) {
          stockQuery = stockQuery.is("color_id", null);
        } else {
          stockQuery = stockQuery.eq("color_id", line.color_id);
        }

        if (line.size_id === undefined || line.size_id === null) {
          stockQuery = stockQuery.is("size_id", null);
        } else {
          stockQuery = stockQuery.eq("size_id", line.size_id);
        }

        const { data: stockRows, error: stockFetchError } = await stockQuery.limit(1);
        if (stockFetchError) {
          throw new Error(stockFetchError.message);
        }

        let stockRow: ProductStockRow | undefined = stockRows?.[0];
        if (!stockRow) {
          // Create a stock row if none exists (default count: 0)
          const { data: createdStock, error: insertErr } = await supabase
            .from("product_stock")
            .insert({
              product_id: line.id,
              color_id: line.color_id ?? null,
              size_id: line.size_id ?? null,
              count: 0,
            })
            .select("*")
            .single();
          if (insertErr || !createdStock) {
            throw new Error(insertErr?.message || "Failed to initialize product stock");
          }
          stockRow = createdStock;
        }

        const currentCount = typeof stockRow.count === "number" ? stockRow.count : 0;
        const newCount = Math.max(0, currentCount - line.quantity);

        const stockUpdate: ProductStockUpdate = {
          id: stockRow.id,
          count: newCount,
        };
        const { error: updErr } = await supabase
          .from("product_stock")
          .update(stockUpdate)
          .eq("id", stockRow.id);
        if (updErr) {
          throw new Error(updErr.message);
        }

        const logInsert: ProductStockLogInsert = {
          product_stock_id: stockRow.id,
          amount: line.quantity,
          type: "decrement",
        };
        const { error: logErr } = await supabase
          .from("product_stock_logs")
          .insert(logInsert)
          .select()
          .single();
        if (logErr) {
          throw new Error(logErr.message);
        }
      }

      setOrders((prev) => [orderData, ...prev]);
      return { order: orderData, orderItems: itemsData as OrderItemRow[] };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showAlert(message, "error");
      return undefined;
    }
  };

  /**
   * Update order status and log the change
   * @param orderId - Order ID to update
   * @param newStatus - New status value
   * @param changedBy - User ID of who made the change (optional)
   * @returns Promise<boolean> - Success status
   */
  const updateOrderStatus = async (
    orderId: string, 
    newStatus: string, 
    changedBy?: string
  ): Promise<boolean> => {
    try {
      // Get current order to track old status
      const currentOrder = orders.find(o => o.id === orderId);
      if (!currentOrder) {
        showAlert("Order not found", "error");
        return false;
      }

      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // TODO: Log status change once order_status_logs table is available
      // For now, just log to console
      console.log("Status change:", {
        order_id: orderId,
        old_status: currentOrder.status,
        new_status: newStatus,
        changed_by: changedBy || "admin",
        user_id: currentOrder.user_id,
      });

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));

      showAlert("Order status updated successfully", "success");
      return true;

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update order status";
      showAlert(message, "error");
      return false;
    }
  };

  const value = useMemo<OrderContextProps>(
    () => ({ 
      orders, 
      createOrderWithItemsAndStock, 
      updateOrderStatus, 
      refreshOrders, 
      loading 
    }),
    [orders, loading] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrderContext = (): OrderContextProps => {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useOrderContext must be used within an OrderProvider");
  }
  return ctx;
};


