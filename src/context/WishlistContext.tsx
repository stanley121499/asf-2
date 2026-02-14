import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { supabase } from "../utils/supabaseClient";
import { useAlertContext } from "./AlertContext";
import type { Product } from "./product/ProductContext";
import { useProductContext } from "./product/ProductContext";
import { useAuthContext } from "./AuthContext";

/**
 * A single wishlist row (database-backed), optionally enriched with the joined product data.
 */
export type WishlistRow = Database["public"]["Tables"]["wishlist"]["Row"];

/**
 * Wishlist item used by UIs. This matches the required interface in the task prompt.
 */
export type WishlistItem = WishlistRow & {
  product?: Product;
};

/**
 * Public API for the Wishlist context.
 */
export interface WishlistContextProps {
  wishlistItems: WishlistItem[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextProps | undefined>(undefined);

/**
 * Runtime helper: narrows unknown values into a plain object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Runtime helper: safely extract a Postgres error code from unknown error shapes.
 *
 * Supabase typically returns `{ code: "23505" }` for unique violations.
 */
function getPostgresErrorCode(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const code = value["code"];
  return typeof code === "string" ? code : null;
}

/**
 * WishlistProvider keeps the current user's wishlist rows in sync with Supabase,
 * including realtime updates filtered to only the authenticated user.
 */
export function WishlistProvider({ children }: PropsWithChildren): JSX.Element {
  const { showAlert } = useAlertContext();
  const { user } = useAuthContext();
  const { products } = useProductContext();

  const [rows, setRows] = useState<WishlistRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Memoized lookup set for O(1) `isInWishlist`.
   */
  const productIdsSet = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      if (typeof row.product_id === "string" && row.product_id.length > 0) {
        set.add(row.product_id);
      }
    });
    return set;
  }, [rows]);

  /**
   * Enrich wishlist rows with product objects from ProductContext.
   * This is computed (not stored) so it stays accurate as products load/update.
   */
  const wishlistItems = useMemo<WishlistItem[]>(() => {
    const productsById: Record<string, Product> = products.reduce<Record<string, Product>>(
      (acc, product) => {
        acc[product.id] = product;
        return acc;
      },
      {}
    );

    return rows.map((row) => {
      const productId = row.product_id;
      const product =
        typeof productId === "string" && productId.length > 0 ? productsById[productId] : undefined;
      return { ...row, product };
    });
  }, [products, rows]);

  /**
   * Fetch the current user's wishlist rows from Supabase.
   *
   * This is user-scoped (and additionally protected by RLS policies).
   */
  const fetchWishlist = useCallback(async (): Promise<void> => {
    const userId = user?.id;

    if (typeof userId !== "string" || userId.length === 0) {
      // No authenticated user => no wishlist rows.
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        // TEMPORARY: Silently ignore "table does not exist" errors to prevent spam
        if (error.code === "PGRST204" || error.message?.includes("table") || error.code === "42P01") {
          console.warn("Wishlist table does not exist yet. Skipping fetch.");
          setRows([]);
          return;
        }
        console.error("Failed to fetch wishlist:", error);
        showAlert(error.message, "error");
        return;
      }

      setRows(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [showAlert, user?.id]);

  /**
   * Add a product to the current user's wishlist.
   *
   * @param productId - Target product id.
   */
  const addToWishlist = useCallback(
    async (productId: string): Promise<void> => {
      const userId = user?.id;

      if (typeof userId !== "string" || userId.length === 0) {
        showAlert("Please sign in to use the wishlist.", "error");
        return;
      }
      if (typeof productId !== "string" || productId.trim().length === 0) {
        showAlert("Invalid product id.", "error");
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.from("wishlist").insert([
          {
            user_id: userId,
            product_id: productId,
          },
        ]);

        if (error) {
          const code = getPostgresErrorCode(error);
          // 23505 = unique_violation (already in wishlist)
          if (code === "23505") {
            showAlert("Already in your wishlist.", "success");
            return;
          }
          console.error("Failed to add to wishlist:", error);
          showAlert(error.message, "error");
          return;
        }

        showAlert("Added to wishlist.", "success");
        await fetchWishlist();
      } finally {
        setLoading(false);
      }
    },
    [fetchWishlist, showAlert, user?.id]
  );

  /**
   * Remove a product from the current user's wishlist.
   *
   * @param productId - Target product id.
   */
  const removeFromWishlist = useCallback(
    async (productId: string): Promise<void> => {
      const userId = user?.id;

      if (typeof userId !== "string" || userId.length === 0) {
        showAlert("Please sign in to use the wishlist.", "error");
        return;
      }
      if (typeof productId !== "string" || productId.trim().length === 0) {
        showAlert("Invalid product id.", "error");
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);

        if (error) {
          console.error("Failed to remove from wishlist:", error);
          showAlert(error.message, "error");
          return;
        }

        showAlert("Removed from wishlist.", "success");
        await fetchWishlist();
      } finally {
        setLoading(false);
      }
    },
    [fetchWishlist, showAlert, user?.id]
  );

  /**
   * Check whether a product is currently wishlisted by the user.
   *
   * @param productId - Product id to check.
   * @returns True if wishlisted; otherwise false.
   */
  const isInWishlist = useCallback(
    (productId: string): boolean => {
      if (typeof productId !== "string" || productId.length === 0) return false;
      return productIdsSet.has(productId);
    },
    [productIdsSet]
  );

  /**
   * Initial fetch + realtime subscription scoped to the current user.
   */
  useEffect(() => {
    const userId = user?.id;

    // If there is no user, clear state and skip subscription.
    if (typeof userId !== "string" || userId.length === 0) {
      setRows([]);
      return;
    }

    void fetchWishlist();

    const handleChanges = (_payload: RealtimePostgresChangesPayload<WishlistRow>): void => {
      // Keep it simple and correct: re-fetch on any change.
      void fetchWishlist();
    };

    const channel = supabase
      .channel(`realtime:wishlist:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wishlist",
          filter: `user_id=eq.${userId}`,
        },
        handleChanges
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchWishlist, user?.id]);

  const value = useMemo<WishlistContextProps>(
    () => ({
      wishlistItems,
      loading,
      fetchWishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
    }),
    [addToWishlist, fetchWishlist, isInWishlist, loading, removeFromWishlist, wishlistItems]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

/**
 * Hook to access the Wishlist context instance.
 */
export function useWishlistContext(): WishlistContextProps {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlistContext must be used within a WishlistProvider");
  }
  return context;
}



