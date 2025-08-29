import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Type aliases bound to Supabase generated types
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
export type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];
export type PaymentEventRow = Database["public"]["Tables"]["payment_events"]["Row"];

/**
 * Extended payment type with additional computed fields for display
 */
export interface PaymentWithDetails extends PaymentRow {
  user_name?: string;
  user_email?: string;
  order_items_count?: number;
  payment_events?: PaymentEventRow[];
}

interface PaymentContextProps {
  payments: PaymentWithDetails[];
  loading: boolean;
  refreshPayments: () => Promise<void>;
  updatePaymentStatus: (paymentId: string, newStatus: Database["public"]["Enums"]["payment_status"]) => Promise<boolean>;
  updateRefundStatus: (paymentId: string, newRefundStatus: Database["public"]["Enums"]["refund_status"], refundedAmount: number) => Promise<boolean>;
}

const PaymentContext = createContext<PaymentContextProps | undefined>(undefined);

/**
 * PaymentProvider
 *
 * Provides comprehensive payment management functionality including:
 * - Fetching payments with user details and order information
 * - Real-time updates via Supabase subscriptions
 * - Payment status management
 * - Refund handling
 */
export const PaymentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert } = useAlertContext();

  /**
   * Fetch payments with enriched data including user details and order information
   */
  const fetchPayments = async () => {
    try {
      setLoading(true);

      // Fetch payments with order details
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          *,
          payment_events(*),
          order:orders(
            id,
            user_id,
            order_items(
              id,
              amount
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (paymentsError) {
        throw paymentsError;
      }

      if (!paymentsData) {
        setPayments([]);
        return;
      }

      // Get unique user IDs for fetching user details
      const userIds = Array.from(
        new Set(
          paymentsData
            .map(payment => (payment as any).order?.user_id)
            .filter(Boolean)
        )
      );

      // Fetch user details if there are any user IDs
      let usersData: any[] = [];
      if (userIds.length > 0) {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
          console.error("Error fetching auth users:", authError);
        } else {
          usersData = authUsers?.users || [];
        }
      }

      // Enrich payments with user details and computed fields
      const enrichedPayments: PaymentWithDetails[] = paymentsData.map(payment => {
        const orderData = (payment as any).order;
        const orderItemsCount = orderData?.order_items?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0), 
          0
        ) || 0;

        // Find user details
        const user = usersData.find(u => u.id === orderData?.user_id);
        const userName = user?.email?.split("@")[0] || "Unknown User";
        const userEmail = user?.email || "";

        return {
          ...payment,
          user_name: userName,
          user_email: userEmail,
          order_items_count: orderItemsCount,
          payment_events: (payment as any).payment_events || [],
        };
      });

      setPayments(enrichedPayments);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showAlert(message, "error");
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh payments data
   */
  const refreshPayments = async () => {
    await fetchPayments();
  };

  /**
   * Update payment status
   */
  const updatePaymentStatus = async (
    paymentId: string, 
    newStatus: Database["public"]["Enums"]["payment_status"]
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", paymentId);

      if (error) {
        throw error;
      }

      // Update local state
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: newStatus, updated_at: new Date().toISOString() }
          : payment
      ));

      showAlert("Payment status updated successfully", "success");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update payment status";
      showAlert(message, "error");
      return false;
    }
  };

  /**
   * Update refund status and amount
   */
  const updateRefundStatus = async (
    paymentId: string, 
    newRefundStatus: Database["public"]["Enums"]["refund_status"],
    refundedAmount: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ 
          refund_status: newRefundStatus,
          refunded_amount: refundedAmount,
          updated_at: new Date().toISOString()
        })
        .eq("id", paymentId);

      if (error) {
        throw error;
      }

      // Update local state
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { 
              ...payment, 
              refund_status: newRefundStatus, 
              refunded_amount: refundedAmount,
              updated_at: new Date().toISOString()
            }
          : payment
      ));

      showAlert("Refund status updated successfully", "success");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update refund status";
      showAlert(message, "error");
      return false;
    }
  };

  // Initialize data on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadPayments = async () => {
      if (isMounted) {
        await fetchPayments();
      }
    };
    
    loadPayments();
    
    return () => {
      isMounted = false;
    };
  }, [showAlert]);

  // Set up real-time subscriptions
  useEffect(() => {
    const handlePaymentChanges = (payload: RealtimePostgresChangesPayload<PaymentRow>) => {
      if (payload.eventType === "INSERT") {
        // For new payments, we need to fetch full details including user info
        refreshPayments();
      } else if (payload.eventType === "UPDATE") {
        const updatedPayment = payload.new as PaymentRow;
        setPayments(prev => prev.map(payment => 
          payment.id === updatedPayment.id 
            ? { ...payment, ...updatedPayment }
            : payment
        ));
      } else if (payload.eventType === "DELETE") {
        const deletedPayment = payload.old as PaymentRow;
        setPayments(prev => prev.filter(payment => payment.id !== deletedPayment.id));
      }
    };

    const subscription = supabase
      .channel("payments")
      .on(
        "postgres_changes", 
        { event: "*", schema: "public", table: "payments" }, 
        handlePaymentChanges
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<PaymentContextProps>(
    () => ({ 
      payments, 
      loading, 
      refreshPayments,
      updatePaymentStatus,
      updateRefundStatus
    }),
    [payments, loading]
  );

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};

export const usePaymentContext = (): PaymentContextProps => {
  const ctx = useContext(PaymentContext);
  if (!ctx) {
    throw new Error("usePaymentContext must be used within a PaymentProvider");
  }
  return ctx;
};
