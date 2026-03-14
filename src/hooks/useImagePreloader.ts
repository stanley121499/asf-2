import { useEffect } from "react";
import { imageCache } from "../utils/imageCache";
import { isVideoUrl } from "../utils/mediaUtils";

/**
 * Maximum number of images to load concurrently.
 * This prevents a single page mount from saturating the network radio
 * and triggering simultaneous GPU image decodes (a common cause of
 * phone overheating on media-heavy pages).
 */
const CONCURRENT_PRELOAD_LIMIT = 4;

/**
 * Programmatically preloads an array of image URLs in sequential chunks
 * of up to CONCURRENT_PRELOAD_LIMIT at a time.
 *
 * Each batch waits for all images in the current chunk to either load
 * or error before starting the next chunk. This keeps CPU/network usage
 * bounded rather than spiking to N parallel downloads on mount.
 *
 * When each image finishes loading, its URL is written to the shared
 * `imageCache` Set. `SmartImage` / `SmartMedia` components check this Set
 * on mount — if the URL is already cached, they skip the skeleton shimmer
 * and display the image immediately.
 *
 * **Video URLs are automatically skipped** — they cannot be preloaded via
 * the Image constructor.
 *
 * @param urls - An array of media URLs to preload (videos are ignored).
 */
export const useImagePreloader = (urls: string[]): void => {
  useEffect(() => {
    let cancelled = false;

    const validImageUrls = urls.filter(
      (url) =>
        url !== "" &&
        !url.includes("via.placeholder.com") &&
        !isVideoUrl(url) &&
        !imageCache.has(url) // Skip already-cached URLs immediately
    );

    if (validImageUrls.length === 0) return;

    const allImages: HTMLImageElement[] = [];

    /**
     * Load one chunk of up to CONCURRENT_PRELOAD_LIMIT images.
     * Returns a Promise that resolves when every image in the chunk
     * has either loaded or errored.
     */
    const loadChunk = (chunk: string[]): Promise<void> => {
      return new Promise<void>((resolve) => {
        if (chunk.length === 0) {
          resolve();
          return;
        }

        let settled = 0;

        const onSettled = (): void => {
          settled += 1;
          if (settled === chunk.length) resolve();
        };

        chunk.forEach((url) => {
          const img = new Image();
          img.onload = () => {
            imageCache.add(url);
            onSettled();
          };
          img.onerror = onSettled; // Still advance even on failure
          img.src = url;
          allImages.push(img);
        });
      });
    };

    /**
     * Sequentially process chunks. Each chunk starts only after the previous
     * one settles, bounding concurrent downloads to CONCURRENT_PRELOAD_LIMIT.
     */
    const runChunks = async (): Promise<void> => {
      for (let i = 0; i < validImageUrls.length; i += CONCURRENT_PRELOAD_LIMIT) {
        if (cancelled) break;
        const chunk = validImageUrls.slice(i, i + CONCURRENT_PRELOAD_LIMIT);
        await loadChunk(chunk);
      }
    };

    void runChunks();

    return () => {
      cancelled = true;
      // Clear src so the browser can garbage-collect the Image objects
      allImages.forEach((img) => {
        img.src = "";
      });
    };
  }, [urls]);
};
