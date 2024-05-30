import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";

export type ProductColor = Database["public"]["Tables"]["product_colors"]["Row"];
export type ProductColorInsert = Database["public"]["Tables"]["product_colors"]["Insert"];
export type ProductColorUpdate = Database["public"]["Tables"]["product_colors"]["Update"];

interface ProductColorContextProps {
  productColors: ProductColor[];
  createProductColor: (productColor: ProductColorInsert) => Promise<ProductColor | undefined>;
  updateProductColor: (productColor: ProductColorUpdate) => Promise<void>;
  deleteProductColor: (productColorId: string) => Promise<void>;
  loading: boolean;
}

const ProductColorContext = createContext<ProductColorContextProps>(undefined!);

export function ProductColorProvider({ children }: PropsWithChildren) {
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchProductColors = async () => {
      const { data: productColors, error } = await supabase
        .from("product_colors")
        .select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setProductColors(productColors);
    };

    fetchProductColors();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setProductColors((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setProductColors((prev) =>
          prev.map((productColor) => (productColor.id === payload.new.id ? payload.new : productColor))
        );
      }

      if (payload.eventType === "DELETE") {
        setProductColors((prev) => prev.filter((productColor) => productColor.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel('product_colors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_colors' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  async function createProductColor(productColor: ProductColorInsert) {
    const { data, error } = await supabase
      .from("product_colors")
      .insert(productColor)
      .single();

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    return data;
  }

  async function updateProductColor(productColor: ProductColorUpdate) {
    const { error } = await supabase
      .from("product_colors")
      .update(productColor)
      .match({ id: productColor.id });

    if (error) {
      showAlert(error.message, "error");
      return;
    }
  }

  async function deleteProductColor(productColorId: string) {
    const { error } = await supabase
      .from("product_colors")
      .delete()
      .match({ id: productColorId });

    if (error) {
      showAlert(error.message, "error");
      return;
    }
  };

  return (
    <ProductColorContext.Provider value={{ productColors, createProductColor, updateProductColor, deleteProductColor, loading }}>
      {children}
    </ProductColorContext.Provider>
  );
}

export function useProductColorContext() {
  const context = useContext(ProductColorContext);

  if (!context) {
    throw new Error("useProductColorContext must be used within a ProductColorProvider");
  }

  return context;
}