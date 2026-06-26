import { supabase } from "@/lib/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

/** Derives MIME type and category from a file URI and optional picker type hint. */
function resolveMediaInfo(
  uri: string,
  pickerType: string | undefined
): { mimeType: string; category: "image" | "video" } {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const isVideo =
    pickerType === "video" ||
    ext === "mp4" ||
    ext === "mov" ||
    ext === "webm";
  if (isVideo) {
    return {
      mimeType: ext === "mov" ? "video/quicktime" : "video/mp4",
      category: "video",
    };
  }
  return {
    mimeType:
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`,
    category: "image",
  };
}

/**
 * Uploads a local file URI to Supabase storage bucket `post_medias`.
 * Returns the public URL and media category ("image" | "video").
 */
export async function uploadMedia(
  uri: string,
  postId: string,
  pickerType: string | undefined
): Promise<{ url: string; category: "image" | "video" }> {
  const { mimeType, category } = resolveMediaInfo(uri, pickerType);
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${postId}/${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { data, error } = await supabase.storage
    .from("post_medias")
    .upload(storagePath, arrayBuffer, { contentType: mimeType, upsert: false });

  if (error !== null) {
    throw new Error(error.message);
  }

  return {
    url: `${SUPABASE_URL}/storage/v1/object/public/post_medias/${data.path}`,
    category,
  };
}
