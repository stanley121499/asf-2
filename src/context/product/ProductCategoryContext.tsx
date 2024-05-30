import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";

export type ProductCategory = Database["public"]["Tables"]["product_categories"]["Row"];
export type ProductCategoryInsert = Database["public"]["Tables"]["product_categories"]["Insert"];
export type ProductCategoryUpdate = Database["public"]["Tables"]["product_categories"]["Update"];

interface ProductCategoryContextProps {
  productCategories: ProductCategory[];
  createProductCategory: (productCategory: ProductCategoryInsert) => Promise<ProductCategory | undefined>;
  updateProductCategory: (productCategory: ProductCategoryUpdate) => Promise<void>;
  deleteProductCategory: (productCategoryId: string) => Promise<void>;
  loading: boolean;
}

const ProductCategoryContext = createContext<ProductCategoryContextProps>(undefined!);

export function ProductCategoryProvider({ children }: PropsWithChildren) {
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchProductCategories = async () => {
      const { data: productCategories, error } = await supabase
        .from("product_categories")
        .select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setProductCategories(productCategories);
    };

    fetchProductCategories();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setProductCategories((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setProductCategories((prev) =>
          prev.map((productCategory) => (productCategory.id === payload.new.id ? payload.new : productCategory))
        );
      }

      if (payload.eventType === "DELETE") {
        setProductCategories((prev) => prev.filter((productCategory) => productCategory.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel('product_categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_categories' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createProductCategory = async (productCategory: ProductCategoryInsert) => {
    const { data, error } = await supabase
      .from("product_categories")
      .insert(productCategory)
      .single();

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    return data;
  };

  const updateProductCategory = async (productCategory: ProductCategoryUpdate) => {
    const { error } = await supabase
      .from("product_categories")
      .update(productCategory)
      .match({ id: productCategory.id });

    if (error) {
      showAlert(error.message, "error");
      return;
    }
  };

  const deleteProductCategory = async (productCategoryId: string) => {
    const { error } = await supabase
      .from("product_categories")
      .delete()
      .match({ id: productCategoryId });

    if (error) {
      showAlert(error.message, "error");
      return;
    }
  };

  return (
    <ProductCategoryContext.Provider value={{ productCategories, createProductCategory, updateProductCategory, deleteProductCategory, loading }}>
      {children}
    </ProductCategoryContext.Provider>
  );
}

export function useProductCategoryContext() {
  const context = useContext(ProductCategoryContext);

  if (!context) {
    throw new Error("useProductCategoryContext must be used within a ProductCategoryProvider");
  }

  return context;
}