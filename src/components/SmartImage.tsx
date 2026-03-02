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
   * If the URL was loaded earlier in this session, `isCached` will be true and
   * both flags are set to true from the start — no skeleton, no observer.
   */
  const isCached = imageCache.has(src);

  const [isVisible, setIsVisible] = useState<boolean>(eager || isCached);
  const [isLoaded, setIsLoaded] = useState<boolean>(isCached);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If eager or already cached, no need for the IntersectionObserver
    if (eager || isCached) return;

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
    // isCached is evaluated once at mount from module-level state — intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eager, rootMargin]);

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
