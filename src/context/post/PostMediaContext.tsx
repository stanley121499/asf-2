import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";

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

const PostMediaContext = createContext<PostMediaContextProps>(undefined!);

export function PostMediaProvider({ children }: PropsWithChildren) {
  const [postMedias, setPostMedias] = useState<PostMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchPostMedias = async () => {
      const { data: postMedias, error } = await supabase
        .from("post_medias")
        .select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setPostMedias(postMedias);
    };

    fetchPostMedias();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setPostMedias((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setPostMedias((prev) =>
          prev.map((postMedia) =>
            postMedia.id === payload.new.id ? payload.new : postMedia
          )
        );
      }

      if (payload.eventType === "DELETE") {
        setPostMedias((prev) =>
          prev.filter((postMedia) => postMedia.id !== payload.old.id)
        );
      }
    };

    const subscription = supabase
      .channel("post_medias")
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_medias' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createPostMedia = async (postMedia: PostMediaInsert) => {
    const { error } = await supabase.from("post_medias").insert(postMedia);

    if (error) {
      showAlert(error.message, "error");
    }
  };

  const updatePostMedia = async (postMedia: PostMediaUpdate) => {
    const { error } = await supabase
      .from("post_medias")
      .update(postMedia)
      .match({ id: postMedia.id });

    if (error) {
      showAlert(error.message, "error");
    }
  };

  const deletePostMedia = async (postMediaId: string) => {
    const { error } = await supabase
      .from("post_medias")
      .delete()
      .match({ id: postMediaId });

    if (error) {
      showAlert(error.message, "error");
    }
  }

  const deleteAllPostMediaByPostId = async (postId: string) => {
    const { error } = await supabase
      .from("post_medias")
      .delete()
      .match({ post_id: postId });

    if (error) {
      showAlert(error.message, "error");
    }
  }

  return (
    <PostMediaContext.Provider value={{ postMedias, createPostMedia, updatePostMedia, deletePostMedia, loading, deleteAllPostMediaByPostId }}>
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