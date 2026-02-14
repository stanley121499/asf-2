import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "../AlertContext";
import { usePostFolderMediaContext } from "./PostFolderMediaContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { restoreById, softDeleteById } from "../../utils/softDelete";
import { isSoftDeletedRow } from "../../utils/softDeleteRuntime";

export type PostFolder = Database["public"]["Tables"]["post_folders"]["Row"] & {
  medias: Database["public"]["Tables"]["post_folder_medias"]["Row"][];
};
export type PostFolderInsert = Database["public"]["Tables"]["post_folders"]["Insert"];
export type PostFolderUpdate = Database["public"]["Tables"]["post_folders"]["Update"];
type PostFolderRow = Database["public"]["Tables"]["post_folders"]["Row"];
type PostFolderMediaRow = Database["public"]["Tables"]["post_folder_medias"]["Row"];

interface PostFolderContextProps {
  postFolders: PostFolder[];
  createPostFolder: (postFolder: PostFolderInsert) => Promise<PostFolder | undefined>;
  updatePostFolder: (postFolder: PostFolderUpdate) => Promise<void>;
  deletePostFolder: (postFolderId: string) => Promise<void>;
  restorePostFolder: (postFolderId: string) => Promise<void>;
  loading: boolean;
}

const PostFolderContext = createContext<PostFolderContextProps | undefined>(undefined);

export function PostFolderProvider({ children }: PropsWithChildren) {
  // Store base folder rows in state. Medias are attached via `useMemo`.
  const [postFoldersRaw, setPostFoldersRaw] = useState<PostFolderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { postFolderMedias } = usePostFolderMediaContext();

  /**
   * Fetch all post folders.
   *
   * IMPORTANT: We intentionally do NOT re-fetch when `postFolderMedias` changes.
   * Instead, we attach medias via `useMemo` below to avoid expensive re-fetch loops.
   */
  const fetchPostFolders = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("post_folders")
        .select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setPostFoldersRaw((data ?? []).filter((pf) => !isSoftDeletedRow(pf)));
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Realtime handler for post_folders changes.
   */
  const handleChanges = useCallback((payload: RealtimePostgresChangesPayload<PostFolderRow>) => {
    if (payload.eventType === "INSERT") {
      if (isSoftDeletedRow(payload.new)) {
        return;
      }
      setPostFoldersRaw((prev) => [...prev, payload.new]);
    }

    if (payload.eventType === "UPDATE") {
      const updated = payload.new;
      if (isSoftDeletedRow(updated)) {
        setPostFoldersRaw((prev) => prev.filter((pf) => pf.id !== updated.id));
        return;
      }
      setPostFoldersRaw((prev) => prev.map((pf) => (pf.id === updated.id ? updated : pf)));
    }

    if (payload.eventType === "DELETE") {
      const removed = payload.old;
      setPostFoldersRaw((prev) => prev.filter((pf) => pf.id !== removed.id));
    }
  }, []);

  useEffect(() => {
    void fetchPostFolders();

    const subscription = supabase
      .channel("post_folders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_folders" },
        (payload: RealtimePostgresChangesPayload<PostFolderRow>) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPostFolders, handleChanges]);

  /**
   * Attach medias to folders in-memory. This avoids database re-fetches on media changes.
   */
  const postFolders = useMemo<PostFolder[]>(() => {
    const medias: PostFolderMediaRow[] = postFolderMedias ?? [];
    return postFoldersRaw.map((pf) => ({
      ...pf,
      medias: medias.filter((media) => media.post_folder_id === pf.id),
    }));
  }, [postFoldersRaw, postFolderMedias]);

  /**
   * Create a post folder and return the new folder with empty medias.
   */
  const createPostFolder = useCallback(async (postFolder: PostFolderInsert): Promise<PostFolder | undefined> => {
    const { data, error } = await supabase.from("post_folders").insert(postFolder).select();

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Post folder created successfully", "success");

    const row = data?.[0];
    if (!row) {
      return undefined;
    }

    return { ...row, medias: [] };
  }, [showAlert]);

  /**
   * Update a post folder.
   */
  const updatePostFolder = useCallback(async (postFolder: PostFolderUpdate): Promise<void> => {
    const id = postFolder.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      showAlert("Post folder id is required to update.", "error");
      return;
    }

    const { error } = await supabase.from("post_folders").update(postFolder).eq("id", id);

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Post folder updated successfully", "success");
  }, [showAlert]);

  /**
   * Delete a post folder by id.
   */
  const deletePostFolder = useCallback(async (postFolderId: string): Promise<void> => {
    if (typeof postFolderId !== "string" || postFolderId.trim().length === 0) {
      showAlert("Post folder id is required to delete.", "error");
      return;
    }

    try {
      await softDeleteById("post_folders", postFolderId, { setActive: true });
      showAlert("Post folder deleted successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to delete post folder:", error);
      showAlert("Failed to delete post folder", "error");
      throw error instanceof Error ? error : new Error("Failed to delete post folder");
    }
  }, [showAlert]);

  /**
   * Restore a soft-deleted post folder.
   *
   * @param postFolderId - Folder id to restore.
   */
  const restorePostFolder = useCallback(async (postFolderId: string): Promise<void> => {
    if (typeof postFolderId !== "string" || postFolderId.trim().length === 0) {
      showAlert("Post folder id is required to restore.", "error");
      return;
    }

    try {
      await restoreById("post_folders", postFolderId, { setActive: true });
      showAlert("Post folder restored successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to restore post folder:", error);
      showAlert("Failed to restore post folder", "error");
      throw error instanceof Error ? error : new Error("Failed to restore post folder");
    }
  }, [showAlert]);

  const value = useMemo<PostFolderContextProps>(
    () => ({
      postFolders,
      createPostFolder,
      updatePostFolder,
      deletePostFolder,
      restorePostFolder,
      loading,
    }),
    [postFolders, createPostFolder, updatePostFolder, deletePostFolder, restorePostFolder, loading]
  );

  return (
    <PostFolderContext.Provider value={value}>
      {children}
    </PostFolderContext.Provider>
  );

}

export function usePostFolderContext() {
  const context = useContext(PostFolderContext);

  if (!context) {
    throw new Error("usePostFolderContext must be used within a PostFolderProvider");
  }

  return context;
}