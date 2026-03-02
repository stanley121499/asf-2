import { useEffect } from "react";

/**
 * Programmatically preloads an array of image URLs by creating hidden Image objects in memory.
 * The browser caches these requests so when the corresponding <img> element renders,
 * it is served from the cache instantly.
 *
 * @param urls - An array of image URLs to preload.
 * @returns void
 */
export const useImagePreloader = (urls: string[]): void => {
  useEffect(() => {
    const images: HTMLImageElement[] = [];

    const validUrls = urls.filter(
      (url) => url !== "" && !url.includes("via.placeholder.com")
    );

    validUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      images.push(img);
    });

    return () => {
      images.forEach((img) => {
        img.src = "";
      });
    };
  }, [urls]);
};
