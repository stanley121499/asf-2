import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { imageCache } from "../utils/imageCache";
import { isVideoUrl } from "../utils/mediaUtils";

/** Supported media types rendered by this component */
type MediaType = "image" | "video";

export interface SmartMediaProps {
  /** The media source URL (image or video) */
  src: string;
  /** Alt text for images / aria-label for videos */
  alt: string;
  /** Tailwind className applied to the wrapper div */
  className?: string;
  /**
   * Explicitly set the media type.
   * If omitted, the type is auto-detected from the URL file extension,
   * with an onError fallback for extensionless files.
   * Useful once a `media_type` DB column is added to `post_medias`.
   */
  mediaType?: MediaType;
  /**
   * How far before the viewport edge to begin loading / playing.
   * Default: "1200px 0px"
   */
  rootMargin?: string;
  /** Skip IntersectionObserver and load/play immediately */
  eager?: boolean;
}

/**
 * inferMediaType
 *
 * Delegates to the shared `isVideoUrl` utility so that video extension
 * detection is consistent across the entire app.
 */
const inferMediaType = (url: string): MediaType =>
  isVideoUrl(url) ? "video" : "image";

/**
 * SmartMedia — a unified, drop-in media component that handles both images
 * and videos with the same editorial polish as SmartImage.
 *
 * ## Images
 * - Session-level `imageCache` check: skips skeleton if already loaded.
 * - IntersectionObserver: begins loading 1200px before viewport entry.
 * - Smooth opacity fade-in on load.
 *
 * ## Videos
 * - IntersectionObserver-gated: the `<video>` element is not inserted into
 *   the DOM until the wrapper is within `rootMargin` of the viewport.
 * - Auto-plays silently (muted, loop, playsInline) for editorial/hero use.
 * - Same animate-pulse skeleton and opacity fade-in as images.
 * - If autoplay is blocked by the browser, the skeleton is shown gracefully.
 *
 * ## Type detection (two-stage, fully defensive)
 * Stage 1 — URL extension heuristic (fast, covers new uploads).
 * Stage 2 — onError fallback: if <img> fires onError (e.g., a video file
 *   uploaded before the extension fix, stored without `.mp4`), the component
 *   automatically re-renders as <video>. The skeleton re-shows briefly while
 *   the video buffers.
 */
const SmartMedia: React.FC<SmartMediaProps> = ({
  src,
  alt,
  className = "",
  mediaType,
  rootMargin = "1200px 0px",
  eager = false,
}) => {
  /**
   * resolvedType tracks the active media type. It starts from the prop or
   * URL heuristic, but can be overridden to "video" by the onError handler
   * when an extensionless video file is detected at runtime.
   */
  const [resolvedType, setResolvedType] = useState<MediaType>(
    () => mediaType ?? inferMediaType(src)
  );

  /**
   * For images only: check the session cache synchronously during state
   * initialisation. Videos are never stored in imageCache.
   */
  const isCachedOnMount =
    resolvedType === "image" && imageCache.has(src);

  const [isVisible, setIsVisible] = useState<boolean>(eager || isCachedOnMount);
  const [isLoaded, setIsLoaded] = useState<boolean>(isCachedOnMount);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * When the `src` prop changes, re-evaluate the media type from scratch
   * (prop takes precedence, then URL heuristic) and reset all loading state.
   */
  useEffect(() => {
    const newType = mediaType ?? inferMediaType(src);
    setResolvedType(newType);

    if (newType === "image" && imageCache.has(src)) {
      setIsVisible(true);
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src, mediaType]);

  /**
   * Set up the IntersectionObserver to gate DOM insertion of the media element.
   * Skipped entirely when `eager` is true or the image is already cached.
   */
  useEffect(() => {
    if (eager || isCachedOnMount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry !== undefined && entry.isIntersecting) {
          setIsVisible(true);
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
  }, [eager, isCachedOnMount, rootMargin]);

  /**
   * Once the video element is in the DOM (isVisible + resolvedType = video),
   * call .play(). Autoplay rejections (e.g. browser power-saving) are silently
   * ignored — the skeleton/poster covers the space gracefully.
   */
  useEffect(() => {
    if (resolvedType === "video" && isVisible && videoRef.current !== null) {
      void videoRef.current.play().catch(() => {
        // Autoplay blocked — poster/skeleton remains visible, no UI error
      });
    }
  }, [isVisible, resolvedType]);

  // Pause video when the page is hidden (screen off, app backgrounded)
  // to stop continuous GPU decode when the user is not watching.
  useEffect(() => {
    if (resolvedType !== "video") return;

    const handleVisibilityChange = (): void => {
      const video = videoRef.current;
      if (video === null) return;
      if (document.visibilityState === "hidden") {
        video.pause();
      } else if (isVisible) {
        void video.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resolvedType, isVisible]);

  /**
   * Called when an image finishes downloading.
   * Writes the URL to the shared session cache so future mounts skip the skeleton.
   */
  const handleImageLoad = (): void => {
    imageCache.add(src);
    setIsLoaded(true);
  };

  /**
   * Called when the browser cannot decode the src as an image.
   * This happens for video files uploaded without a file extension (legacy
   * Supabase files stored before the upload extension fix). We flip the
   * resolved type to "video" so React unmounts <img> and mounts <video>.
   * The skeleton re-shows while the video buffers.
   */
  const handleImageError = (): void => {
    setResolvedType("video");
    setIsLoaded(false);
  };

  /**
   * Called when a video has buffered enough to begin playing.
   * Triggers the fade-in to replace the skeleton.
   */
  const handleVideoCanPlay = (): void => {
    setIsLoaded(true);
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden ${className}`.trim()}
    >
      {/* Skeleton shimmer — animate-pulse until media is ready */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/*
       * IMAGE — only inserted into the DOM once within rootMargin of viewport.
       * Opacity animates from 0 → 1 when the browser fires onLoad.
       * onError fires for extensionless video files → triggers video fallback.
       */}
      {isVisible && resolvedType === "image" && (
        <Image
          src={src}
          alt={alt || ""}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/*
       * VIDEO — inserted once within rootMargin; plays silently and loops.
       * `playsInline` is required for autoplay on iOS Safari.
       * `preload="metadata"` fetches only duration/dimensions until play() fires.
       * Opacity animates from 0 → 1 on `canplay` event.
       */}
      {isVisible && resolvedType === "video" && (
        <video
          ref={videoRef}
          src={src}
          aria-label={alt}
          muted
          playsInline
          preload="metadata"
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onCanPlay={handleVideoCanPlay}
        />
      )}
    </div>
  );
};

export default SmartMedia;
