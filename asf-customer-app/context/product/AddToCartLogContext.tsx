import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  PropsWithChildren,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";
import { useAlertContext } from "../AlertContext";

/**
 * Types for add_to_cart_logs table.
 */
export type AddToCartLog =
  Database["public"]["Tables"]["add_to_cart_logs"]["Row"];
export type AddToCartLogInsert =
  Database["public"]["Tables"]["add_to_cart_logs"]["Insert"];
export type AddToCartLogUpdate =
  Database["public"]["Tables"]["add_to_cart_logs"]["Update"];

interface AddToCartLogContextProps {
  /** Current in-memory list of logs (empty — customer app does not hydrate logs). */
  add_to_cart_logs: AddToCartLog[];
  /** Create a log entry. */
  createAddToCartLog: (log: AddToCartLogInsert) => Promise<void>;
  /** Update a log entry by id contained in payload. */
  updateAddToCartLog: (log: AddToCartLogUpdate) => Promise<void>;
  /** Delete a log entry by id. */
  deleteAddToCartLog: (logId: string) => Promise<void>;
  /** Fetch logs by product id. */
  fetchByProductId: (productId: string) => Promise<AddToCartLog[]>;
  /** Loading state for initial data load. */
  loading: boolean;
}

const AddToCartLogContext = createContext<AddToCartLogContextProps | undefined>(
  undefined
);

/**
 * Write-oriented provider for add_to_cart_logs.
 * Skips full-table hydrate + Realtime (unused for customer reads) to cut
 * cold-start network and channel count.
 */
export function AddToCartLogProvider({ children }: PropsWithChildren): React.ReactElement {
  const [add_to_cart_logs] = useState<AddToCartLog[]>([]);
  const [loading] = useState<boolean>(false);
  const { showAlert } = useAlertContext();

  const showAlertRef = useRef<typeof showAlert | null>(null);
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  const createAddToCartLog = useCallback(async (log: AddToCartLogInsert): Promise<void> => {
    if (typeof log.product_id !== "string" || log.product_id.length === 0) {
      showAlertRef.current?.("Invalid product id.", "error");
      return;
    }
    if (
      typeof log.action_type !== "string" ||
      log.action_type.length === 0
    ) {
      showAlertRef.current?.("Invalid action type.", "error");
      return;
    }
    const { error } = await supabase.from("add_to_cart_logs").insert(log);
    if (error) {
      showAlertRef.current?.(error.message, "error");
    }
  }, []);

  const updateAddToCartLog = useCallback(async (log: AddToCartLogUpdate): Promise<void> => {
    const id = log.id;
    if (typeof id !== "string" || id.length === 0) {
      showAlertRef.current?.("Missing log id for update.", "error");
      return;
    }
    const { error } = await supabase
      .from("add_to_cart_logs")
      .update(log)
      .eq("id", id);
    if (error) {
      showAlertRef.current?.(error.message, "error");
    }
  }, []);

  const deleteAddToCartLog = useCallback(async (logId: string): Promise<void> => {
    if (logId.trim().length === 0) {
      showAlertRef.current?.("Log id is required.", "error");
      return;
    }
    const { error } = await supabase
      .from("add_to_cart_logs")
      .delete()
      .eq("id", logId);
    if (error) {
      showAlertRef.current?.(error.message, "error");
    }
  }, []);

  const fetchByProductId = useCallback(async (productId: string): Promise<AddToCartLog[]> => {
    if (productId.trim().length === 0) {
      return [];
    }
    const { data, error } = await supabase
      .from("add_to_cart_logs")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) {
      showAlertRef.current?.(error.message, "error");
      return [];
    }
    return data ?? [];
  }, []);

  const value = useMemo<AddToCartLogContextProps>(
    () => ({
      add_to_cart_logs,
      createAddToCartLog,
      updateAddToCartLog,
      deleteAddToCartLog,
      fetchByProductId,
      loading,
    }),
    [
      add_to_cart_logs,
      createAddToCartLog,
      updateAddToCartLog,
      deleteAddToCartLog,
      fetchByProductId,
      loading,
    ]
  );

  return (
    <AddToCartLogContext.Provider value={value}>
      {children}
    </AddToCartLogContext.Provider>
  );
}

export function useAddToCartLogContext(): AddToCartLogContextProps {
  const context = useContext(AddToCartLogContext);
  if (context === undefined) {
    throw new Error(
      "useAddToCartLogContext must be used within an AddToCartLogProvider"
    );
  }
  return context;
}
