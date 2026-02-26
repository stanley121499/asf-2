import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "../AlertContext";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { restoreById, softDeleteById } from "../../utils/softDelete";
import { isSoftDeletedRow } from "../../utils/softDeleteRuntime";

type BrandRow = Database["public"]["Tables"]["brand"]["Row"];

/**
 * Brand row type from Supabase with strict typing.
 */
export type Brand = BrandRow & { media_url?: string | null };
export type BrandInsert = Database["public"]["Tables"]["brand"]["Insert"];
export type BrandUpdate = Database["public"]["Tables"]["brand"]["Update"];

interface BrandContextProps {
  brands: Brand[];
  loading: boolean;
  createBrand: (brand: BrandInsert & { media_url?: string | null }) => Promise<Brand | undefined>;
  updateBrand: (brand: BrandUpdate & { id: string }) => Promise<void>;
  deleteBrand: (brandId: string) => Promise<void>;
  restoreBrand: (brandId: string) => Promise<void>;
}

const BrandContext = createContext<BrandContextProps | undefined>(undefined);

export function BrandProvider({ children }: PropsWithChildren): JSX.Element {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();


  /**
   * A ref wrapper for AlertContext's `showAlert` to avoid effect dependency loops.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  /**
   * Fetch all active brands from Supabase.
   */
  const fetchBrands = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("brand")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (error) {
        showAlertRef.current?.(error.message, "error");
        return;
      }

      setBrands((data ?? []).filter((b) => !isSoftDeletedRow(b)));
    } catch (error: unknown) {
      console.error("Failed to fetch brands:", error);
      showAlertRef.current?.("Failed to fetch brands", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Realtime handler for brand changes.
   */
  const handleRealtimeChanges = useCallback((payload: RealtimePostgresChangesPayload<BrandRow>): void => {
    if (payload.eventType === "INSERT") {
      if (isSoftDeletedRow(payload.new)) {
        return;
      }
      setBrands((prev) => [...prev, payload.new]);
    }

    if (payload.eventType === "UPDATE") {
      const updated = payload.new;
      if (isSoftDeletedRow(updated) || updated.active === false) {
        setBrands((prev) => prev.filter((b) => b.id !== updated.id));
      } else {
        setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      }
    }

    if (payload.eventType === "DELETE") {
      const removed = payload.old;
      setBrands((prev) => prev.filter((b) => b.id !== removed.id));
    }
  }, []);

  /**
   * Initial fetch + realtime subscription.
   */
  useEffect(() => {
    void fetchBrands();

    const subscription = supabase
      .channel("brand")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brand" },
        (payload: RealtimePostgresChangesPayload<BrandRow>) => {
          handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBrands, handleRealtimeChanges]);

  /** Create a new brand row */
  const createBrand = useCallback(
    async (brand: BrandInsert & { media_url?: string | null }): Promise<Brand | undefined> => {
      const { data, error } = await supabase.from("brand").insert(brand).select("*").single();

      if (error) {
        showAlertRef.current?.(error.message, "error");
        return undefined;
      }

      return data ?? undefined;
    },
    []
  );

  /** Update an existing brand row by id */
  const updateBrand = useCallback(async (brand: BrandUpdate & { id: string }): Promise<void> => {
    const id = brand.id;
    if (id.trim().length === 0) {
      showAlertRef.current?.("Brand id is required to update.", "error");
      return;
    }

    const { error } = await supabase.from("brand").update(brand).eq("id", id).single();

    if (error) {
      showAlertRef.current?.(error.message, "error");
    }
  }, []);

  /** Soft delete brand by setting active=false */
  const deleteBrand = useCallback(async (brandId: string): Promise<void> => {
    if (brandId.trim().length === 0) {
      showAlertRef.current?.("Brand id is required to delete.", "error");
      return;
    }

    try {
      await softDeleteById("brand", brandId, { setActive: true });
      showAlertRef.current?.("Brand deleted successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to delete brand:", error);
      showAlertRef.current?.("Failed to delete brand", "error");
    }
  }, []);

  /** Restore a soft-deleted brand by id. */
  const restoreBrand = useCallback(async (brandId: string): Promise<void> => {
    if (brandId.trim().length === 0) {
      showAlertRef.current?.("Brand id is required to restore.", "error");
      return;
    }

    try {
      await restoreById("brand", brandId, { setActive: true });
      showAlertRef.current?.("Brand restored successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to restore brand:", error);
      showAlertRef.current?.("Failed to restore brand", "error");
    }
  }, []);

  const value = useMemo<BrandContextProps>(
    () => ({
      brands,
      loading,
      createBrand,
      updateBrand,
      deleteBrand,
      restoreBrand,
    }),
    [brands, loading, createBrand, updateBrand, deleteBrand, restoreBrand]
  );

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
}

export function useBrandContext(): BrandContextProps {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrandContext must be used within a BrandProvider");
  }
  return context;
}


