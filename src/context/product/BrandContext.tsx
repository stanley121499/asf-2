import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/**
 * Brand row type from Supabase with strict typing.
 */
export type Brand = Database["public"]["Tables"]["brand"]["Row"] & { media_url?: string | null };
export type BrandInsert = Database["public"]["Tables"]["brand"]["Insert"];
export type BrandUpdate = Database["public"]["Tables"]["brand"]["Update"];

interface BrandContextProps {
  brands: Brand[];
  loading: boolean;
  createBrand: (brand: BrandInsert & { media_url?: string | null }) => Promise<Brand | undefined>;
  updateBrand: (brand: BrandUpdate & { id: string }) => Promise<void>;
  deleteBrand: (brandId: string) => Promise<void>;
}

const BrandContext = createContext<BrandContextProps | undefined>(undefined);

export function BrandProvider({ children }: PropsWithChildren): JSX.Element {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchBrands = async (): Promise<void> => {
      const { data, error } = await supabase
        .from("brand")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (error) {
        showAlert(error.message, "error");
        setLoading(false);
        return;
      }

      setBrands(data ?? []);
      setLoading(false);
    };

    fetchBrands();

    const handleChanges = (payload: RealtimePostgresChangesPayload<Brand>): void => {
      if (payload.eventType === "INSERT") {
        setBrands((prev) => [...prev, payload.new as Brand]);
      }

      if (payload.eventType === "UPDATE") {
        const updated = payload.new as Brand;
        if ((updated as { active?: boolean | null }).active === false) {
          setBrands((prev) => prev.filter((b) => b.id !== updated.id));
        } else {
          setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        }
      }

      if (payload.eventType === "DELETE") {
        const removed = payload.old as Brand;
        setBrands((prev) => prev.filter((b) => b.id !== removed.id));
      }
    };

    const subscription = supabase
      .channel("brand")
      .on("postgres_changes", { event: "*", schema: "public", table: "brand" }, (payload: RealtimePostgresChangesPayload<Brand>) => handleChanges(payload))
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  /** Create a new brand row */
  const createBrand = async (brand: BrandInsert & { media_url?: string | null }): Promise<Brand | undefined> => {
    const { data, error } = await supabase
      .from("brand")
      .insert(brand)
      .select()
      .single();

    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }

    return data as Brand;
  };

  /** Update an existing brand row by id */
  const updateBrand = async (brand: BrandUpdate & { id: string }): Promise<void> => {
    const { error } = await supabase
      .from("brand")
      .update(brand)
      .eq("id", brand.id)
      .single();

    if (error) {
      showAlert(error.message, "error");
    }
  };

  /** Soft delete brand by setting active=false */
  const deleteBrand = async (brandId: string): Promise<void> => {
    const { error } = await supabase.from("brand").update({ active: false }).eq("id", brandId);
    if (error) {
      showAlert(error.message, "error");
    }
  };

  return (
    <BrandContext.Provider value={{ brands, loading, createBrand, updateBrand, deleteBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrandContext(): BrandContextProps {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrandContext must be used within a BrandProvider");
  }
  return context;
}


