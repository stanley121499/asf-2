import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";
import { usePostFolderMediaContext } from "./PostFolderMediaContext";

export type PostFolder = Database["public"]["Tables"]["post_folders"]["Row"] & {
  medias: Database["public"]["Tables"]["post_folder_medias"]["Row"][];
}
export type PostFolderInsert = Database["public"]["Tables"]["post_folders"]["Insert"];
export type PostFolderUpdate = Database["public"]["Tables"]["post_folders"]["Update"];

interface PostFolderContextProps {
  postFolders: PostFolder[];
  createPostFolder: (postFolder: PostFolderInsert) => Promise<PostFolder|undefined>;
  updatePostFolder: (postFolder: PostFolderUpdate) => Promise<void>;
  deletePostFolder: (postFolderId: string) => Promise<void>;
  loading: boolean;
}

const PostFolderContext = createContext<PostFolderContextProps>(undefined!);

export function PostFolderProvider({ children }: PropsWithChildren) {
  const [postFolders, setPostFolders] = useState<PostFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { postFolderMedias } = usePostFolderMediaContext();

  useEffect(() => {
    setLoading(true);

    const fetchPostFolders = async () => {
      const { data, error } = await supabase
        .from("post_folders")
        .select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      const folders = (data ?? []).map((pf) => ({
        ...pf,
        medias: postFolderMedias.filter(
          (media) => media.post_folder_id === pf.id
        ),
      })) as PostFolder[];

      setPostFolders(folders);
    };

    fetchPostFolders();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setPostFolders((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setPostFolders((prev) =>
          prev.map((postFolder) => (postFolder.id === payload.new.id ? payload.new : postFolder))
        );
      }

      if (payload.eventType === "DELETE") {
        setPostFolders((prev) => prev.filter((postFolder) => postFolder.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel("post_folders")
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_folders' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [postFolderMedias, showAlert]);

  const createPostFolder = async (postFolder: PostFolderInsert) => {
    const { data, error } = await supabase.from("post_folders").insert(postFolder).select();

    if (error) {
      console.error(error);
      showAlert(error.message, "error");
      return;
    }

    console.log("Data", data);

    showAlert("Post folder created successfully", "success");

    const row = data?.[0] && { ...data[0], medias: [] } as PostFolder;
    return row;
  };

  const updatePostFolder = async (postFolder: PostFolderUpdate) => {
    const { error } = await supabase
      .from("post_folders")
      .update(postFolder)
      .match({ id: postFolder.id });

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Post folder updated successfully", "success");
  };

  const deletePostFolder = async (postFolderId: string) => {
    const { error } = await supabase.from("post_folders").delete().match({ id: postFolderId });

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Post folder deleted successfully", "success");
  }

  return (
    <PostFolderContext.Provider value={{ postFolders, createPostFolder, updatePostFolder, deletePostFolder, loading }}>
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