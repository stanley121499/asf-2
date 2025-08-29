import { supabase } from "./supabaseClient";

/**
 * Upload a file to Supabase Storage bucket "medias" and return a public URL.
 * Ensures deterministic pathing and safe filenames.
 */
export async function uploadToMedias(file: File, folder: string = "misc"): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error("uploadToMedias: invalid file");
  }

  const timestamp = Date.now();
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const path = `${folder}/${timestamp}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("medias")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });
  if (uploadError) {
    throw new Error(`uploadToMedias: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from("medias").getPublicUrl(path);
  return data.publicUrl;
}


