import React, { useEffect, useRef, useState } from "react";
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
 * A lightweight media thumbnail that renders images as `<img>` and videos
 * as a **still first-frame preview** — no native browser play button,
 * no download of the full file, no autoplay.
 *
 * ## Type detection strategy (two-stage, fully defensive)
 *
 * Stage 1 — URL extension heuristic:
 *   If the URL ends with a known video extension (.mp4, .webm, .mov …)
 *   we render a `<video>` immediately.
 *
 * Stage 2 — onError fallback:
 *   For extensionless files (uploaded before the extension-preservation
 *   fix), the <img> will fire onError when the browser receives video
 *   bytes. We flip `renderAsVideo` to true and re-render as `<video>`.
 *
 * ## Suppressing the native Android/iOS play overlay
 *
 * When a `<video>` is not playing, Android Chrome and Samsung Internet
 * both paint a large centred ▶ button as a native OS overlay. You cannot
 * remove it with CSS. The standard trick used by all major video platforms
 * (YouTube, TikTok, Facebook) is:
 *
 *   1. Add `#t=0.001` to the src → browser seeks to 1ms on load.
 *   2. Also call `videoRef.current.currentTime = 0.001` inside
 *      `onLoadedMetadata` as a belt-and-braces fallback.
 *
 * Seeking away from t=0 causes the browser to commit the first video frame
 * to its compositor layer, eliminating the "nothing loaded yet" play
 * overlay. The `<video>` then looks like a static image.
 *
 * `preload="metadata"` limits the initial network request to just the
 * container headers and first few frames — no full file download.
 *
 * A small ▶ badge (bottom-left, custom styled) is kept so editors and
 * home-page cards can still identify video at a glance. The parent must
 * apply `position: relative` to the wrapper so the badge stacks correctly.
 */
const MediaThumb: React.FC<MediaThumbProps> = ({
  src,
  alt,
  className = "",
  style,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Start as video if the URL extension tells us so; otherwise start as
   * image and let the onError handler upgrade to video if needed.
   */
  const [renderAsVideo, setRenderAsVideo] = useState<boolean>(
    () => isVideoUrl(src)
  );

  /**
   * When the src prop changes, re-evaluate the initial render mode so
   * the correct element renders straight away.
   */
  useEffect(() => {
    setRenderAsVideo(isVideoUrl(src));
  }, [src]);

  /**
   * Called when the <img> element fires onError — happens when the browser
   * receives video bytes for an extensionless Supabase file.
   * Flipping renderAsVideo causes React to unmount <img> and mount <video>.
   */
  const handleImageError = (): void => {
    setRenderAsVideo(true);
  };

  /**
   * Seek to 0.001s once the browser has parsed the video metadata.
   *
   * This is the key fix for the Android native play-button overlay:
   * browsers only paint the centred ▶ when `currentTime === 0` and no
   * frame has been composited yet. Seeking to any non-zero timestamp
   * forces the first frame to be rendered and the overlay disappears.
   *
   * Belt-and-braces: the src already has `#t=0.001` appended (see render),
   * but `onLoadedMetadata` fires regardless of the fragment and is more
   * reliable across all WebView versions found on Android devices.
   */
  const handleLoadedMetadata = (): void => {
    if (videoRef.current !== null) {
      videoRef.current.currentTime = 0.001;
    }
  };

  /** Small ▶ badge — bottom-left, so it doesn't cover the subject */
  const PlayBadge: React.FC = () => (
    <div className="absolute bottom-1 left-1 bg-black/60 rounded-full p-1 pointer-events-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        className="w-3 h-3"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );

  if (renderAsVideo) {
    return (
      <>
        <video
          ref={videoRef}
          /*
           * #t=0.001 — URL fragment that tells the browser to seek to 1ms
           * on initial load. Combined with onLoadedMetadata this reliably
           * suppresses the native Android ▶ overlay on all tested browsers
           * (Chrome 120+, Samsung Internet 24, Mi Browser).
           */
          src={`${src}#t=0.001`}
          aria-label={alt}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
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
      loading="lazy"
      decoding="async"
      onError={handleImageError}
    />
  );
};

export default MediaThumb;
