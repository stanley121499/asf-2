import { supabase } from "@/lib/supabase";

/** Supabase Storage bucket for warranty claim photo evidence. */
export const CLAIM_EVIDENCE_BUCKET = "claim_evidence";

/** Maximum photos a customer may attach to one claim. */
export const MAX_CLAIM_EVIDENCE_PHOTOS = 10;

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

/**
 * Creates a per-form session id used as the middle path segment before claim creation.
 */
export function createClaimEvidenceSessionId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${randomPart}`;
}

/**
 * Derives a file extension from a local URI or MIME type.
 */
function resolveImageExtension(uri: string, mimeType: string | null | undefined): string {
  const uriExt = uri.split(".").pop()?.toLowerCase();
  if (uriExt === "jpg" || uriExt === "jpeg" || uriExt === "png" || uriExt === "webp" || uriExt === "heic") {
    return uriExt === "jpeg" ? "jpg" : uriExt;
  }
  if (mimeType === "image/png") {
    return "png";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  if (mimeType === "image/heic") {
    return "heic";
  }
  return "jpg";
}

/**
 * Uploads one local image to `claim_evidence/{userId}/{sessionId}/{filename}`.
 * Returns the public URL stored in `claims.evidence_urls`.
 */
export async function uploadClaimEvidencePhoto(
  uri: string,
  userId: string,
  sessionId: string,
  mimeType: string | null | undefined
): Promise<string> {
  const ext = resolveImageExtension(uri, mimeType);
  const contentType = mimeType ?? (ext === "png" ? "image/png" : "image/jpeg");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const storagePath = `${userId}/${sessionId}/${filename}`;

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read local image (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();

  const { data, error } = await supabase.storage
    .from(CLAIM_EVIDENCE_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (error !== null) {
    throw new Error(error.message);
  }

  if (SUPABASE_URL.length > 0) {
    return `${SUPABASE_URL}/storage/v1/object/public/${CLAIM_EVIDENCE_BUCKET}/${data.path}`;
  }

  const { data: publicData } = supabase.storage.from(CLAIM_EVIDENCE_BUCKET).getPublicUrl(data.path);
  return publicData.publicUrl;
}

/**
 * Uploads all selected local photos and returns public URLs in the same order.
 */
export async function uploadClaimEvidencePhotos(
  photos: ReadonlyArray<{ uri: string; mimeType: string | null | undefined }>,
  userId: string,
  sessionId: string,
  onProgress?: (uploaded: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = [];
  const total = photos.length;

  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index];
    const url = await uploadClaimEvidencePhoto(photo.uri, userId, sessionId, photo.mimeType);
    urls.push(url);
    onProgress?.(index + 1, total);
  }

  return urls;
}
