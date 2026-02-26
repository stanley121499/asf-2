import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { supabase, supabaseAdmin } from "../utils/supabaseClient";
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

/**
 * Runtime helper: type guard for plain objects.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Runtime helper: safely extracts the joined `order` object and its `user_id`.
 */
function getOrderUserId(payment: unknown): string | null {
  if (!isRecord(payment)) return null;
  const orderValue = payment["order"];
  if (!isRecord(orderValue)) return null;
  const userId = orderValue["user_id"];
  return typeof userId === "string" ? userId : null;
}

/**
 * Runtime helper: sums `order.order_items[].amount` if present.
 */
function getOrderItemsAmountSum(payment: unknown): number {
  if (!isRecord(payment)) return 0;
  const orderValue = payment["order"];
  if (!isRecord(orderValue)) return 0;
  const itemsValue = orderValue["order_items"];
  if (!Array.isArray(itemsValue)) return 0;

  return itemsValue.reduce((sum: number, item: unknown) => {
    if (!isRecord(item)) return sum;
    const amount = item["amount"];
    return typeof amount === "number" && Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
}

/**
 * Runtime helper: extracts payment_events if present.
 */
function getPaymentEvents(payment: unknown): PaymentEventRow[] {
  if (!isRecord(payment)) return [];
  const eventsValue = payment["payment_events"];
  if (!Array.isArray(eventsValue)) return [];
  // Supabase select join typing is not available here; we keep it safe via a narrow assertion.
  return eventsValue as PaymentEventRow[];
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
  const fetchPayments = useCallback(async (): Promise<void> => {
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

      const rawPayments: unknown[] = Array.isArray(paymentsData) ? (paymentsData as unknown[]) : [];

      // Get unique user IDs for fetching user details
      const userIds = Array.from(new Set(rawPayments.map(getOrderUserId).filter((v): v is string => typeof v === "string")));

      // Fetch user details if there are any user IDs
      let usersData: { id: string; email?: string }[] = [];
      if (userIds.length > 0) {
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) {
          console.error("Error fetching auth users:", authError);
        } else {
          usersData =
            (authUsers?.users ?? []).map((u) => ({
              id: u.id,
              email: u.email ?? undefined,
            })) ?? [];
        }
      }

      // Enrich payments with user details and computed fields
      const enrichedPayments: PaymentWithDetails[] = rawPayments
        .map((payment): PaymentWithDetails | null => {
          if (!isRecord(payment) || typeof payment["id"] !== "string") {
            return null;
          }

          const userId = getOrderUserId(payment);
          const orderItemsCount = getOrderItemsAmountSum(payment);

          // Find user details
          const user = typeof userId === "string" ? usersData.find((u) => u.id === userId) : undefined;
          const email = typeof user?.email === "string" ? user.email : "";
          const userName = email.includes("@") ? email.split("@")[0] : "Unknown User";

          return {
            ...(payment as PaymentRow),
            user_name: userName,
            user_email: email,
            order_items_count: orderItemsCount,
            payment_events: getPaymentEvents(payment),
          };
        })
        .filter((p): p is PaymentWithDetails => p !== null);

      setPayments(enrichedPayments);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showAlert(message, "error");
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Refresh payments data
   */
  const refreshPayments = useCallback(async (): Promise<void> => {
    await fetchPayments();
  }, [fetchPayments]);

  /**
   * Update payment status
   */
  const updatePaymentStatus = useCallback(async (
    paymentId: string,
    newStatus: Database["public"]["Enums"]["payment_status"]
  ): Promise<boolean> => {
    try {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from("payments")
        .update({
          status: newStatus,
          updated_at: updatedAt,
        })
        .eq("id", paymentId);

      if (error) {
        throw error;
      }

      // Update local state
      setPayments((prev) => prev.map((payment) =>
        payment.id === paymentId
          ? { ...payment, status: newStatus, updated_at: updatedAt }
          : payment
      ));

      showAlert("Payment status updated successfully", "success");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update payment status";
      showAlert(message, "error");
      return false;
    }
  }, [showAlert]);

  /**
   * Update refund status and amount
   */
  const updateRefundStatus = useCallback(async (
    paymentId: string,
    newRefundStatus: Database["public"]["Enums"]["refund_status"],
    refundedAmount: number
  ): Promise<boolean> => {
    try {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from("payments")
        .update({
          refund_status: newRefundStatus,
          refunded_amount: refundedAmount,
          updated_at: updatedAt,
        })
        .eq("id", paymentId);

      if (error) {
        throw error;
      }

      // Update local state
      setPayments((prev) => prev.map((payment) =>
        payment.id === paymentId
          ? {
            ...payment,
            refund_status: newRefundStatus,
            refunded_amount: refundedAmount,
            updated_at: updatedAt,
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
  }, [showAlert]);

  /**
   * Initialize data on mount.
   */
  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  /**
   * Realtime handler for payments table changes.
   */
  const handlePaymentChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<PaymentRow>): void => {
      if (payload.eventType === "INSERT") {
        // For new payments, we need to fetch full details including user info
        void refreshPayments();
      } else if (payload.eventType === "UPDATE") {
        const updatedPayment = payload.new as PaymentRow;
        setPayments((prev) => prev.map((payment) =>
          payment.id === updatedPayment.id
            ? { ...payment, ...updatedPayment }
            : payment
        ));
      } else if (payload.eventType === "DELETE") {
        const deletedPayment = payload.old as PaymentRow;
        setPayments((prev) => prev.filter((payment) => payment.id !== deletedPayment.id));
      }
    },
    [refreshPayments]
  );

  // Set up real-time subscriptions
  useEffect(() => {
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
  }, [handlePaymentChanges]);

  const value = useMemo<PaymentContextProps>(
    () => ({
      payments,
      loading,
      refreshPayments,
      updatePaymentStatus,
      updateRefundStatus
    }),
    [payments, loading, refreshPayments, updatePaymentStatus, updateRefundStatus]
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
