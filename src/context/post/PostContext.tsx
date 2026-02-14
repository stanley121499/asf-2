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
import { PostMedia } from "./PostMediaContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { restoreById, softDeleteById } from "../../utils/softDelete";
import { isSoftDeletedRow } from "../../utils/softDeleteRuntime";

export type Post = Database["public"]["Tables"]["posts"]["Row"] & {
  medias: PostMedia[];
};
export type Posts = { posts: Post[] };
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

interface PostContextProps {
  posts: Post[];
  createPost: (post: PostInsert) => Promise<Post | undefined>;
  updatePost: (post: PostUpdate) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  restorePost: (postId: string) => Promise<void>;
  loading: boolean;
}

const PostContext = createContext<PostContextProps | undefined>(undefined);

export function PostProvider({ children }: PropsWithChildren) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  /**
   * Fetch all posts.
   */
  const fetchPosts = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      // Attach medias as an empty array here; media association is handled elsewhere.
      const mapped: Post[] = (data ?? [])
        .filter((p) => !isSoftDeletedRow(p))
        .map((p) => ({ ...p, medias: [] }));
      setPosts(mapped);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Realtime handler for posts table changes.
   */
  const handleChanges = useCallback(
    (
      payload: RealtimePostgresChangesPayload<
        Database["public"]["Tables"]["posts"]["Row"]
      >
    ) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new;
        if (isSoftDeletedRow(inserted)) {
          return;
        }
        setPosts((prev) => [...prev, { ...inserted, medias: [] }]);
      }

      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        if (isSoftDeletedRow(updated)) {
          setPosts((prev) => prev.filter((p) => p.id !== updated.id));
          return;
        }
        setPosts((prev) =>
          prev.map((post) =>
            post.id === updated.id ? { ...updated, medias: post.medias } : post
          )
        );
      }

      if (payload.eventType === "DELETE") {
        const removed = payload.old;
        setPosts((prev) => prev.filter((post) => post.id !== removed.id));
      }
    },
    []
  );

  useEffect(() => {
    void fetchPosts();

    const subscription = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (
          payload: RealtimePostgresChangesPayload<
            Database["public"]["Tables"]["posts"]["Row"]
          >
        ) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPosts, handleChanges]);

  /**
   * Create a post and return the created row with empty medias.
   */
  const createPost = useCallback(async (post: PostInsert): Promise<Post | undefined> => {
    const { data, error } = await supabase.from("posts").insert(post).select();

    if (error) {
      showAlert(error.message, "error");
    }

    const row = data?.[0];
    if (!row) return undefined;
    return { ...row, medias: [] } as Post;
  }, [showAlert]);

  /**
   * Update an existing post by id.
   */
  const updatePost = useCallback(async (post: PostUpdate): Promise<void> => {
    // Validation: we cannot update a post without an ID.
    if (!post.id) {
      const message = "Missing post id for update.";
      showAlert(message, "error");
      throw new Error(message);
    }

    const { error } = await supabase
      .from("posts")
      .update(post)
      .eq("id", post.id);

    if (error) {
      showAlert(error.message, "error");
      console.error(error);
      // Throw so UIs can avoid showing a false success alert.
      throw new Error(error.message);
    }
  }, [showAlert]);

  /**
   * Delete a post by id.
   */
  const deletePost = useCallback(async (postId: string): Promise<void> => {
    if (typeof postId !== "string" || postId.trim().length === 0) {
      showAlert("Post id is required to delete.", "error");
      return;
    }

    try {
      await softDeleteById("posts", postId, { setActive: true });
      showAlert("Post deleted successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to delete post:", error);
      showAlert("Failed to delete post", "error");
      throw error instanceof Error ? error : new Error("Failed to delete post");
    }
  }, [showAlert]);

  /**
   * Restore a previously soft-deleted post.
   *
   * @param postId - Post id to restore.
   */
  const restorePost = useCallback(async (postId: string): Promise<void> => {
    if (typeof postId !== "string" || postId.trim().length === 0) {
      showAlert("Post id is required to restore.", "error");
      return;
    }

    try {
      await restoreById("posts", postId, { setActive: true });
      showAlert("Post restored successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to restore post:", error);
      showAlert("Failed to restore post", "error");
      throw error instanceof Error ? error : new Error("Failed to restore post");
    }
  }, [showAlert]);

  const value = useMemo<PostContextProps>(
    () => ({
      posts,
      createPost,
      updatePost,
      deletePost,
      restorePost,
      loading,
    }),
    [posts, createPost, updatePost, deletePost, restorePost, loading]
  );

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
}

export function usePostContext() {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error("usePostContext must be used within a PostProvider");
  }
  return context;
}
