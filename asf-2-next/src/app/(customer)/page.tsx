import { createSupabaseServerClient } from "@/utils/supabase/server";
import HomePageClient from "./_components/HomePageClient";

/**
 * Resolves Home hero image from `homepage_elements` type=hero → post media.
 * Falls back to newest post media when the hero row / media is missing.
 */
function resolveHeroImageUrl(
  heroTargetId: string | null | undefined,
  posts: { id: string; medias?: { media_url: string | null }[] | null }[],
  postMedias: { post_id: string; media_url: string | null; created_at?: string | null }[]
): string | null {
  const designated =
    typeof heroTargetId === "string" && heroTargetId.trim().length > 0
      ? heroTargetId.trim()
      : null;

  const urlForPost = (postId: string): string | null => {
    const embedded = posts.find((p) => p.id === postId)?.medias?.[0]?.media_url;
    if (typeof embedded === "string" && embedded.trim().length > 0) {
      return embedded.trim();
    }
    const matches = postMedias
      .filter((m) => m.post_id === postId)
      .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    for (const row of matches) {
      const url = typeof row.media_url === "string" ? row.media_url.trim() : "";
      if (url.length > 0) {
        return url;
      }
    }
    return null;
  };

  if (designated !== null) {
    const fromHero = urlForPost(designated);
    if (fromHero !== null) {
      return fromHero;
    }
  }

  for (const post of posts) {
    const url = urlForPost(post.id);
    if (url !== null) {
      return url;
    }
  }
  return null;
}

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  // Fetch all data the home page needs in parallel
  const [
    { data: products },
    { data: categories },
    { data: posts },
    { data: productMedias },
    { data: brands },
    { data: departments },
    { data: ranges },
    { data: productCategories },
    { data: postMedias },
    { data: heroElements },
  ] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("categories").select("*"),
    supabase.from("posts").select("*, medias:post_medias(*)").order("created_at", { ascending: false }).limit(10),
    supabase.from("product_medias").select("*"),
    supabase.from("brand").select("*"),
    supabase.from("departments").select("*"),
    supabase.from("ranges").select("*"),
    supabase.from("product_categories").select("*"),
    supabase.from("post_medias").select("*"),
    supabase
      .from("homepage_elements")
      .select("targetId, arrangement")
      .eq("type", "hero")
      .order("arrangement", { ascending: true })
      .limit(1),
  ]);

  const heroTargetId = heroElements?.[0]?.targetId ?? null;
  const heroImageUrl = resolveHeroImageUrl(
    heroTargetId,
    posts ?? [],
    postMedias ?? []
  );

  return (
    <HomePageClient
      products={products ?? []}
      categories={categories ?? []}
      posts={posts ?? []}
      productMedias={productMedias ?? []}
      brands={brands ?? []}
      departments={departments ?? []}
      ranges={ranges ?? []}
      productCategories={productCategories ?? []}
      postMedias={postMedias ?? []}
      heroImageUrl={heroImageUrl}
    />
  );
}
