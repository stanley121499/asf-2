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
import { supabase } from "@/lib/supabase";
import { sanitizeSupabaseErrorMessage } from "@/lib/supabaseErrorMessage";
import { Database } from "@/database.types";
import { useAlertContext } from "../AlertContext";
import { PostMedia } from "./PostMediaContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { restoreById, softDeleteById } from "@/lib/softDelete";
import { isSoftDeletedRow } from "@/lib/softDeleteRuntime";
import { scheduleDeferredRealtime } from "@/lib/deferredRealtime";

/** Explicit post ↔ product junction row (`post_products`). */
export type PostProductLink = Database["public"]["Tables"]["post_products"]["Row"];

/**
 * Post row with nested medias and explicit product links for Storefront feed resolvers.
 * Taxonomy FKs (`department_id`, `range_id`, `category_id`, `brand_id`) live on the base row.
 */
export type Post = Database["public"]["Tables"]["posts"]["Row"] & {
  medias: PostMedia[];
  /** Explicit M2M links from `post_products` (may be empty). */
  post_products: PostProductLink[];
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
  /** Re-fetch posts (used after transient gateway failures). */
  refreshPosts: () => Promise<void>;
}

const PostContext = createContext<PostContextProps | undefined>(undefined);

/** Max attempts for the initial posts fetch (transient Cloudflare 5xx / timeouts). */
const POST_FETCH_MAX_ATTEMPTS = 3;

/** Base delay between post-fetch retries (ms); doubles each attempt. */
const POST_FETCH_RETRY_BASE_MS = 700;

/**
 * Wait for `ms` without rejecting.
 *
 * @param ms - Delay in milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function PostProvider({ children }: PropsWithChildren) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const fetchGenerationRef = useRef(0);

  /**
   * Fetch all posts with taxonomy FKs (via `*`) and explicit `post_products` links.
   * Medias stay empty here; {@link PostMediaProvider} owns `post_medias` association.
   * Retries briefly on gateway / network failures so Home hero can recover after
   * transient Cloudflare 522-style outages without a full app remount.
   */
  const fetchPosts = useCallback(async (): Promise<void> => {
    const generation = fetchGenerationRef.current + 1;
    fetchGenerationRef.current = generation;
    setLoading(true);

    try {
      let lastSafeMessage = "Network request failed";

      for (let attempt = 1; attempt <= POST_FETCH_MAX_ATTEMPTS; attempt += 1) {
        if (fetchGenerationRef.current !== generation) {
          return;
        }

        const { data, error } = await supabase.from("posts").select(`
          *,
          post_products(post_id, product_id, created_at)
        `);

        if (fetchGenerationRef.current !== generation) {
          return;
        }

        if (!error) {
          const mapped: Post[] = (data ?? [])
            .filter((p) => !isSoftDeletedRow(p))
            .map((p) => {
              const links = (p.post_products ?? []) as PostProductLink[];
              return {
                ...p,
                medias: [],
                post_products: links,
              };
            });
          setPosts(mapped);
          return;
        }

        lastSafeMessage = sanitizeSupabaseErrorMessage(error);
        if (process.env.NODE_ENV === "development") {
          console.error(
            `Failed to fetch posts (attempt ${String(attempt)}/${String(POST_FETCH_MAX_ATTEMPTS)}):`,
            lastSafeMessage
          );
        }

        if (attempt < POST_FETCH_MAX_ATTEMPTS) {
          await delay(POST_FETCH_RETRY_BASE_MS * attempt);
        }
      }

      // Keep any previously loaded posts on failure so Home hero does not
      // disappear after a mid-session remount / HMR during a gateway blip.
      showAlert(lastSafeMessage, "error");
    } finally {
      if (fetchGenerationRef.current === generation) {
        setLoading(false);
      }
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
        setPosts((prev) => [
          ...prev,
          { ...inserted, medias: [], post_products: [] },
        ]);
      }

      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        if (isSoftDeletedRow(updated)) {
          setPosts((prev) => prev.filter((p) => p.id !== updated.id));
          return;
        }
        setPosts((prev) =>
          prev.map((post) =>
            post.id === updated.id
              ? {
                  ...updated,
                  medias: post.medias,
                  post_products: post.post_products,
                }
              : post
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

    return scheduleDeferredRealtime(() =>
      supabase
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
        .subscribe()
    );
  }, [fetchPosts, handleChanges]);

  /**
   * Create a post and return the created row with empty medias.
   */
  const createPost = useCallback(async (post: PostInsert): Promise<Post | undefined> => {
    const { data, error } = await supabase.from("posts").insert(post).select();

    if (error) {
      showAlert(sanitizeSupabaseErrorMessage(error), "error");
    }

    const row = data?.[0];
    if (!row) return undefined;
    return { ...row, medias: [], post_products: [] };
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
      const safeMessage = sanitizeSupabaseErrorMessage(error);
      showAlert(safeMessage, "error");
      console.error(safeMessage);
      // Throw so UIs can avoid showing a false success alert.
      throw new Error(safeMessage);
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
      console.error("Failed to delete post:", sanitizeSupabaseErrorMessage(error));
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
      console.error("Failed to restore post:", sanitizeSupabaseErrorMessage(error));
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
      refreshPosts: fetchPosts,
    }),
    [posts, createPost, updatePost, deletePost, restorePost, loading, fetchPosts]
  );

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
}

export function usePostContext(): PostContextProps {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error("usePostContext must be used within a PostProvider");
  }
  return context;
}
