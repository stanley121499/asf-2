import React, { useState, useEffect } from "react";
import Image from "next/image";
import { imageCache } from "../utils/imageCache";

export interface SmartImageProps {
  /** The image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Tailwind className applied to the wrapper div */
  className?: string;
  /**
   * @deprecated No longer used — native loading="lazy" is used instead of
   * IntersectionObserver. Kept for backwards-compat so existing callers don't
   * need updating.
   */
  rootMargin?: string;
  /** If true, use loading="eager" (for above-fold LCP images) */
  eager?: boolean;
}

/**
 * A drop-in replacement for the standard <img> tag with two behaviours:
 *
 * 1. **Native lazy loading** — uses the browser's built-in `loading="lazy"`
 *    attribute instead of a custom IntersectionObserver. The browser's native
 *    implementation is aware of scroll velocity and works correctly during fast
 *    momentum scroll on mobile (IntersectionObserver callbacks are throttled on
 *    mobile during fast scroll, causing images to never insert into the DOM).
 *
 * 2. **Session-level caching** — on first load, writes the URL to a shared
 *    module-level `imageCache` Set. On any subsequent mount the cache is checked
 *    synchronously and the skeleton is skipped — image renders instantly.
 *
 * Shows an `animate-pulse` skeleton while loading and a smooth opacity fade-in
 * when the image is ready.
 */
const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = "",
  eager = false,
}) => {
  /**
   * Check the module-level cache synchronously during state initialisation.
   * If the URL was loaded earlier in this session, isLoaded starts true —
   * no skeleton, image renders instantly.
   */
  const isCachedOnMount = imageCache.has(src);
  const [isLoaded, setIsLoaded] = useState<boolean>(isCachedOnMount);

  /**
   * Synchronise isLoaded whenever the src prop changes.
   */
  useEffect(() => {
    if (imageCache.has(src)) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  /**
   * Called when the browser finishes downloading the image.
   * Writes the URL to the shared cache so future mounts skip the skeleton.
   */
  const handleLoad = (): void => {
    imageCache.add(src);
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`.trim()}>
      {/* Skeleton shimmer — hidden once the image is loaded */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/*
       * The <Image> component uses Next.js image optimization.
       */}
      <Image
        src={src || "/default-image.jpg"}
        alt={alt}
        priority={eager}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={`object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={handleLoad}
      />
    </div>
  );
};

export default SmartImage;
