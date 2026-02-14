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

export type PostFolderMedia = Database["public"]["Tables"]["post_folder_medias"]["Row"];
export type PostFolderMediaInsert = Database["public"]["Tables"]["post_folder_medias"]["Insert"];
export type PostFolderMediaUpdate = Database["public"]["Tables"]["post_folder_medias"]["Update"];

interface PostFolderMediaContextProps {
  postFolderMedias: PostFolderMedia[];
  createPostFolderMedia: (postFolderMedia: PostFolderMediaInsert) => Promise<void>;
  updatePostFolderMedia: (postFolderMedia: PostFolderMediaUpdate) => Promise<void>;
  // deletePostFolderMedia: (postFolderMediaId: string) => Promise<void>;
  loading: boolean;
}

const PostFolderMediaContext = createContext<PostFolderMediaContextProps | undefined>(undefined);

export function PostFolderMediaProvider({ children }: PropsWithChildren) {
  const [postFolderMedias, setPostFolderMedias] = useState<PostFolderMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  /**
   * Fetch all post folder medias.
   */
  const fetchPostFolderMedias = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const { data, error } = await supabase.from("post_folder_medias").select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setPostFolderMedias(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Realtime handler for post_folder_medias changes.
   */
  const handleChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<PostFolderMedia>) => {
      if (payload.eventType === "INSERT") {
        setPostFolderMedias((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        setPostFolderMedias((prev) =>
          prev.map((postFolderMedia) =>
            postFolderMedia.id === updated.id ? updated : postFolderMedia
          )
        );
      }

      if (payload.eventType === "DELETE") {
        const removed = payload.old;
        setPostFolderMedias((prev) =>
          prev.filter((postFolderMedia) => postFolderMedia.id !== removed.id)
        );
      }
    },
    []
  );

  useEffect(() => {
    void fetchPostFolderMedias();

    const subscription = supabase
      .channel("post_folder_medias")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_folder_medias" },
        (payload: RealtimePostgresChangesPayload<PostFolderMedia>) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPostFolderMedias, handleChanges]);

  /**
   * Create a post folder media record.
   */
  const createPostFolderMedia = useCallback(async (postFolderMedia: PostFolderMediaInsert): Promise<void> => {
    const { error } = await supabase.from("post_folder_medias").insert(postFolderMedia);

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Post folder media created successfully", "success");
  }, [showAlert]);

  /**
   * Update a post folder media record.
   */
  const updatePostFolderMedia = useCallback(async (postFolderMedia: PostFolderMediaUpdate): Promise<void> => {
    const { error } = await supabase
      .from("post_folder_medias")
      .update(postFolderMedia)
      .match({ id: postFolderMedia.id });

    if (error) {
      showAlert(error.message, "error");
      return;
    }
  }, [showAlert])

  // const deletePostFolderMedia = async (postFolderMediaId: string) => {
  //   const { error } = await supabase
  //     .from("post_folder_medias")
  //     .delete()
  //     .eq("id", postFolderMediaId);

  //   if (error) {
  //     showAlert(error.message, "error");
  //     return;
  //   }

  //   // Update the post folder media count
  //   const postFolderMedia = postFolderMedias.find((postFolderMedia) => postFolderMedia.id === postFolderMediaId);

  //   const postFolder = postFolders.find((postFolder) => postFolder.id === postFolderMedia!.post_folder_id);

  //   // Check the extension of the media by splitting the string and getting the last element of postFolderMedia.media_url
  //   const mediaExtension = postFolderMedia!.media_url.split('.').pop();

  //   if (mediaExtension === "mp4") {
  //     postFolder!.video_count--;
  //   } else {
  //     postFolder!.image_count--;
  //   }

  //   updatePostFolder(postFolder!);

  //   showAlert("Post folder media deleted successfully", "success");
  // }

  const value = useMemo<PostFolderMediaContextProps>(
    () => ({
      postFolderMedias,
      createPostFolderMedia,
      updatePostFolderMedia,
      loading,
    }),
    [postFolderMedias, createPostFolderMedia, updatePostFolderMedia, loading]
  )

  return <PostFolderMediaContext.Provider value={value}>{children}</PostFolderMediaContext.Provider>
}

export function usePostFolderMediaContext() {
  const context = useContext(PostFolderMediaContext);

  if (!context) {
    throw new Error("usePostFolderMediaContext must be used within a PostFolderMediaProvider");
  }

  return context;
}


