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
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type PostMedia = Database["public"]["Tables"]["post_medias"]["Row"];
export type PostMediaInsert = Database["public"]["Tables"]["post_medias"]["Insert"];
export type PostMediaUpdate = Database["public"]["Tables"]["post_medias"]["Update"];

interface PostMediaContextProps {
  postMedias: PostMedia[];
  createPostMedia: (postMedia: PostMediaInsert) => Promise<void>;
  updatePostMedia: (postMedia: PostMediaUpdate) => Promise<void>;
  deletePostMedia: (postMediaId: string) => Promise<void>;
  deleteAllPostMediaByPostId: (postId: string) => Promise<void>;
  loading: boolean;
}

const PostMediaContext = createContext<PostMediaContextProps | undefined>(undefined);

export function PostMediaProvider({ children }: PropsWithChildren) {
  const [postMedias, setPostMedias] = useState<PostMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  /**
   * Fetch all post medias.
   */
  const fetchPostMedias = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const { data, error } = await supabase.from("post_medias").select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setPostMedias(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Realtime handler for post_medias changes.
   */
  const handleChanges = useCallback((payload: RealtimePostgresChangesPayload<PostMedia>) => {
    if (payload.eventType === "INSERT") {
      setPostMedias((prev) => [...prev, payload.new]);
    }

    if (payload.eventType === "UPDATE") {
      const updated = payload.new;
      setPostMedias((prev) =>
        prev.map((postMedia) => (postMedia.id === updated.id ? updated : postMedia))
      );
    }

    if (payload.eventType === "DELETE") {
      const removed = payload.old;
      setPostMedias((prev) => prev.filter((postMedia) => postMedia.id !== removed.id));
    }
  }, []);

  useEffect(() => {
    void fetchPostMedias();

    const subscription = supabase
      .channel("post_medias")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_medias" },
        (payload: RealtimePostgresChangesPayload<PostMedia>) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPostMedias, handleChanges]);

  /**
   * Create a post media record.
   */
  const createPostMedia = useCallback(async (postMedia: PostMediaInsert): Promise<void> => {
    const { error } = await supabase.from("post_medias").insert(postMedia);

    if (error) {
      showAlert(error.message, "error");
    }
  }, [showAlert]);

  /**
   * Update a post media record.
   */
  const updatePostMedia = useCallback(async (postMedia: PostMediaUpdate): Promise<void> => {
    const { error } = await supabase
      .from("post_medias")
      .update(postMedia)
      .match({ id: postMedia.id });

    if (error) {
      showAlert(error.message, "error");
    }
  }, [showAlert]);

  /**
   * Delete a post media record by id.
   */
  const deletePostMedia = useCallback(async (postMediaId: string): Promise<void> => {
    const { error } = await supabase
      .from("post_medias")
      .delete()
      .match({ id: postMediaId });

    if (error) {
      showAlert(error.message, "error");
    }
  }, [showAlert]);

  /**
   * Delete all post medias belonging to a post id.
   */
  const deleteAllPostMediaByPostId = useCallback(async (postId: string): Promise<void> => {
    const { error } = await supabase
      .from("post_medias")
      .delete()
      .match({ post_id: postId });

    if (error) {
      showAlert(error.message, "error");
    }
  }, [showAlert]);

  const value = useMemo<PostMediaContextProps>(
    () => ({
      postMedias,
      createPostMedia,
      updatePostMedia,
      deletePostMedia,
      deleteAllPostMediaByPostId,
      loading,
    }),
    [
      postMedias,
      createPostMedia,
      updatePostMedia,
      deletePostMedia,
      deleteAllPostMediaByPostId,
      loading,
    ]
  );

  return (
    <PostMediaContext.Provider value={value}>
      {children}
    </PostMediaContext.Provider>
  );

}

export function usePostMediaContext() {
  const context = useContext(PostMediaContext);

  if (!context) {
    throw new Error("usePostMediaContext must be used within a PostMediaProvider");
  }

  return context;
}