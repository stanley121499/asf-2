import { useEffect } from "react";
import { imageCache } from "../utils/imageCache";
import { isVideoUrl } from "../utils/mediaUtils";

/**
 * Programmatically preloads an array of image URLs by creating hidden Image
 * objects in memory. The browser caches these requests so when the
 * corresponding <img> element renders, it is served from the cache instantly.
 *
 * When each image finishes loading, its URL is written to the shared
 * `imageCache` Set. `SmartImage` / `SmartMedia` components check this Set on
 * mount — if the URL is already cached, they skip the skeleton shimmer and
 * display the image immediately.
 *
 * **Video URLs are automatically skipped** — they cannot be preloaded via the
 * Image constructor and their lazy-load / autoplay lifecycle is managed
 * entirely by the `SmartMedia` component's IntersectionObserver.
 *
 * @param urls - An array of media URLs to preload (videos are ignored).
 * @returns void
 */
export const useImagePreloader = (urls: string[]): void => {
  useEffect(() => {
    const images: HTMLImageElement[] = [];

    // Filter out:
    //  1. Empty strings
    //  2. Placeholder URLs (no point pre-fetching these)
    //  3. Video URLs (handled by SmartMedia's IntersectionObserver)
    const validImageUrls = urls.filter(
      (url) =>
        url !== "" &&
        !url.includes("via.placeholder.com") &&
        !isVideoUrl(url)
    );

    validImageUrls.forEach((url) => {
      // Skip URLs that are already cached — browser already has them
      if (imageCache.has(url)) return;

      const img = new Image();

      /**
       * On successful load, write the URL into the shared module-level cache.
       * This allows SmartMedia to skip the skeleton on any subsequent mount
       * for the same URL (e.g., the user scrolls back up, or the component
       * remounts).
       */
      img.onload = () => {
        imageCache.add(url);
      };

      img.src = url;
      images.push(img);
    });

    return () => {
      // Clear src so the browser can garbage-collect the Image objects
      images.forEach((img) => {
        img.src = "";
      });
    };
  }, [urls]);
};
