"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { useRouter } from "next/navigation";

export interface VideoLightboxModalProps {
  /** The video URL to play inside the modal */
  src: string;
  /** Caption / title overlaid on the video (bottom area) */
  caption: string;
  /** Route to navigate to when the CTA button is pressed */
  navigateTo: string;
  /** Label for the CTA button — defaults to "SHOP THE EDIT" */
  ctaLabel?: string;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * VideoLightboxModal
 *
 * A true full-screen video player inspired by Facebook Reels / TikTok.
 *
 * ## Key architecture decisions
 *
 * ### React Portal
 * The modal is rendered via `ReactDOM.createPortal` directly into
 * `document.body`, completely escaping the component tree. This means no
 * parent padding, margin, CSS transform, or `overflow: hidden` can ever
 * clip or offset the modal — it always covers the full viewport.
 *
 * ### Sound handling
 * Browsers block autoplay with audio. We start the video **muted** so it
 * autoplays immediately, then show a speaker toggle button so the user can
 * unmute with a single tap — the same pattern used by TikTok, Instagram
 * Reels, and Facebook Video.
 *
 * ## Layout
 * ```
 * ┌─────────────────────────────┐  ← portal → document.body, fixed inset-0
 * │  [✕]              [🔇/🔊]  │  ← top overlay: close + mute toggle
 * │                             │
 * │        <video> object-cover │  ← fills 100vw × 100vh, tap to close
 * │                             │
 * │ ░░░░░░░ gradient scrim ░░░░ │
 * │       caption text          │  ← bottom overlay
 * │   [    SHOP THE EDIT    ]   │
 * │        继续浏览              │
 * └─────────────────────────────┘
 * ```
 */
const VideoLightboxModal: React.FC<VideoLightboxModalProps> = ({
  src,
  caption,
  navigateTo,
  ctaLabel = "SHOP THE EDIT",
  onClose,
}) => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Mute state — start muted so autoplay is never blocked by the browser.
   * The user can tap the speaker icon to unmute.
   */
  const [isMuted, setIsMuted] = useState<boolean>(true);

  /** Lock body scroll while the modal is open */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return (): void => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  /** Close on Escape key */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return (): void => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  /** Keep the video element's muted property in sync with state */
  useEffect(() => {
    if (videoRef.current !== null) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  /** Toggle mute/unmute */
  const handleMuteToggle = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
  }, []);

  /** Pause video and invoke the parent's close callback */
  const handleClose = useCallback((): void => {
    if (videoRef.current !== null) {
      videoRef.current.pause();
    }
    onClose();
  }, [onClose]);

  /** Pause video, close modal, then navigate to the intended page */
  const handleShopNow = useCallback((): void => {
    if (videoRef.current !== null) {
      videoRef.current.pause();
    }
    onClose();
    router.push(navigateTo);
  }, [router, navigateTo, onClose]);

  /* ── Modal markup ──────────────────────────────────────────────────── */
  const modal = (
    /*
     * Root — `fixed inset-0` covers the full viewport.
     * Because this is rendered in a Portal (document.body), no ancestor's
     * padding, transform, or overflow can clip or shift this element.
     */
    <div
      className="fixed inset-0 z-[9999] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={caption.trim().length > 0 ? `Video: ${caption}` : "Video player"}
    >
      {/* ── Video — covers 100vw × 100vh ──────────────────────────────────
       *  object-cover fills every pixel regardless of the video's aspect
       *  ratio.  Tapping the video itself closes the modal.
       */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted          /* must be muted for autoplay; toggled via state */
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        aria-label={caption.trim().length > 0 ? caption : "Featured video"}
        onClick={handleClose}
      />

      {/* ── Top overlay — close button + mute toggle ──────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pointer-events-none">
        {/* Top gradient scrim so icons stay readable over bright video */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />

        {/* ✕ Close */}
        <button
          onClick={handleClose}
          className="relative pointer-events-auto w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 active:scale-95 transition-all duration-200"
          aria-label="Close video"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 🔇/🔊 Mute toggle — same style as close button */}
        <button
          onClick={handleMuteToggle}
          className="relative pointer-events-auto w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 active:scale-95 transition-all duration-200"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            /* Speaker with X — muted */
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" />
              <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
            </svg>
          ) : (
            /* Speaker with waves — unmuted */
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Bottom overlay — gradient scrim + caption + CTA ──────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pt-24 pb-10 sm:pb-8">

          {/* Caption text */}
          {caption.trim().length > 0 && (
            <p className="text-white text-base font-medium leading-snug mb-5 text-center drop-shadow-md">
              {caption}
            </p>
          )}

          {/* Primary CTA */}
          <button
            onClick={handleShopNow}
            className="pointer-events-auto w-full py-3.5 bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-gray-100 active:scale-[0.98] transition-all duration-200 shadow-lg"
          >
            {ctaLabel}
          </button>

          {/* Secondary dismiss */}
          <button
            onClick={handleClose}
            className="pointer-events-auto w-full mt-3 py-2 text-xs text-white/70 uppercase tracking-widest hover:text-white transition-colors duration-200 text-center"
          >
            继续浏览
          </button>
        </div>
      </div>
    </div>
  );

  /*
   * Portal — renders `modal` directly as a child of <body>, completely
   * outside of the React component tree's DOM position. This guarantees:
   *   • No parent padding / margin offsets the modal
   *   • No ancestor `overflow: hidden` clips it
   *   • No CSS transform on an ancestor shifts `fixed` positioning
   * The modal will always be a true 100vw × 100vh overlay.
   */
  return ReactDOM.createPortal(modal, document.body);
};

export default VideoLightboxModal;
