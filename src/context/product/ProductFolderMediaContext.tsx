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

const ProductFolderMediaContext = createContext<ProductFolderMediaContextProps | undefined>(undefined);

export function ProductFolderMediaProvider({ children }: PropsWithChildren) {
  const [productFolderMedias, setProductFolderMedias] = useState<ProductFolderMedia[]>([]);
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
   * Fetch all product folder medias from Supabase.
   */
  const fetchProductFolderMedias = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("product_folder_medias").select("*");

      if (error) {
        showAlertRef.current?.(error.message, "error");
        return;
      }

      setProductFolderMedias(data ?? []);
    } catch (error: unknown) {
      console.error("Failed to fetch product folder medias:", error);
      showAlertRef.current?.("Failed to fetch product folder medias", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Realtime handler for product folder media changes.
   */
  const handleRealtimeChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ProductFolderMedia>): void => {
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
    },
    []
  );

  /**
   * Fetch once on mount and subscribe to realtime changes.
   */
  useEffect(() => {
    void fetchProductFolderMedias();

    const subscription = supabase
      .channel("product_folder_medias")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_folder_medias" },
        (payload: RealtimePostgresChangesPayload<ProductFolderMedia>) => {
          handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProductFolderMedias, handleRealtimeChanges]);

  /**
   * Create a product folder media row.\n   *
   * NOTE: List updates are handled by realtime subscriptions.\n   *
   * @param productFolderMedia - Insert payload for `product_folder_medias`.
   */
  const createProductFolderMedia = useCallback(
    async (productFolderMedia: ProductFolderMediaInsert): Promise<void> => {
      try {
        const { error } = await supabase.from("product_folder_medias").insert(productFolderMedia);

        if (error) {
          showAlertRef.current?.(error.message, "error");
          return;
        }

        showAlertRef.current?.("Product folder media created successfully", "success");
      } catch (error: unknown) {
        console.error("Failed to create product folder media:", error);
        showAlertRef.current?.("Failed to create product folder media", "error");
      }
    },
    []
  );

  /**
   * Update a product folder media row.\n   *
   * @param productFolderMedia - Update payload; must include an `id`.
   */
  const updateProductFolderMedia = useCallback(
    async (productFolderMedia: ProductFolderMediaUpdate): Promise<void> => {
      const id = productFolderMedia.id;
      if (typeof id !== "string" || id.trim().length === 0) {
        showAlertRef.current?.("Missing product folder media id for update.", "error");
        return;
      }

      try {
        const { error } = await supabase
          .from("product_folder_medias")
          .update(productFolderMedia)
          .eq("id", id);

        if (error) {
          showAlertRef.current?.(error.message, "error");
        }
      } catch (error: unknown) {
        console.error("Failed to update product folder media:", error);
        showAlertRef.current?.("Failed to update product folder media", "error");
      }
    },
    []
  );

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

  const value = useMemo<ProductFolderMediaContextProps>(
    () => ({
      productFolderMedias,
      createProductFolderMedia,
      updateProductFolderMedia,
      loading,
    }),
    [productFolderMedias, createProductFolderMedia, updateProductFolderMedia, loading]
  );

  return (
    <ProductFolderMediaContext.Provider value={value}>
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


