import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";

export type ProductSize = Database["public"]["Tables"]["product_sizes"]["Row"];
export type ProductSizeInsert = Database["public"]["Tables"]["product_sizes"]["Insert"];
export type ProductSizeUpdate = Database["public"]["Tables"]["product_sizes"]["Update"];

interface ProductSizeContextProps {
  productSizes: ProductSize[];
  createProductSize: (productSize: ProductSizeInsert) => Promise<ProductSize | undefined>;
  updateProductSize: (productSize: ProductSizeUpdate) => Promise<void>;
  deleteProductSize: (productSizeId: string) => Promise<void>;
  loading: boolean;
}

const ProductSizeContext = createContext<ProductSizeContextProps>(undefined!);

export function ProductSizeProvider({ children }: PropsWithChildren) {
  const [productSizes, setProductSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchProductSizes = async () => {
      const { data: productSizes, error } = await supabase
        .from("product_sizes")
        .select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setProductSizes(productSizes);
    };

    fetchProductSizes();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setProductSizes((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setProductSizes((prev) =>
          prev.map((productSize) => (productSize.id === payload.new.id ? payload.new : productSize))
        );
      }

      if (payload.eventType === "DELETE") {
        setProductSizes((prev) => prev.filter((productSize) => productSize.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel('product_sizes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_sizes' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createProductSize = async (productSize: ProductSizeInsert) => {
    const { data, error } = await supabase
      .from("product_sizes")
      .insert(productSize)
      .single();

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    return data;
  };

  const updateProductSize = async (productSize: ProductSizeUpdate) => {
    const { error } = await supabase
      .from("product_sizes")
      .update(productSize)
      .match({ id: productSize.id });

    if (error) {
      showAlert(error.message, "error");
      return;
    }
  };

  const deleteProductSize = async (productSizeId: string) => {
    const { error } = await supabase
      .from("product_sizes")
      .delete()
      .match({ id: productSizeId });

    if (error) {
      showAlert(error.message, "error");
      return;
    }
  }

  return (
    <ProductSizeContext.Provider value={{ productSizes, createProductSize, updateProductSize, deleteProductSize, loading }}>
      {children}
    </ProductSizeContext.Provider>
  );
}

export function useProductSizeContext() {
  const context = useContext(ProductSizeContext);

  if (!context) {
    throw new Error("useProductSizeContext must be used within a ProductSizeProvider");
  }

  return context;
}