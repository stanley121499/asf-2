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
import { useProductFolderMediaContext } from "./ProductFolderMediaContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { restoreById, softDeleteById } from "../../utils/softDelete";
import { isSoftDeletedRow } from "../../utils/softDeleteRuntime";

type ProductFolderRow = Database["public"]["Tables"]["product_folders"]["Row"];
type ProductFolderMediaRow = Database["public"]["Tables"]["product_folder_medias"]["Row"];

/** Product folder type returned by this context (folder row + derived medias). */
export type ProductFolder = ProductFolderRow & {
  medias: ProductFolderMediaRow[];
};
export type ProductFolderInsert = Database["public"]["Tables"]["product_folders"]["Insert"];
export type ProductFolderUpdate = Database["public"]["Tables"]["product_folders"]["Update"];

interface ProductFolderContextProps {
  productFolders: ProductFolder[];
  createProductFolder: (productFolder: ProductFolderInsert) => Promise<ProductFolder | undefined>;
  updateProductFolder: (productFolder: ProductFolderUpdate) => Promise<void>;
  deleteProductFolder: (productFolderId: string) => Promise<void>;
  restoreProductFolder: (productFolderId: string) => Promise<void>;
  loading: boolean;
}

const ProductFolderContext = createContext<ProductFolderContextProps | undefined>(undefined);

export function ProductFolderProvider({ children }: Readonly<PropsWithChildren>): JSX.Element {
  // Keep folder state as rows-only; medias are derived from ProductFolderMediaContext via useMemo.
  const [productFolderRows, setProductFolderRows] = useState<ProductFolderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();
  const { productFolderMedias } = useProductFolderMediaContext();

  /**
   * A ref wrapper for AlertContext's `showAlert`.
   *
   * AlertContext does not memoize `showAlert`, so including it in dependencies can cause
   * unnecessary effect reruns and circular fetch behavior. This keeps access to the latest
   * function without adding it to dependency arrays.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  /**
   * Fetches product folders from Supabase and updates local folder-row state.
   *
   * IMPORTANT: This fetches folders only. Folder medias are derived using `useMemo` and
   * must not be used as a fetch dependency to avoid re-fetch loops.
   */
  const fetchProductFolders = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_folders")
        .select("*");

      if (error) {
        // Use the ref to avoid depending on showAlert directly.
        showAlertRef.current?.(error.message, "error");
        return;
      }

      setProductFolderRows((data ?? []).filter((f) => !isSoftDeletedRow(f)));
    } catch (error: unknown) {
      console.error("Failed to fetch product folders:", error);
      showAlertRef.current?.("Failed to fetch product folders", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handles realtime changes for product folders and keeps local folder-row state in sync.
   *
   * NOTE: The payload rows do not contain derived medias; medias are attached via `useMemo`.
   */
  const handleRealtimeChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ProductFolderRow>): void => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new;
        if (isSoftDeletedRow(inserted)) {
          return;
        }
        setProductFolderRows((prev) => [...prev, inserted]);
      }

      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        if (isSoftDeletedRow(updated)) {
          setProductFolderRows((prev) => prev.filter((row) => row.id !== updated.id));
          return;
        }

        setProductFolderRows((prev) =>
          prev.map((row) => (row.id === updated.id ? updated : row))
        );
      }

      if (payload.eventType === "DELETE") {
        const removed = payload.old;
        setProductFolderRows((prev) => prev.filter((row) => row.id !== removed.id));
      }
    },
    []
  );

  /**
   * Fetch once on mount, and establish the realtime subscription once.
   *
   * Dependencies deliberately exclude `productFolderMedias` and `showAlert` to prevent
   * full folder re-fetches when media changes.
   */
  useEffect(() => {
    void fetchProductFolders();

    const subscription = supabase
      .channel("product_folders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_folders" },
        (payload: RealtimePostgresChangesPayload<ProductFolderRow>) => {
          handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProductFolders, handleRealtimeChanges]);

  /**
   * Derived folders that include medias.
   *
   * Recomputes only when folder rows or folder medias change (no DB re-fetch required).
   */
  const foldersWithMedias = useMemo<ProductFolder[]>(() => {
    return productFolderRows.map((folder) => ({
      ...folder,
      medias: productFolderMedias.filter((media) => media.product_folder_id === folder.id),
    }));
  }, [productFolderRows, productFolderMedias]);

  /**
   * Creates a product folder row.
   *
   * @param productFolder - Insert payload for the `product_folders` table.
   * @returns Created folder with an empty medias array (medias are derived elsewhere), or undefined on failure.
   */
  const createProductFolder = useCallback(
    async (productFolder: ProductFolderInsert): Promise<ProductFolder | undefined> => {
      try {
        const { data, error } = await supabase
          .from("product_folders")
          .insert(productFolder)
          .select("*")
          .single();

        if (error) {
          console.error(error);
          showAlertRef.current?.(error.message, "error");
          return undefined;
        }

        if (!data) {
          showAlertRef.current?.("Product folder creation returned no created row.", "error");
          return undefined;
        }

        showAlertRef.current?.("Product folder created successfully", "success");
        return { ...data, medias: [] };
      } catch (error: unknown) {
        console.error("Failed to create product folder:", error);
        showAlertRef.current?.("Failed to create product folder", "error");
        return undefined;
      }
    },
    []
  );

  /**
   * Updates a product folder row by ID.
   *
   * @param productFolder - Partial update payload. Must include `id`.
   */
  const updateProductFolder = useCallback(async (productFolder: ProductFolderUpdate): Promise<void> => {
    const folderId = productFolder.id;
    if (typeof folderId !== "string" || folderId.trim().length === 0) {
      showAlertRef.current?.("Product folder ID is required to update.", "error");
      return;
    }

    try {
      const { error } = await supabase.from("product_folders").update(productFolder).eq("id", folderId);

      if (error) {
        showAlertRef.current?.(error.message, "error");
        return;
      }

      showAlertRef.current?.("Product folder updated successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to update product folder:", error);
      showAlertRef.current?.("Failed to update product folder", "error");
    }
  }, []);

  /**
   * Deletes a product folder row by ID.
   *
   * @param productFolderId - Folder ID to delete.
   */
  const deleteProductFolder = useCallback(async (productFolderId: string): Promise<void> => {
    if (productFolderId.trim().length === 0) {
      showAlertRef.current?.("Product folder ID is required to delete.", "error");
      return;
    }

    try {
      await softDeleteById("product_folders", productFolderId, { setActive: true });
      showAlertRef.current?.("Product folder deleted successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to delete product folder:", error);
      showAlertRef.current?.("Failed to delete product folder", "error");
    }
  }, []);

  /**
   * Restores a soft-deleted product folder.
   *
   * @param productFolderId - Folder ID to restore.
   */
  const restoreProductFolder = useCallback(async (productFolderId: string): Promise<void> => {
    if (productFolderId.trim().length === 0) {
      showAlertRef.current?.("Product folder ID is required to restore.", "error");
      return;
    }

    try {
      await restoreById("product_folders", productFolderId, { setActive: true });
      showAlertRef.current?.("Product folder restored successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to restore product folder:", error);
      showAlertRef.current?.("Failed to restore product folder", "error");
    }
  }, []);

  const value = useMemo<ProductFolderContextProps>(
    () => ({
      // Provide the derived view so consumers never trigger folder DB re-fetches on media changes.
      productFolders: foldersWithMedias,
      createProductFolder,
      updateProductFolder,
      deleteProductFolder,
      restoreProductFolder,
      loading,
    }),
    [
      foldersWithMedias,
      createProductFolder,
      updateProductFolder,
      deleteProductFolder,
      restoreProductFolder,
      loading,
    ]
  );

  return (
    <ProductFolderContext.Provider value={value}>
      {children}
    </ProductFolderContext.Provider>
  );

}

export function useProductFolderContext(): ProductFolderContextProps {
  const context = useContext(ProductFolderContext);

  if (!context) {
    throw new Error("useProductFolderContext must be used within a ProductFolderProvider");
  }

  return context;
}