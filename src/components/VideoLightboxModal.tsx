import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export interface VideoLightboxModalProps {
  /** The video URL to play inside the modal */
  src: string;
  /** Caption / title shown below the video */
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
 * A full-screen modal lightbox that plays a video before asking the user
 * to navigate. This solves the UX problem of videos immediately redirecting
 * on click — users can watch the content first, then decide to shop.
 *
 * ## Behaviour
 * - Backdrop tap / ✕ button → closes modal, user returns to their current page
 * - "SHOP THE EDIT" CTA → navigates to `navigateTo` route
 * - Video autoplays muted (safe default); user can unmute via native controls
 * - Body scroll is locked while the modal is open
 * - Escape key closes the modal
 *
 * ## Design
 * Inspired by Charles & Keith and premium fashion apps:
 * - Dark translucent backdrop
 * - Centred card with rounded corners
 * - Video with native controls for full user control
 * - Caption underneath
 * - Full-width "SHOP THE EDIT" CTA at the bottom
 */
const VideoLightboxModal: React.FC<VideoLightboxModalProps> = ({
  src,
  caption,
  navigateTo,
  ctaLabel = "SHOP THE EDIT",
  onClose,
}) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Lock body scroll while the modal is open so the background page
   * does not scroll when the user interacts with the modal.
   */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  /** Close on Escape key */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  /**
   * Pause and reset the video when the modal closes so it doesn't
   * continue playing in the background after unmounting.
   */
  const handleClose = (): void => {
    if (videoRef.current !== null) {
      videoRef.current.pause();
    }
    onClose();
  };

  /**
   * Navigate to the product/shop route after pausing the video.
   * We pause first so there's no audio bleed during the page transition.
   */
  const handleShopNow = (): void => {
    if (videoRef.current !== null) {
      videoRef.current.pause();
    }
    onClose();
    navigate(navigateTo);
  };

  return (
    /*
     * Backdrop — covers the entire viewport with a semi-transparent black layer.
     * Clicking the backdrop closes the modal.
     */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Video: ${caption}`}
    >
      {/*
       * Modal card — stop click propagation so tapping the card itself
       * doesn't bubble up to the backdrop and close the modal.
       */}
      <div
        className="relative w-full sm:max-w-lg bg-black rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close button ─────────────────────────────────────────────── */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-black/80 transition-colors duration-200"
          aria-label="Close video"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Video player ─────────────────────────────────────────────── */}
        <div className="w-full bg-black">
          <video
            ref={videoRef}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            controls
            className="w-full max-h-[60vh] object-contain"
            aria-label={caption}
          />
        </div>

        {/* ── Caption + CTA ─────────────────────────────────────────────── */}
        <div className="bg-white px-6 pt-5 pb-8 sm:pb-6">
          {/* Caption text — shown only if non-empty */}
          {caption.trim().length > 0 && (
            <p className="text-sm font-medium text-gray-800 text-center mb-4 leading-relaxed">
              {caption}
            </p>
          )}

          {/* Primary CTA — navigates to the intended route */}
          <button
            onClick={handleShopNow}
            className="w-full py-3 bg-black text-white text-sm font-semibold uppercase tracking-widest hover:bg-gray-900 active:scale-[0.98] transition-all duration-200"
          >
            {ctaLabel}
          </button>

          {/* Secondary dismiss link */}
          <button
            onClick={handleClose}
            className="w-full mt-3 py-2 text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors duration-200"
          >
            继续浏览
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoLightboxModal;
