import { createSupabaseServerClient } from "@/utils/supabase/server";
import ProductSectionClient from "./_components/ProductSectionClient";

export default async function ProductSectionPage({
  params,
}: {
  params: { categoryId?: string[] };
}) {
  const categoryId = params.categoryId?.[0];
  const supabase = createSupabaseServerClient();

  // We fetch all products and categories as the client component filters them
  const [
    { data: products },
    { data: categories },
    { data: productMedias },
  ] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*"),
    supabase.from("product_medias").select("product_id, media_url"),
  ]);

  return (
    <ProductSectionClient
      initialCategoryId={categoryId}
      products={products ?? []}
      categories={categories ?? []}
      productMedias={productMedias ?? []}
    />
  );
}
