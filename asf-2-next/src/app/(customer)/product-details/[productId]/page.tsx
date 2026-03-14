import { createSupabaseServerClient } from "@/utils/supabase/server";
import ProductDetailsClient from "./_components/ProductDetailsClient";

export default async function ProductDetailsPage({
  params,
}: {
  params: { productId: string };
}) {
  const { productId } = params;
  const supabase = createSupabaseServerClient();

  const [
    { data: product },
    { data: productMedias },
    { data: productColors },
    { data: productSizes },
    { data: productStocks },
  ] = await Promise.all([
    supabase.from("products").select("*").eq("id", productId).maybeSingle(),
    supabase.from("product_medias").select("*").eq("product_id", productId),
    supabase.from("product_colors").select("*").eq("product_id", productId),
    supabase.from("product_sizes").select("*").eq("product_id", productId),
    supabase.from("product_stock").select("*").eq("product_id", productId),
  ]);

  return (
    <ProductDetailsClient
      productId={productId}
      initialProduct={product}
      productMedias={productMedias ?? []}
      productColors={productColors ?? []}
      productSizes={productSizes ?? []}
      productStocks={productStocks ?? []}
    />
  );
}
