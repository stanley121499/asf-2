import React, { useState, useEffect, useRef } from "react";
import { imageCache } from "../utils/imageCache";

export interface SmartImageProps {
  /** The image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Tailwind className applied to the wrapper div */
  className?: string;
  /**
   * How far before the viewport edge to begin loading.
   * Set generously so fast-scrolling users have images ready before they arrive.
   * Default: "1200px 0px"
   */
  rootMargin?: string;
  /** If true, load immediately without waiting for the IntersectionObserver */
  eager?: boolean;
}

/**
 * A drop-in replacement for the standard <img> tag with two key behaviours:
 *
 * 1. **Smart preloading** — uses IntersectionObserver to begin loading the image
 *    1200px before it enters the viewport, giving fast-scrolling users time to
 *    have the image ready before they reach it.
 *
 * 2. **Session-level caching** — on first load, writes the URL to a shared
 *    module-level `imageCache` Set. On any subsequent mount (e.g., the user
 *    scrolls back up, or React remounts the component), it reads the cache and
 *    skips the skeleton shimmer entirely, displaying the image instantly.
 *
 * Shows an `animate-pulse` skeleton while loading and a smooth opacity fade-in
 * when the image is ready.
 */
const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = "",
  rootMargin = "1200px 0px",
  eager = false,
}) => {
  /**
   * Check the module-level cache synchronously during state initialisation.
   * If the URL was loaded earlier in this session, both flags start as true —
   * no skeleton, no observer, image renders instantly.
   */
  const isCachedOnMount = imageCache.has(src);

  const [isVisible, setIsVisible] = useState<boolean>(eager || isCachedOnMount);
  const [isLoaded, setIsLoaded] = useState<boolean>(isCachedOnMount);

  const wrapperRef = useRef<HTMLDivElement>(null);

  /**
   * Synchronise isVisible and isLoaded whenever the `src` prop changes.
   *
   * `useState` initialiser only runs on the first mount. If the parent passes
   * a different `src` after mount (e.g., because a context finished loading),
   * the state flags become stale. This effect corrects that by re-checking the
   * cache for the new URL and either showing it instantly (cache hit) or
   * resetting to the loading state (cache miss) so the skeleton shows correctly.
   *
   * This also covers the "scroll back" case when the component was somehow
   * remounted: the cache check makes the image appear without a skeleton.
   */
  useEffect(() => {
    if (imageCache.has(src)) {
      setIsVisible(true);
      setIsLoaded(true);
    } else {
      // New src not yet in cache — reset loaded flag so skeleton shows while
      // the image downloads. Keep isVisible if the IO already fired.
      setIsLoaded(false);
    }
  }, [src]);

  /**
   * Set up the IntersectionObserver to trigger loading before the element
   * enters the viewport. Skipped entirely if eager or src is already cached.
   */
  useEffect(() => {
    // Already visible (eager or cache hit) — no observer needed
    if (eager || imageCache.has(src)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry !== undefined && entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing once triggered — we only need one fire
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (wrapperRef.current !== null) {
      observer.observe(wrapperRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [eager, src, rootMargin]);

  /**
   * Called when the browser finishes downloading the image.
   * Writes the URL to the shared cache so future mounts of this component
   * (e.g., scroll back, re-render) can skip the skeleton entirely.
   */
  const handleLoad = (): void => {
    imageCache.add(src);
    setIsLoaded(true);
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden ${className}`.trim()}
    >
      {/* Skeleton shimmer — hidden once the image is loaded */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/*
       * Only render the <img> once the element is within rootMargin of the viewport.
       * Until then, no <img> exists in the DOM so the browser never sees the src.
       */}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          decoding="async"
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleLoad}
        />
      )}
    </div>
  );
};

export default SmartImage;
