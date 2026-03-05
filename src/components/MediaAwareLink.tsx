import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { isVideoUrl } from "../utils/mediaUtils";
import VideoLightboxModal from "./VideoLightboxModal";

export interface MediaAwareLinkProps {
  /**
   * The route to navigate to when:
   * - Media is an image → immediate navigation (same as <Link to>)
   * - Media is a video → shown as the CTA target inside the lightbox modal
   */
  to: string;
  /**
   * The primary media URL for this link.
   * Used to determine whether to navigate directly (image) or open the
   * video lightbox first (video).
   */
  mediaSrc: string;
  /**
   * Caption shown inside the video lightbox and used as the video's
   * aria-label. Pass the post caption or section title.
   */
  caption?: string;
  /**
   * CTA button label inside the video lightbox.
   * Defaults to "SHOP THE EDIT".
   */
  ctaLabel?: string;
  /** className applied to the outer wrapper element */
  className?: string;
  /** Inline styles applied to the outer wrapper element */
  style?: React.CSSProperties;
  /** Content rendered inside the link / wrapper */
  children: React.ReactNode;
}

/**
 * MediaAwareLink
 *
 * A smart drop-in replacement for `<Link>` that intercepts clicks on
 * video media and shows a `VideoLightboxModal` first, rather than
 * navigating immediately.
 *
 * ## Media-type detection (two-pass)
 *
 * **Pass 1 — Extension check (synchronous, instant):**
 *   If `mediaSrc` ends in a known video extension (.mp4, .webm, .mov …),
 *   the component is immediately set to video mode. No network probe needed.
 *
 * **Pass 2 — Image probe (async, handles extensionless files):**
 *   For URLs without a recognised video extension (e.g. files uploaded
 *   before the extension-preservation fix), we fire a hidden `new Image()`
 *   request:
 *   - `onload`  → confirmed image → direct `<Link>` navigation
 *   - `onerror` → load failed (video or 404) → treat as video, show modal
 *
 *   While the probe is in flight the component uses the optimistic result
 *   of the extension check (usually "image" = safe default). In practice the
 *   probe resolves before the user has a chance to click because the
 *   `SmartMedia` / `MediaThumb` inside the children already triggered a
 *   network request for the same URL, so the browser either has it cached
 *   or the probe races with the media element fetch.
 *
 * ## Behaviour by media type
 *
 * **Image URL:**
 *   Renders a standard React Router `<Link>` — identical behaviour to before.
 *
 * **Video URL:**
 *   Renders a `<div role="button">` that opens `VideoLightboxModal` on click.
 *   The modal:
 *     - Plays the video with native controls (muted autoplay, user can unmute)
 *     - Shows a localised CTA that navigates to `to` and closes the modal
 *     - Can be dismissed with the ✕ button, backdrop tap, or Escape key
 *
 * ## Usage
 * ```tsx
 * <MediaAwareLink
 *   to="/product-section"
 *   mediaSrc={post.medias?.[0]?.media_url ?? ""}
 *   caption={post.caption ?? ""}
 *   className="relative block"
 * >
 *   <SmartMedia src={...} className="w-full h-[75vh] object-cover" />
 *   <div className="absolute inset-0 pointer-events-none">...</div>
 * </MediaAwareLink>
 * ```
 */
const MediaAwareLink: React.FC<MediaAwareLinkProps> = ({
  to,
  mediaSrc,
  caption = "",
  ctaLabel = "SHOP THE EDIT",
  className = "",
  style,
  children,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  /**
   * isVideo state — initialised via fast extension check; may be refined
   * asynchronously by the image probe below.
   */
  const [isVideo, setIsVideo] = useState<boolean>(isVideoUrl(mediaSrc));

  /**
   * Two-pass media-type resolution.
   *
   * If the extension already tells us it's a video we skip the probe entirely.
   * Otherwise we fire a hidden Image() request to confirm it's actually an
   * image. If that request errors (which it will for video bytes), we flip
   * isVideo to true so subsequent clicks show the modal instead of navigating.
   */
  useEffect(() => {
    // Re-evaluate whenever mediaSrc changes
    if (isVideoUrl(mediaSrc)) {
      setIsVideo(true);
      return;
    }

    // Reset to optimistic default while probing
    setIsVideo(false);

    const img = new Image();

    img.onload = (): void => {
      // Confirmed renderable as an image — keep isVideo false
      setIsVideo(false);
    };

    img.onerror = (): void => {
      // Image failed to load → likely a video or extensionless video file
      setIsVideo(true);
    };

    img.src = mediaSrc;

    return (): void => {
      // Prevent stale state updates if mediaSrc changes before probe completes
      img.onload = null;
      img.onerror = null;
    };
  }, [mediaSrc]);

  const handleOpen = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault();
      setLightboxOpen(true);
    },
    []
  );

  const handleClose = useCallback((): void => {
    setLightboxOpen(false);
  }, []);

  /* ── Image path — plain <Link>, zero overhead ────────────────────── */
  if (!isVideo) {
    return (
      <Link to={to} className={className} style={style}>
        {children}
      </Link>
    );
  }

  /* ── Video path — intercept click, show lightbox first ───────────── */
  return (
    <>
      {/*
       * We use a <div> instead of <Link> because we want to intercept the
       * click and not navigate immediately. The cursor-pointer class keeps
       * the tap target feeling interactive.
       */}
      <div
        role="button"
        tabIndex={0}
        className={`cursor-pointer ${className}`.trim()}
        style={style}
        onClick={handleOpen}
        onKeyDown={(e: React.KeyboardEvent): void => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setLightboxOpen(true);
          }
        }}
        aria-label={caption !== "" ? `Play video: ${caption}` : "Play video"}
      >
        {children}
      </div>

      {/* Portal-like modal — z-50 stacks above all page content */}
      {lightboxOpen && (
        <VideoLightboxModal
          src={mediaSrc}
          caption={caption}
          navigateTo={to}
          ctaLabel={ctaLabel}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default MediaAwareLink;
