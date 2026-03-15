import { useParams } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import HomePageClient from "./_components/HomePageClient";

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
  ] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("categories").select("*"),
    supabase.from("posts").select("*, medias:post_medias(*)").order("created_at", { ascending: false }).limit(10),
    supabase.from("product_medias").select("product_id, media_url"),
    supabase.from("brands").select("*"),
    supabase.from("departments").select("*"),
    supabase.from("ranges").select("*"),
    supabase.from("product_categories").select("*"),
    supabase.from("post_medias").select("*"),
  ]);

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
    />
  );
}
