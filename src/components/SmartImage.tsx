import React, { useState, useEffect, useRef } from "react";

export interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  rootMargin?: string;
  eager?: boolean;
}

/**
 * A drop-in replacement for the standard <img> tag that lazy-loads images.
 * It uses IntersectionObserver to begin loading an image before it enters the viewport,
 * shows a shimmer skeleton while loading, and fades the image in once loaded.
 */
const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = "",
  rootMargin = "600px 0px",
  eager = false,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(eager);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eager) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );

    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [eager, rootMargin]);

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden ${className}`.trim()}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          decoding="async"
          className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"
            }`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
};

export default SmartImage;
