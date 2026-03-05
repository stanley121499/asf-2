import React, { useEffect, useState } from "react";
import { isVideoUrl } from "../../utils/mediaUtils";

interface PostProps {
  caption: string;
  medias: string[]; // URLs of images or videos
  captionPosition: string;
  ctaText: string;
  photoSize: string; // Optional photo size (e.g., 'h-96 w-full')
  previewMedia?: string;
  fontFamily?: string;
}

const PostComponent: React.FC<PostProps> = ({
  caption,
  medias,
  captionPosition,
  ctaText,
  photoSize,
  previewMedia,
  fontFamily,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * forcedVideo is flipped to true by the onError handler when the browser
   * cannot decode the current URL as an image (e.g., a legacy extensionless
   * video file stored in Supabase before the upload extension fix).
   * It resets to false whenever the active URL changes.
   */
  const [forcedVideo, setForcedVideo] = useState<boolean>(false);

  /** Returns Tailwind height + width classes based on the photoSize prop */
  const getPhotoSizeClasses = (): string => {
    switch (photoSize) {
      case "SMALL":
        return "h-64 w-full";
      case "MEDIUM":
        return "h-96 w-full";
      case "LARGE":
        return "h-128 w-full";
      default:
        return "h-96 w-full";
    }
  };

  /**
   * Returns Tailwind positioning classes for the caption overlay based
   * on the captionPosition prop.
   */
  const getCaptionClasses = (): string => {
    switch (captionPosition) {
      case "TOP":
        return "absolute top-0 left-1/2 transform -translate-x-1/2";
      case "BOTTOM":
        return "absolute bottom-0 left-0";
      case "MIDDLE":
        return "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
      default:
        return "";
    }
  };

  /**
   * Auto-advance carousel index every second when there are multiple medias.
   * Resets to 0 whenever the medias array length changes.
   */
  useEffect(() => {
    if (medias.length <= 1) {
      setCurrentIndex(0);
      return;
    }

    const intervalId = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % medias.length);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [medias.length]);

  /**
   * The URL to display: if `previewMedia` is set (user clicked a media item
   * in the editor), show that; otherwise cycle through the arranged medias.
   */
  const activeUrl: string =
    previewMedia !== undefined && previewMedia !== ""
      ? previewMedia
      : (medias[currentIndex] ?? "");

  /**
   * Reset the forced-video override whenever the active URL changes so that
   * a freshly selected image URL doesn't inherit the video rendering mode
   * from a previous video URL.
   */
  useEffect(() => {
    setForcedVideo(false);
  }, [activeUrl]);

  /** True when the active URL should be rendered as a video element */
  const shouldRenderVideo: boolean = forcedVideo || isVideoUrl(activeUrl);

  const hasMedia = activeUrl !== "";

  /**
   * Called when the <img> element fires onError — which happens for legacy
   * extensionless video files (the server returns video/mp4 bytes).
   * Flips shouldRenderVideo so React unmounts <img> and mounts <video>.
   */
  const handleImageError = (): void => {
    setForcedVideo(true);
  };

  return (
    <div className="relative overflow-hidden bg-black">
      {hasMedia && (
        <div className={`relative overflow-hidden ${getPhotoSizeClasses()}`}>

          {/*
           * Render a <video> for video URLs (or onError fallback) and an
           * <img> for everything else. Both are absolutely positioned to fill
           * the container with object-cover.
           *
           * The `key` on <video> ensures React fully remounts the element
           * when the src changes during carousel auto-advance, so the new
           * video starts from the beginning.
           */}
          {shouldRenderVideo ? (
            <video
              key={activeUrl}
              src={activeUrl}
              aria-label={caption || "Post video"}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img
              src={activeUrl}
              alt={caption || "Post image"}
              className="absolute inset-0 w-full h-full object-cover"
              onError={handleImageError}
            />
          )}

          {/* Dimmed overlay so caption text is always readable */}
          <div className="absolute inset-0 bg-black bg-opacity-50" />

          {/* Caption + CTA overlay */}
          <div className={`text-white p-4 ${getCaptionClasses()}`}>
            <p className="text-lg" style={{ fontFamily }}>
              {caption}
            </p>
            {ctaText !== "" && (
              <p className="text-sm underline" style={{ fontFamily }}>
                {ctaText} {">"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostComponent;
