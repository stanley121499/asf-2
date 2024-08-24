import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";

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

const CategoryContext = createContext<CategoryContextProps>(undefined!);

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
        .order("arrangement", { ascending: true });

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setCategories(categories);
    };

    fetchCategories();

    const handleChanges = (payload: any) => {
      console.log(payload.eventType);
      if (payload.eventType === "INSERT") {
        setCategories((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setCategories((prev) =>
          prev.map((category) => (category.id === payload.new.id ? payload.new : category))
        );
      }

      if (payload.eventType === "DELETE") {
        setCategories((prev) => prev.filter((category) => category.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel('categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createCategory = async (category: CategoryInsert) => {
    const { error } = await supabase.from("categories").insert(category);
    if (error) { showAlert(error.message, "error"); console.log(error.message); return; }
  };

  const updateCategory = async (category: CategoryUpdate) => {
    const { error } = await supabase.from("categories").update(category).eq("id", category.id);
    if (error) { showAlert(error.message, "error"); console.log(error.message); return; }
  };

  const deleteCategory = async (categoryId: string) => {
    const { error } = await supabase.from("categories").delete().match({ id: categoryId });
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