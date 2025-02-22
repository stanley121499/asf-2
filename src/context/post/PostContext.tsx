import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";
import { PostMedia } from "./PostMediaContext";

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
  loading: boolean;
}

const PostContext = createContext<PostContextProps>(undefined!);

export function PostProvider({ children }: PropsWithChildren) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchPosts = async () => {
      const { data: posts, error } = await supabase.from("posts").select("*");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setPosts(posts);
    };

    fetchPosts();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setPosts((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setPosts((prev) =>
          prev.map((post) => (post.id === payload.new.id ? payload.new : post))
        );
      }

      if (payload.eventType === "DELETE") {
        setPosts((prev) => prev.filter((post) => post.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createPost = async (post: PostInsert) => {
    const { data, error } = await supabase.from("posts").insert(post).select();

    if (error) {
      showAlert(error.message, "error");
    }

    return data?.[0];
  };

  const updatePost = async (post: PostUpdate) => {
    const { error } = await supabase
      .from("posts")
      .update(post)
      .eq("id", post.id)
      .single();

    if (error) {
      console.log(error);
      showAlert(error.message, "error");
    }
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      console.log(error);
      showAlert(error.message, "error");
    }
  };

  return (
    <PostContext.Provider
      value={{ posts, createPost, updatePost, deletePost, loading }}>
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
