import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "@/database.types";
import { getErrorTranslationKey } from "@/i18n/errorMap";
import { logPrioP2Fetch, logPrioP2Skip } from "@/lib/prioLog";
import { useP2FocusRetain } from "@/lib/useP2FocusRetain";
import { supabase } from "@/lib/supabase";
import { sanitizeSupabaseErrorMessage } from "@/lib/supabaseErrorMessage";
import { useAlertContext } from "./AlertContext";
import { useTranslation } from "./LocaleContext";
import type { Product } from "./product/ProductContext";
import { useProductContext } from "./product/ProductContext";
import { useAuthContext } from "./AuthContext";

/**
 * Delay before dropping the last wishlist retain so Home↔Shop tab handoff
 * never briefly hits retainCount 0 (which tore down realtime + re-fetched
 * and burned JS during browse focus).
 */
const WISHLIST_RETAIN_RELEASE_GRACE_MS = 450;

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
  /**
   * P2: retain fetch + realtime while a focused screen needs wishlist data.
   * Returns a releaser for blur / unmount.
   */
  retainFocus: () => () => void;
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
 * WishlistProvider keeps the current user's wishlist rows in sync with Supabase.
 * Fetch + realtime activate only while at least one screen holds {@link retainFocus}
 * (P2 — not at cold-start provider mount).
 */
export function WishlistProvider({ children }: PropsWithChildren): React.ReactElement {
  const { showAlert } = useAlertContext();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { products } = useProductContext();

  const [rows, setRows] = useState<WishlistRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [retainCount, setRetainCount] = useState(0);
  /** Mirrors retainCount for sync bump/release without waiting on render. */
  const retainCountRef = useRef(0);
  /** Pending deferred release from the last consumer blur. */
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** User id we already hydrated rows for — skip refetch on retain re-entry. */
  const loadedUserIdRef = useRef<string | null>(null);

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
   * When `silent` is true after a prior hydrate, skips the loading flag so
   * Home hearts do not re-render for background / realtime refetches.
   *
   * @param options.silent - Prefer silent refresh after the first hydrate
   */
  const fetchWishlist = useCallback(
    async (options?: { silent?: boolean }): Promise<void> => {
      const userId = user?.id;

      if (typeof userId !== "string" || userId.length === 0) {
        // No authenticated user => no wishlist rows.
        setRows([]);
        loadedUserIdRef.current = null;
        return;
      }

      const silent = options?.silent === true && loadedUserIdRef.current === userId;
      if (!silent) {
        setLoading(true);
      }
      logPrioP2Fetch("wishlist", silent ? "silent" : "blocking");
      try {
        const { data, error } = await supabase
          .from("wishlist")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          // TEMPORARY: Silently ignore "table does not exist" errors to prevent spam
          if (error.code === "PGRST204" || error.message?.includes("table") || error.code === "42P01") {
            if (process.env.NODE_ENV === "development") {
              console.warn("Wishlist table does not exist yet. Skipping fetch.");
            }
            setRows([]);
            loadedUserIdRef.current = userId;
            return;
          }
          const safeMessage = sanitizeSupabaseErrorMessage(error);
          if (process.env.NODE_ENV === "development") {
            console.error("Failed to fetch wishlist:", safeMessage);
          }
          showAlert(t(getErrorTranslationKey(safeMessage)), "error");
          return;
        }

        setRows(data ?? []);
        loadedUserIdRef.current = userId;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [showAlert, t, user?.id]
  );

  /**
   * Add a product to the current user's wishlist.
   *
   * @param productId - Target product id.
   */
  const addToWishlist = useCallback(
    async (productId: string): Promise<void> => {
      const userId = user?.id;

      if (typeof userId !== "string" || userId.length === 0) {
        showAlert(t("wishlist.signInRequired"), "error");
        return;
      }
      if (typeof productId !== "string" || productId.trim().length === 0) {
        showAlert(t("errors.invalidProductId"), "error");
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
            showAlert(t("wishlist.alreadyIn"), "success");
            return;
          }
          if (process.env.NODE_ENV === "development") {
            console.error(
              "Failed to add to wishlist:",
              sanitizeSupabaseErrorMessage(error)
            );
          }
          showAlert(
            t(getErrorTranslationKey(sanitizeSupabaseErrorMessage(error))),
            "error"
          );
          return;
        }

        showAlert(t("wishlist.added"), "success");
        await fetchWishlist();
      } finally {
        setLoading(false);
      }
    },
    [fetchWishlist, showAlert, t, user?.id]
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
        showAlert(t("wishlist.signInRequired"), "error");
        return;
      }
      if (typeof productId !== "string" || productId.trim().length === 0) {
        showAlert(t("errors.invalidProductId"), "error");
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
          if (process.env.NODE_ENV === "development") {
            console.error(
              "Failed to remove from wishlist:",
              sanitizeSupabaseErrorMessage(error)
            );
          }
          showAlert(
            t(getErrorTranslationKey(sanitizeSupabaseErrorMessage(error))),
            "error"
          );
          return;
        }

        showAlert(t("wishlist.removed"), "success");
        await fetchWishlist();
      } finally {
        setLoading(false);
      }
    },
    [fetchWishlist, showAlert, t, user?.id]
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
   * P2 retain: bump consumer count so fetch + realtime stay active while
   * wishlist (or Shop hearts) screens are focused.
   *
   * Release is deferred ({@link WISHLIST_RETAIN_RELEASE_GRACE_MS}) so a Home
   * blur that immediately precedes a Shop/PDP focus never drops to zero and
   * re-runs fetch + channel subscribe on the tab-switch critical path.
   */
  const retainFocus = useCallback((): (() => void) => {
    if (releaseTimerRef.current !== null) {
      clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
    retainCountRef.current += 1;
    setRetainCount(retainCountRef.current);
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      releaseTimerRef.current = setTimeout(() => {
        releaseTimerRef.current = null;
        retainCountRef.current = Math.max(0, retainCountRef.current - 1);
        setRetainCount(retainCountRef.current);
      }, WISHLIST_RETAIN_RELEASE_GRACE_MS);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current !== null) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
    };
  }, []);

  /** True while any screen holds retain (boolean — avoids effect churn on 1↔2). */
  const isRetained = retainCount > 0;

  /**
   * Fetch + realtime only while retained (screen focus), not at mount.
   * Skips network refetch when rows for this user are already loaded so
   * Home↔Shop handoff does not set `loading` and storm consumers.
   */
  useEffect(() => {
    const userId = user?.id;

    if (!isRetained) {
      return;
    }

    if (typeof userId !== "string" || userId.length === 0) {
      setRows([]);
      loadedUserIdRef.current = null;
      return;
    }

    if (loadedUserIdRef.current !== userId) {
      void fetchWishlist();
    } else {
      logPrioP2Skip("wishlist", "already loaded for user");
    }

    const handleChanges = (_payload: RealtimePostgresChangesPayload<WishlistRow>): void => {
      void fetchWishlist({ silent: true });
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
  }, [fetchWishlist, isRetained, user?.id]);

  const value = useMemo<WishlistContextProps>(
    () => ({
      wishlistItems,
      loading,
      fetchWishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      retainFocus,
    }),
    [
      addToWishlist,
      fetchWishlist,
      isInWishlist,
      loading,
      removeFromWishlist,
      retainFocus,
      wishlistItems,
    ]
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

/**
 * P2: start wishlist fetch/realtime while this screen is focused.
 *
 * @param name - Optional log label (default `wishlist`)
 */
export function useWishlistP2Focus(name: string = "wishlist"): void {
  const { retainFocus } = useWishlistContext();
  useP2FocusRetain(name, retainFocus);
}




