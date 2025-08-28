import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

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
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextProps | undefined>(undefined);

export function CategoryProvider({ children }: PropsWithChildren) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchCategories = async () => {
      const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("arrangement", { ascending: true });

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setCategories(categories);
    };

    fetchCategories();

    const handleChanges = (payload: RealtimePostgresChangesPayload<Category>) => {
      if (payload.eventType === "INSERT") {
        setCategories((prev) => [...prev, payload.new as Category]);
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new as Category;
        if ((updated as { active?: boolean }).active === false) {
          setCategories((prev) => prev.filter((c) => c.id !== updated.id));
        } else {
          setCategories((prev) => prev.map((category) => (category.id === updated.id ? updated : category)));
        }
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old as Category;
        setCategories((prev) => prev.filter((category) => category.id !== removed.id));
      }
    };

    const subscription = supabase
      .channel("categories")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, (payload: RealtimePostgresChangesPayload<Category>) => handleChanges(payload))
      .subscribe();

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  /** Create a category */
  const createCategory = async (category: CategoryInsert) => {
    const { error } = await supabase.from("categories").insert(category);
    if (error) { showAlert(error.message, "error"); console.log(error.message); return; }
  };

  /** Update a category by id */
  const updateCategory = async (category: CategoryUpdate) => {
    if (!category.id) {
      showAlert("Missing category id for update.", "error");
      return;
    }
    const { error } = await supabase.from("categories").update(category).eq("id", category.id);
    if (error) { showAlert(error.message, "error"); console.log(error.message); return; }
  };

  /** Delete a category by id */
  const deleteCategory = async (categoryId: string) => {
    const { error } = await supabase.from("categories").update({ active: false }).match({ id: categoryId });
    if (error) { showAlert(error.message, "error"); console.log(error.message); return; }
  };

  return (
    <CategoryContext.Provider value={{ categories, createCategory, updateCategory, deleteCategory, loading }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryContext() {
  const context = useContext(CategoryContext);

  if (!context) {
    throw new Error("useCategoryContext must be used within a CategoryProvider");
  }

  return context;
}