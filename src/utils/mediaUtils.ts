/**
 * Video file extensions that Supabase Storage preserves in uploaded file URLs.
 * Used across the app to determine whether a media_url points to a video or image
 * without requiring a separate `media_type` DB column.
 */
const VIDEO_EXTENSIONS: readonly string[] = [
  ".mp4",
  ".webm",
  ".mov",
  ".ogg",
  ".m4v",
];

/**
 * isVideoUrl
 *
 * Returns `true` when the given URL points to a video file, based on the
 * file extension in the URL path. Query parameters (e.g., Supabase signed-URL
 * tokens) are stripped before checking so they don't interfere with detection.
 *
 * @param url - The media source URL to inspect
 * @returns `true` if the URL is a video, `false` for images and all other types
 *
 * @example
 * isVideoUrl("https://cdn.example.com/videos/promo.mp4?token=abc") // true
 * isVideoUrl("https://cdn.example.com/photos/hero.jpg")             // false
 */
export const isVideoUrl = (url: string): boolean => {
  const pathWithoutQuery = url.toLowerCase().split("?")[0] ?? "";
  return VIDEO_EXTENSIONS.some((ext) => pathWithoutQuery.endsWith(ext));
};
