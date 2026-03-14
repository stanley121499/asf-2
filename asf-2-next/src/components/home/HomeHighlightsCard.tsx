import React from "react";
import Link from "next/link";
import MediaThumb from "../MediaThumb";

/**
 * Highlights-style card used on the customer homepage horizontal sections.
 *
 * This component intentionally matches the existing "Highlights" card visuals:
 * - Large image-top layout
 * - Optional badge (e.g., "FEATURED")
 * - Title + subtitle
 * - "Discover More →" footer CTA
 */
export interface HomeHighlightsCardProps {
  /** Route destination when the card is clicked. */
  to: string;
  /** Primary image URL (top image). If missing/empty, `fallbackImageUrl` is used. */
  imageUrl?: string | null;
  /** Card title (e.g., Category name, Brand name, Post caption). */
  title: string;
  /** Card subtitle line (e.g., marketing copy or computed counts). */
  subtitle: string;
  /** Optional badge text shown at the top-right of the image. */
  badgeText?: string;
  /** Optional alt text for the image; falls back to the title. */
  imageAlt?: string;
  /** Optional CTA label; defaults to "Discover More →". */
  ctaText?: string;
  /** Optional CSS className applied to the outer Link. */
  className?: string;
  /** Fallback image if `imageUrl` is not usable. */
  fallbackImageUrl?: string;
}

/**
 * Generates a local SVG data-URI placeholder image with centred text.
 * No external HTTP requests — the SVG is embedded directly.
 */
function makePlaceholderImageUrl(text: string): string {
  const safeText = text.replace(/[<>&"]/g, (ch) => {
    const escapes: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" };
    return escapes[ch] ?? ch;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#e5e7eb"/><text x="150" y="105" font-family="sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const FALLBACK_PLACEHOLDER_IMAGE = makePlaceholderImageUrl("Image");

/**
 * Resolve a usable image URL (handles null/empty/whitespace values safely).
 */
function resolveImageUrl(
  imageUrl: string | null | undefined,
  fallbackImageUrl: string | undefined
): string {
  // Prefer the provided image URL when it is a non-empty string.
  if (typeof imageUrl === "string" && imageUrl.trim().length > 0) {
    return imageUrl;
  }

  // Otherwise use the fallback (if provided).
  if (typeof fallbackImageUrl === "string" && fallbackImageUrl.trim().length > 0) {
    return fallbackImageUrl;
  }

  // Last-resort placeholder to avoid broken images.
  return FALLBACK_PLACEHOLDER_IMAGE;
}

export function HomeHighlightsCard({
  to,
  imageUrl,
  title,
  subtitle,
  badgeText,
  imageAlt,
  ctaText = "Discover More →",
  className = "",
  fallbackImageUrl,
}: HomeHighlightsCardProps): JSX.Element {
  // Step 1: Resolve a safe image URL for rendering.
  const resolvedImageUrl = resolveImageUrl(imageUrl, fallbackImageUrl);

  // Step 2: Resolve alt text for accessibility.
  const resolvedAlt = typeof imageAlt === "string" && imageAlt.trim().length > 0 ? imageAlt : title;

  return (
    <Link
      href={to}
      className={[
        "flex-shrink-0 w-68 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 relative group",
        className,
      ].join(" ")}
      style={{ width: "17rem" }}
    >
      {/* Optional badge */}
      {typeof badgeText === "string" && badgeText.trim().length > 0 && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-700 to-purple-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
          {badgeText}
        </div>
      )}

      {/* Image / Video */}
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        <MediaThumb
          src={resolvedImageUrl}
          alt={resolvedAlt}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
      </div>

      {/* Text content */}
      <div className="p-5 relative">
        <h3 className="font-bold text-gray-900 truncate">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">{subtitle}</p>
        <div className="mt-4 flex justify-end">
          <span className="text-xs text-indigo-700 font-medium">{ctaText}</span>
        </div>
      </div>
    </Link>
  );
}


