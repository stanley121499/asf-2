import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";

export type Category = Database['public']['Tables']['categories']['Row'];
export type Categories = { categories: Category[] };
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];

interface CategoryContextProps {
  categories: Category[];
  addCategory: (category: CategoryInsert) => void;
  deleteCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextProps>(undefined!);

export function CategoryProvider({ children }: PropsWithChildren) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('id' , { ascending: false });

      if (error) {
        console.error('Error fetching categories:', error);
        showAlert('Error fetching categories', 'error');
      }

      setCategories(categories || []);
      setLoading(false);
    };

    fetchCategories();

    const handleChanges = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setCategories(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setCategories(prev => prev.map(category => category.id === payload.new.id ? payload.new : category));
      } else if (payload.eventType === 'DELETE') {
        setCategories(prev => prev.filter(category => category.id !== payload.old.id));
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

  const addCategory = async (category: CategoryInsert) => {
    const { error } = await supabase
      .from('categories')
      .insert(category);

    if (error) {
      console.error('Error adding category:', error);
      showAlert('Error adding category', 'error');
      return;
    }
  };

  const deleteCategory = async (category: Category) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id);

    if (error) {
      console.error('Error deleting category:', error);
      showAlert('Error deleting category', 'error');
      return;
    }
  };

  const updateCategory = async (category: Category) => {
    const { error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', category.id);

    if (error) {
      console.error('Error updating category:', error);
      showAlert('Error updating category', 'error');
      return;
    }
  };

  return (
    <CategoryContext.Provider value={{ categories, addCategory, deleteCategory, updateCategory, loading }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryContext() {
  const context = useContext(CategoryContext);

  if (!context) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }

  return context;
}