import React, { useState, useEffect } from "react";
import Image from "next/image";

export interface LazyImageProps {
  /** The primary image source URL */
  src: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** CSS class names applied to the <img> element */
  className?: string;
  /** CSS class names applied to the outer wrapper <div> */
  wrapperClassName?: string;
  /** URL to use if the image fails to load */
  fallbackSrc?: string;
  /** Native HTML fetch priority hint */
  fetchpriority?: "high" | "low" | "auto";
  /** When true, sets loading="eager" (for above-fold LCP images); defaults to false (lazy) */
  eager?: boolean;
  /** Passed through to <img> */
  width?: number | string;
  /** Passed through to <img> */
  height?: number | string;
  /** Passed through to <img> */
  style?: React.CSSProperties;
  /** Passed through to <img> */
  onClick?: React.MouseEventHandler<HTMLImageElement>;
}

const DEFAULT_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50' y='54' font-size='12' text-anchor='middle' fill='%236b7280'%3ENo image%3C/text%3E%3C/svg%3E";

export const LazyImage = ({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  fallbackSrc = DEFAULT_FALLBACK,
  fetchpriority,
  eager = false,
  width,
  height,
  style,
  onClick,
}: LazyImageProps): JSX.Element => {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">("loading");
  const [currentSrc, setCurrentSrc] = useState<string>(src);

  useEffect(() => {
    setImageState("loading");
    setCurrentSrc(src);
  }, [src]);

  const handleLoad = () => {
    if (imageState === "loading") {
      setImageState("loaded");
    }
  };

  const handleError = () => {
    setImageState("error");
    setCurrentSrc(fallbackSrc);
  };

  const imageOpacityClass = imageState === "loaded" || imageState === "error" ? "opacity-100" : "opacity-0";

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`.trim()}>
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {width && height ? (
        <Image
          src={currentSrc}
          alt={alt || ""}
          width={Number(width)}
          height={Number(height)}
          className={`${className} transition-opacity duration-300 ease-in ${imageOpacityClass}`.trim()}
          priority={eager}
          style={style}
          onClick={onClick}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <Image
          src={currentSrc}
          alt={alt || ""}
          fill
          sizes="100vw"
          className={`${className} transition-opacity duration-300 ease-in ${imageOpacityClass}`.trim()}
          priority={eager}
          style={{ objectFit: 'cover', ...style }}
          onClick={onClick}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};
