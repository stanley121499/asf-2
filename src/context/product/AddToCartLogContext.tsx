import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import type { Database } from "../../database.types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
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
  /** Current in-memory list of logs. */
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
 * Provider for add_to_cart_logs with typed CRUD and real-time sync.
 */
export function AddToCartLogProvider({ children }: PropsWithChildren) {
  const [add_to_cart_logs, setLogs] = useState<AddToCartLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("add_to_cart_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        showAlert(error.message, "error");
        setLoading(false);
        return;
      }
      setLogs(data ?? []);
      setLoading(false);
    };

    fetchAll();

    const handleChanges = (
      payload: RealtimePostgresChangesPayload<AddToCartLog>
    ) => {
      if (payload.eventType === "INSERT" && payload.new) {
        setLogs((prev) => [payload.new, ...prev]);
      }
      if (payload.eventType === "UPDATE" && payload.new) {
        setLogs((prev) =>
          prev.map((row) => (row.id === payload.new?.id ? payload.new : row))
        );
      }
      if (payload.eventType === "DELETE" && payload.old) {
        const deletedId = (payload.old as Partial<AddToCartLog>).id;
        if (typeof deletedId === "string") {
          setLogs((prev) => prev.filter((row) => row.id !== deletedId));
        }
      }
    };

    const channel = supabase
      .channel("realtime:add_to_cart_logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "add_to_cart_logs" },
        handleChanges
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [showAlert]);

  const createAddToCartLog = async (log: AddToCartLogInsert): Promise<void> => {
    if (typeof log.product_id !== "string" || log.product_id.length === 0) {
      showAlert("Invalid product id.", "error");
      return;
    }
    if (
      typeof log.action_type !== "string" ||
      log.action_type.length === 0
    ) {
      showAlert("Invalid action type.", "error");
      return;
    }
    if (typeof log.amount === "number" && log.amount < 0) {
      showAlert("Amount must be zero or positive.", "error");
      return;
    }
    const { error } = await supabase.from("add_to_cart_logs").insert(log);
    if (error) {
      showAlert(error.message, "error");
    }
  };

  const updateAddToCartLog = async (log: AddToCartLogUpdate): Promise<void> => {
    if (typeof log.id !== "string") {
      showAlert("Missing log id for update.", "error");
      return;
    }
    const { error } = await supabase
      .from("add_to_cart_logs")
      .update(log)
      .eq("id", log.id);
    if (error) {
      showAlert(error.message, "error");
    }
  };

  const deleteAddToCartLog = async (logId: string): Promise<void> => {
    if (typeof logId !== "string" || logId.length === 0) {
      showAlert("Invalid log id for delete.", "error");
      return;
    }
    const { error } = await supabase
      .from("add_to_cart_logs")
      .delete()
      .eq("id", logId);
    if (error) {
      showAlert(error.message, "error");
    }
  };

  const fetchByProductId = async (
    productId: string
  ): Promise<AddToCartLog[]> => {
    if (typeof productId !== "string" || productId.length === 0) {
      showAlert("Invalid product id.", "error");
      return [];
    }
    const { data, error } = await supabase
      .from("add_to_cart_logs")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) {
      showAlert(error.message, "error");
      return [];
    }
    return data ?? [];
  };

  const value = useMemo<AddToCartLogContextProps>(
    () => ({
      add_to_cart_logs,
      createAddToCartLog,
      updateAddToCartLog,
      deleteAddToCartLog,
      fetchByProductId,
      loading,
    }),
    [add_to_cart_logs, loading]
  );

  return (
    <AddToCartLogContext.Provider value={value}>
      {children}
    </AddToCartLogContext.Provider>
  );
}

export function useAddToCartLogContext(): AddToCartLogContextProps {
  const context = useContext(AddToCartLogContext);
  if (!context) {
    throw new Error(
      "useAddToCartLogContext must be used within an AddToCartLogProvider"
    );
  }
  return context;
}



