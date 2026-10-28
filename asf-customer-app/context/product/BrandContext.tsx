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
import { supabase } from "@/lib/supabase";
import { Database } from "@/database.types";
import { useAlertContext } from "../AlertContext";
import { restoreById, softDeleteById } from "@/lib/softDelete";

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

export function BrandProvider({ children }: PropsWithChildren): React.ReactElement {
  /** Brands unused in customer list UIs — skip cold-start fetch + Realtime. */
  const [brands] = useState<Brand[]>([]);
  const [loading] = useState<boolean>(false);
  const { showAlert } = useAlertContext();


  /**
   * A ref wrapper for AlertContext's `showAlert` to avoid effect dependency loops.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

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



