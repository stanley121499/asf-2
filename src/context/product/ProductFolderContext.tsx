import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";
import { useProductFolderMediaContext } from "./ProductFolderMediaContext";

export type ProductFolder = Database["public"]["Tables"]["product_folders"]["Row"] & {
  medias: Database["public"]["Tables"]["product_folder_medias"]["Row"][];
}
export type ProductFolderInsert = Database["public"]["Tables"]["product_folders"]["Insert"];
export type ProductFolderUpdate = Database["public"]["Tables"]["product_folders"]["Update"];

interface ProductFolderContextProps {
  productFolders: ProductFolder[];
  createProductFolder: (productFolder: ProductFolderInsert) => Promise<ProductFolder|undefined>;
  updateProductFolder: (productFolder: ProductFolderUpdate) => Promise<void>;
  deleteProductFolder: (productFolderId: string) => Promise<void>;
  loading: boolean;
}

const ProductFolderContext = createContext<ProductFolderContextProps>(undefined!);

export function ProductFolderProvider({ children }: PropsWithChildren) {
  const [productFolders, setProductFolders] = useState<ProductFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { productFolderMedias } = useProductFolderMediaContext();

  useEffect(() => {
    setLoading(true);

    const fetchProductFolders = async () => {
      const { data: productFolders, error } = await supabase
        .from("product_folders")
        .select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      // Populate product folder medias
      for (const productFolder of productFolders as ProductFolder[]) {
        productFolder.medias = productFolderMedias.filter((media) => media.product_folder_id === productFolder.id);
      }

      setProductFolders(productFolders as ProductFolder[]);
    };

    fetchProductFolders();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setProductFolders((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setProductFolders((prev) =>
          prev.map((productFolder) => (productFolder.id === payload.new.id ? payload.new : productFolder))
        );
      }

      if (payload.eventType === "DELETE") {
        setProductFolders((prev) => prev.filter((productFolder) => productFolder.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel("product_folders")
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_folders' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [productFolderMedias, showAlert]);

  const createProductFolder = async (productFolder: ProductFolderInsert) => {
    const { data, error } = await supabase.from("product_folders").insert(productFolder).select();

    if (error) {
      console.error(error);
      showAlert(error.message, "error");
      return;
    }

    console.log("Data", data);

    showAlert("Product folder created successfully", "success");
    return data?.[0] as ProductFolder;
  };

  const updateProductFolder = async (productFolder: ProductFolderUpdate) => {
    const { error } = await supabase
      .from("product_folders")
      .update(productFolder)
      .match({ id: productFolder.id });

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Product folder updated successfully", "success");
  };

  const deleteProductFolder = async (productFolderId: string) => {
    const { error } = await supabase.from("product_folders").delete().match({ id: productFolderId });

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Product folder deleted successfully", "success");
  }

  return (
    <ProductFolderContext.Provider value={{ productFolders, createProductFolder, updateProductFolder, deleteProductFolder, loading }}>
      {children}
    </ProductFolderContext.Provider>
  );

}

export function useProductFolderContext() {
  const context = useContext(ProductFolderContext);

  if (!context) {
    throw new Error("useProductFolderContext must be used within a ProductFolderProvider");
  }

  return context;
}