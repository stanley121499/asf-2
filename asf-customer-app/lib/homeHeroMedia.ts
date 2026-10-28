/**
 * Storefront / Atelier Home cover media — DB-controlled via `homepage_elements`.
 *
 * Source of truth (no redeploy):
 *   `homepage_elements` row with `type = 'hero'`, `contentType = 'post'`,
 *   `targetId` = posts.id → first `post_medias.media_url` for that post.
 *
 * Fallback when the row/media is missing: {@link HOME_HERO_FALLBACK_MEDIA_URI}.
 * Image load failure still uses the in-component gradient (HeroCoverMedia).
 *
 * Swap hero (SQL example):
 *   UPDATE homepage_elements
 *   SET "targetId" = '<post_uuid>'
 *   WHERE type = 'hero';
 * Or change that post's `post_medias.media_url`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

/** `homepage_elements.type` for the designated Home cover post. */
export const HOME_HERO_ELEMENT_TYPE = "hero";

/**
 * Last-resort cover URI when DB hero row or post media is missing.
 * Simon post c201…0004 (post-04) — cream satin ankle, riverside blue-hour.
 * Prefer updating `homepage_elements` instead of this constant.
 */
export const HOME_HERO_FALLBACK_MEDIA_URI =
  "https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000004.webp";

/**
 * @deprecated Use {@link HOME_HERO_FALLBACK_MEDIA_URI}; kept for Design Lab imports.
 */
export const HOME_HERO_FIXED_MEDIA_URI = HOME_HERO_FALLBACK_MEDIA_URI;

type PostMediaLike = {
  post_id: string;
  media_url: string | null;
  created_at?: string | null;
};

/**
 * Reads the designated Home hero post id from `homepage_elements`.
 * Picks the lowest `arrangement` among `type = 'hero'` rows.
 */
export async function fetchHomeHeroPostId(): Promise<string | null> {
  const { data, error } = await supabase
    .from("homepage_elements")
    .select("targetId, arrangement")
    .eq("type", HOME_HERO_ELEMENT_TYPE)
    .order("arrangement", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[homeHeroMedia] failed to fetch hero element:", error.message);
    }
    return null;
  }

  const targetId = data?.targetId;
  if (typeof targetId !== "string") {
    return null;
  }
  const trimmed = targetId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Primary media URL for a post from already-loaded `post_medias` rows.
 * Oldest `created_at` first (stable primary); empty / null URLs skipped.
 */
export function mediaUrlForPost(
  postId: string | null | undefined,
  postMedias: ReadonlyArray<PostMediaLike>
): string | null {
  if (postId == null || postId.length === 0) {
    return null;
  }
  const matches = postMedias
    .filter((row) => row.post_id === postId)
    .sort((a, b) => {
      const aAt = a.created_at ?? "";
      const bAt = b.created_at ?? "";
      if (aAt !== bAt) {
        return aAt.localeCompare(bAt);
      }
      return a.post_id.localeCompare(b.post_id);
    });
  for (const row of matches) {
    const url = typeof row.media_url === "string" ? row.media_url.trim() : "";
    if (url.length > 0) {
      return url;
    }
  }
  return null;
}

/**
 * Resolves the Home cover URI: DB hero post media → fallback constant.
 */
export function resolveHomeHeroMediaUri(options: {
  heroPostId: string | null;
  postMedias: ReadonlyArray<PostMediaLike>;
  fallbackUri?: string;
}): string {
  const fromDb = mediaUrlForPost(options.heroPostId, options.postMedias);
  if (fromDb !== null) {
    return fromDb;
  }
  const fallback =
    typeof options.fallbackUri === "string" && options.fallbackUri.trim().length > 0
      ? options.fallbackUri.trim()
      : HOME_HERO_FALLBACK_MEDIA_URI;
  return fallback;
}

/**
 * Loads the DB-designated hero post id once and resolves cover URI from medias.
 * Re-resolves when `postMedias` updates (realtime). Does not rotate with filters.
 */
export function useHomeHeroMediaUri(
  postMedias: ReadonlyArray<PostMediaLike>,
  fallbackUri: string = HOME_HERO_FALLBACK_MEDIA_URI
): { heroPostId: string | null; heroUri: string; refreshHeroPostId: () => void } {
  const [heroPostId, setHeroPostId] = useState<string | null>(null);

  const refreshHeroPostId = useCallback((): void => {
    void fetchHomeHeroPostId().then(setHeroPostId);
  }, []);

  useEffect(() => {
    refreshHeroPostId();
  }, [refreshHeroPostId]);

  const heroUri = useMemo(
    () =>
      resolveHomeHeroMediaUri({
        heroPostId,
        postMedias,
        fallbackUri,
      }),
    [heroPostId, postMedias, fallbackUri]
  );

  return { heroPostId, heroUri, refreshHeroPostId };
}
