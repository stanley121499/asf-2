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

/** Category row type with optional nested children (client-only). */
export type Category = Database["public"]["Tables"]["categories"]["Row"] & { children?: Category[] };
export type Categories = { categories: Category[] };
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

interface CategoryContextProps {
  categories: Category[];
  createCategory: (category: CategoryInsert) => Promise<void>;
  updateCategory: (category: CategoryUpdate) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  restoreCategory: (categoryId: string) => Promise<void>;
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextProps | undefined>(undefined);

export function CategoryProvider({ children }: Readonly<PropsWithChildren>): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  /**
   * A ref wrapper for AlertContext's `showAlert` to avoid effect dependency loops.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  /**
   * Fetch all active categories from Supabase.
   */
  const fetchCategories = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("arrangement", { ascending: true });

      if (error) {
        showAlertRef.current?.(error.message, "error");
        return;
      }

      setCategories((data ?? []).filter((c) => !isSoftDeletedRow(c)));
    } catch (error: unknown) {
      console.error("Failed to fetch categories:", error);
      showAlertRef.current?.("Failed to fetch categories", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Realtime handler for category changes.
   */
  const handleRealtimeChanges = useCallback((payload: RealtimePostgresChangesPayload<Category>): void => {
    if (payload.eventType === "INSERT") {
      if (isSoftDeletedRow(payload.new)) {
        return;
      }
      setCategories((prev) => [...prev, payload.new]);
    }
    if (payload.eventType === "UPDATE") {
      const updated = payload.new;
      // Soft delete is an UPDATE; treat it like removal from active lists.
      if (isSoftDeletedRow(updated) || updated.active === false) {
        setCategories((prev) => prev.filter((c) => c.id !== updated.id));
      } else {
        setCategories((prev) => prev.map((category) => (category.id === updated.id ? updated : category)));
      }
    }
    if (payload.eventType === "DELETE") {
      const removed = payload.old;
      setCategories((prev) => prev.filter((category) => category.id !== removed.id));
    }
  }, []);

  /**
   * Initial fetch + realtime subscription.
   */
  useEffect(() => {
    void fetchCategories();

    const subscription = supabase
      .channel("categories")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        (payload: RealtimePostgresChangesPayload<Category>) => {
          handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCategories, handleRealtimeChanges]);

  /** Create a category */
  const createCategory = useCallback(async (category: CategoryInsert): Promise<void> => {
    const { error } = await supabase.from("categories").insert(category);
    if (error) {
      showAlertRef.current?.(error.message, "error");
    }
  }, []);

  /** Update a category by id */
  const updateCategory = useCallback(async (category: CategoryUpdate): Promise<void> => {
    const id = category.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      showAlertRef.current?.("Missing category id for update.", "error");
      return;
    }
    const { error } = await supabase.from("categories").update(category).eq("id", id);
    if (error) {
      showAlertRef.current?.(error.message, "error");
    }
  }, []);

  /** Delete a category by id */
  const deleteCategory = useCallback(async (categoryId: string): Promise<void> => {
    if (categoryId.trim().length === 0) {
      showAlertRef.current?.("Category id is required to delete.", "error");
      return;
    }

    try {
      await softDeleteById("categories", categoryId, { setActive: true });
      showAlertRef.current?.("Category deleted successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to delete category:", error);
      showAlertRef.current?.("Failed to delete category", "error");
    }
  }, []);

  /** Restore a soft-deleted category by id. */
  const restoreCategory = useCallback(async (categoryId: string): Promise<void> => {
    if (categoryId.trim().length === 0) {
      showAlertRef.current?.("Category id is required to restore.", "error");
      return;
    }

    try {
      await restoreById("categories", categoryId, { setActive: true });
      showAlertRef.current?.("Category restored successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to restore category:", error);
      showAlertRef.current?.("Failed to restore category", "error");
    }
  }, []);

  const value = useMemo<CategoryContextProps>(
    () => ({
      categories,
      createCategory,
      updateCategory,
      deleteCategory,
      restoreCategory,
      loading,
    }),
    [categories, createCategory, updateCategory, deleteCategory, restoreCategory, loading]
  );

  return (
    <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>
  );
}

export function useCategoryContext() {
  const context = useContext(CategoryContext);

  if (!context) {
    throw new Error("useCategoryContext must be used within a CategoryProvider");
  }

  return context;
}