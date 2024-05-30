import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";

export type ProductFolderMedia = Database["public"]["Tables"]["product_folder_medias"]["Row"];
export type ProductFolderMediaInsert = Database["public"]["Tables"]["product_folder_medias"]["Insert"];
export type ProductFolderMediaUpdate = Database["public"]["Tables"]["product_folder_medias"]["Update"];

interface ProductFolderMediaContextProps {
  productFolderMedias: ProductFolderMedia[];
  createProductFolderMedia: (productFolderMedia: ProductFolderMediaInsert) => Promise<void>;
  updateProductFolderMedia: (productFolderMedia: ProductFolderMediaUpdate) => Promise<void>;
  // deleteProductFolderMedia: (productFolderMediaId: string) => Promise<void>;
  loading: boolean;
}

const ProductFolderMediaContext = createContext<ProductFolderMediaContextProps>(undefined!);

export function ProductFolderMediaProvider({ children }: PropsWithChildren) {
  const [productFolderMedias, setProductFolderMedias] = useState<ProductFolderMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchProductFolderMedias = async () => {
      const { data: productFolderMedias, error } = await supabase
        .from("product_folder_medias")
        .select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setProductFolderMedias(productFolderMedias);
    };

    fetchProductFolderMedias();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setProductFolderMedias((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setProductFolderMedias((prev) =>
          prev.map((productFolderMedia) =>
            productFolderMedia.id === payload.new.id ? payload.new : productFolderMedia
          )
        );
      }

      if (payload.eventType === "DELETE") {
        setProductFolderMedias((prev) =>
          prev.filter((productFolderMedia) => productFolderMedia.id !== payload.old.id)
        );
      }
    };

    const subscription = supabase
      .channel("product_folder_medias")
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_folder_medias' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createProductFolderMedia = async (productFolderMedia: ProductFolderMediaInsert) => {
    const { error } = await supabase.from("product_folder_medias").insert(productFolderMedia);

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Product folder media created successfully", "success");
  };

  const updateProductFolderMedia = async (productFolderMedia: ProductFolderMediaUpdate) => {
    const { error } = await supabase
      .from("product_folder_medias")
      .update(productFolderMedia)
      .match({ id: productFolderMedia.id });

    if (error) {
      showAlert(error.message, "error");
      return;
    }
  }

  // const deleteProductFolderMedia = async (productFolderMediaId: string) => {
  //   const { error } = await supabase
  //     .from("product_folder_medias")
  //     .delete()
  //     .eq("id", productFolderMediaId);

  //   if (error) {
  //     showAlert(error.message, "error");
  //     return;
  //   }

  //   // Update the product folder media count
  //   const productFolderMedia = productFolderMedias.find((productFolderMedia) => productFolderMedia.id === productFolderMediaId);

  //   const productFolder = productFolders.find((productFolder) => productFolder.id === productFolderMedia!.product_folder_id);

  //   // Check the extension of the media by splitting the string and getting the last element of productFolderMedia.media_url
  //   const mediaExtension = productFolderMedia!.media_url.split('.').pop();

  //   if (mediaExtension === "mp4") {
  //     productFolder!.video_count--;
  //   } else {
  //     productFolder!.image_count--;
  //   }

  //   updateProductFolder(productFolder!);

  //   showAlert("Product folder media deleted successfully", "success");
  // }

  return (
    <ProductFolderMediaContext.Provider value={{ productFolderMedias, createProductFolderMedia, updateProductFolderMedia, loading }}>
      {children}
    </ProductFolderMediaContext.Provider>
  );
}

export function useProductFolderMediaContext() {
  const context = useContext(ProductFolderMediaContext);

  if (!context) {
    throw new Error("useProductFolderMediaContext must be used within a ProductFolderMediaProvider");
  }

  return context;
}


