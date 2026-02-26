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
 * Cart types based on Supabase generated schema.
 */
export type AddToCart = Database["public"]["Tables"]["add_to_carts"]["Row"];
export type AddToCartInsert =
  Database["public"]["Tables"]["add_to_carts"]["Insert"];
export type AddToCartUpdate =
  Database["public"]["Tables"]["add_to_carts"]["Update"];

/**
 * Public API for the AddToCart context.
 */
interface AddToCartContextProps {
  /** Current in-memory list of cart rows. */
  add_to_carts: AddToCart[];
  /** Create a cart entry. */
  createAddToCart: (addToCart: AddToCartInsert) => Promise<void>;
  /** Update a cart entry by id contained in payload. */
  updateAddToCart: (addToCart: AddToCartUpdate) => Promise<void>;
  /** Delete a cart entry by id. */
  deleteAddToCart: (addToCartId: string) => Promise<void>;
  /** Fetch carts for a specific user id. */
  fetchByUser: (userId: string) => Promise<AddToCart[]>;
  /** Delete all cart rows for a specific user id. */
  clearCartByUser: (userId: string) => Promise<void>;
  /** Loading state for initial data load. */
  loading: boolean;
}

const AddToCartContext = createContext<AddToCartContextProps | undefined>(
  undefined
);

/**
 * AddToCartProvider provides typed CRUD utilities and real-time syncing
 * with the Supabase `add_to_carts` table.
 */
export function AddToCartProvider({ children }: PropsWithChildren) {
  const [add_to_carts, setAddToCarts] = useState<AddToCart[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    // Fetch initial state
    const fetchAll = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("add_to_carts")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        showAlert(error.message, "error");
        setLoading(false);
        return;
      }
      setAddToCarts(data ?? []);
      setLoading(false);
    };

    fetchAll();

    // Handle real-time changes
    const handleChanges = (
      payload: RealtimePostgresChangesPayload<AddToCart>
    ) => {
      if (payload.eventType === "INSERT" && payload.new) {
        setAddToCarts((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE" && payload.new) {
        setAddToCarts((prev) =>
          prev.map((row) => (row.id === payload.new?.id ? payload.new : row))
        );
      }

      if (payload.eventType === "DELETE" && payload.old) {
        const deletedId = (payload.old as Partial<AddToCart>).id;
        if (typeof deletedId === "string") {
          setAddToCarts((prev) => prev.filter((row) => row.id !== deletedId));
        }
      }
    };

    const channel = supabase
      .channel("realtime:add_to_carts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "add_to_carts" },
        handleChanges
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [showAlert]);

  /** Create a new cart item with basic validation. */
  const createAddToCart = async (addToCart: AddToCartInsert): Promise<void> => {
    // Validate required fields
    if (
      typeof addToCart.product_id !== "string" ||
      typeof addToCart.user_id !== "string"
    ) {
      showAlert("Invalid product or user id.", "error");
      return;
    }
    if (typeof addToCart.amount === "number" && addToCart.amount < 1) {
      showAlert("Amount must be at least 1.", "error");
      return;
    }

    const { data, error } = await supabase
      .from("add_to_carts")
      .insert(addToCart)
      .select("*")
      .single();
    if (error) {
      showAlert(error.message, "error");
      return;
    }
    if (data) {
      // Optimistically append so UI reflects immediately
      setAddToCarts((prev) => [...prev, data as AddToCart]);
    }
  };

  /** Update an existing cart item. */
  const updateAddToCart = async (addToCart: AddToCartUpdate): Promise<void> => {
    if (typeof addToCart.id !== "string") {
      showAlert("Missing cart id for update.", "error");
      return;
    }
    const { data, error } = await supabase
      .from("add_to_carts")
      .update(addToCart)
      .eq("id", addToCart.id)
      .select("*")
      .single();
    if (error) {
      showAlert(error.message, "error");
      return;
    }
    if (data) {
      setAddToCarts((prev) =>
        prev.map((row) => (row.id === data.id ? (data as AddToCart) : row))
      );
    }
  };

  /** Delete a cart item by id. */
  const deleteAddToCart = async (addToCartId: string): Promise<void> => {
    if (typeof addToCartId !== "string" || addToCartId.length === 0) {
      showAlert("Invalid cart id for delete.", "error");
      return;
    }
    const { error } = await supabase
      .from("add_to_carts")
      .delete()
      .eq("id", addToCartId);
    if (error) {
      showAlert(error.message, "error");
      return;
    }
    setAddToCarts((prev) => prev.filter((row) => row.id !== addToCartId));
  };

  /** Delete all cart rows for a given user id. */
  const clearCartByUser = async (userId: string): Promise<void> => {
    if (typeof userId !== "string" || userId.length === 0) {
      showAlert("Invalid user id for clear cart.", "error");
      return;
    }
    const { error } = await supabase
      .from("add_to_carts")
      .delete()
      .eq("user_id", userId);
    if (error) {
      showAlert(error.message, "error");
      return;
    }
    setAddToCarts((prev) => prev.filter((row) => row.user_id !== userId));
  };

  /** Fetch all cart rows for a given user id. */
  const fetchByUser = async (userId: string): Promise<AddToCart[]> => {
    if (typeof userId !== "string" || userId.length === 0) {
      showAlert("Invalid user id.", "error");
      return [];
    }
    const { data, error } = await supabase
      .from("add_to_carts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) {
      showAlert(error.message, "error");
      return [];
    }
    return data ?? [];
  };

  const value = useMemo<AddToCartContextProps>(
    () => ({
      add_to_carts,
      createAddToCart,
      updateAddToCart,
      deleteAddToCart,
      fetchByUser,
      clearCartByUser,
      loading,
    }),
    [add_to_carts, loading] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <AddToCartContext.Provider value={value}>{children}</AddToCartContext.Provider>;
}

/** Hook to access the AddToCart context instance. */
export function useAddToCartContext(): AddToCartContextProps {
  const context = useContext(AddToCartContext);
  if (!context) {
    throw new Error("useAddToCartContext must be used within a AddToCartProvider");
  }
  return context;
}
