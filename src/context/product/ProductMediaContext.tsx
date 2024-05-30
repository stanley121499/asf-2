import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";

export type ProductMedia = Database["public"]["Tables"]["product_medias"]["Row"];
export type ProductMediaInsert = Database["public"]["Tables"]["product_medias"]["Insert"];
export type ProductMediaUpdate = Database["public"]["Tables"]["product_medias"]["Update"];

interface ProductMediaContextProps {
  productMedias: ProductMedia[];
  createProductMedia: (productMedia: ProductMediaInsert) => Promise<void>;
  updateProductMedia: (productMedia: ProductMediaUpdate) => Promise<void>;
  deleteProductMedia: (productMediaId: string) => Promise<void>;
  deleteAllProductMediaByProductId: (productId: string) => Promise<void>;
  loading: boolean;
}

const ProductMediaContext = createContext<ProductMediaContextProps>(undefined!);

export function ProductMediaProvider({ children }: PropsWithChildren) {
  const [productMedias, setProductMedias] = useState<ProductMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchProductMedias = async () => {
      const { data: productMedias, error } = await supabase
        .from("product_medias")
        .select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setProductMedias(productMedias);
    };

    fetchProductMedias();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setProductMedias((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setProductMedias((prev) =>
          prev.map((productMedia) =>
            productMedia.id === payload.new.id ? payload.new : productMedia
          )
        );
      }

      if (payload.eventType === "DELETE") {
        setProductMedias((prev) =>
          prev.filter((productMedia) => productMedia.id !== payload.old.id)
        );
      }
    };

    const subscription = supabase
      .channel("product_medias")
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_medias' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createProductMedia = async (productMedia: ProductMediaInsert) => {
    console.log("productMedia", productMedia)
    const { error } = await supabase.from("product_medias").insert(productMedia);
    if (error) { showAlert(error.message, "error"); console.error(error); }
  };

  const updateProductMedia = async (productMedia: ProductMediaUpdate) => {
    const { error } = await supabase.from("product_medias").update(productMedia).match({ id: productMedia.id });
    if (error) { showAlert(error.message, "error"); console.error(error); }

  };

  const deleteProductMedia = async (productMediaId: string) => {
    const { error } = await supabase.from("product_medias").delete().match({ id: productMediaId });
    if (error) { showAlert(error.message, "error"); console.error(error); }

  }

  const deleteAllProductMediaByProductId = async (productId: string) => {
    const { error } = await supabase.from("product_medias").delete().match({ product_id: productId });
    if (error) { showAlert(error.message, "error"); console.error(error); }
  }

  return (
    <ProductMediaContext.Provider value={{ productMedias, createProductMedia, updateProductMedia, deleteProductMedia, loading, deleteAllProductMediaByProductId }}>
      {children}
    </ProductMediaContext.Provider>
  );

}

export function useProductMediaContext() {
  const context = useContext(ProductMediaContext);

  if (!context) {
    throw new Error("useProductMediaContext must be used within a ProductMediaProvider");
  }

  return context;
}