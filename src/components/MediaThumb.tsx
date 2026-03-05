import React, { useEffect, useState } from "react";
import { isVideoUrl } from "../utils/mediaUtils";

export interface MediaThumbProps {
  /** The media source URL — image or video */
  src: string;
  /** Alt text for images / aria-label for videos */
  alt: string;
  /** Tailwind / inline className applied to both <img> and <video> */
  className?: string;
  /** Inline style applied to both <img> and <video> (e.g., dynamic height) */
  style?: React.CSSProperties;
}

/**
 * MediaThumb
 *
 * A lightweight media thumbnail used inside admin editor panels
 * (post-editor, product-editor). Unlike SmartMedia it has no
 * IntersectionObserver or imageCache — editors deal with a small
 * fixed set of items so eager loading is always acceptable.
 *
 * ## Type detection strategy (two-stage, fully defensive)
 *
 * Stage 1 — URL extension heuristic:
 *   If the URL ends with a known video extension (.mp4, .webm, .mov …)
 *   we render a `<video>` immediately. This is fast and covers all
 *   newly-uploaded files (upload code now preserves the extension).
 *
 * Stage 2 — onError fallback:
 *   For files uploaded *before* the extension fix (stored in Supabase
 *   without an extension, e.g. "dhyliwkovu"), the URL extension check
 *   will fail and we'll try `<img>` first. When the browser fires
 *   `onError` (because the server returns video/mp4 bytes), we flip
 *   `renderAsVideo` to true and re-render as `<video>` automatically.
 *   The user never sees a broken image — just a brief blank frame
 *   before the video thumbnail appears.
 *
 * A small ▶ badge is shown over videos so editors can distinguish
 * video from photo at a glance.
 *
 * The parent is responsible for adding `position: relative` (or
 * the `relative` Tailwind class) to the wrapper div so that the
 * play badge and any tick/index overlays stack correctly.
 */
const MediaThumb: React.FC<MediaThumbProps> = ({
  src,
  alt,
  className = "",
  style,
}) => {
  /**
   * Start as video if the URL extension tells us so; otherwise start as
   * image and let the onError handler upgrade to video if needed.
   */
  const [renderAsVideo, setRenderAsVideo] = useState<boolean>(
    () => isVideoUrl(src)
  );

  /**
   * When the src prop changes (e.g., parent re-renders with a different URL),
   * re-evaluate the initial type so the correct element renders straight away.
   */
  useEffect(() => {
    setRenderAsVideo(isVideoUrl(src));
  }, [src]);

  /**
   * Called when the <img> element fires onError.
   * This happens when the browser receives bytes it cannot decode as an image
   * — which is exactly what occurs for extensionless video files stored in
   * Supabase (the bucket serves video/mp4 bytes with no file extension hint).
   * Flipping renderAsVideo causes React to unmount the <img> and mount
   * a <video> in its place.
   */
  const handleImageError = (): void => {
    setRenderAsVideo(true);
  };

  /** Play badge — shown over every video thumbnail */
  const PlayBadge: React.FC = () => (
    <div className="absolute bottom-1 left-1 bg-black/60 rounded-full p-1 pointer-events-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        className="w-3 h-3">
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );

  if (renderAsVideo) {
    return (
      <>
        {/*
         * preload="metadata" tells the browser to fetch only the first
         * few frames so the <video> shows a still thumbnail without
         * downloading the entire file.
         */}
        <video
          src={src}
          aria-label={alt}
          muted
          playsInline
          preload="metadata"
          className={className}
          style={style}
        />
        <PlayBadge />
      </>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={handleImageError}
    />
  );
};

export default MediaThumb;
