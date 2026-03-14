import { createSupabaseServerClient } from "@/utils/supabase/server";
import HighlightsClient from "./_components/HighlightsClient";

export default async function HighlightsPage() {
  const supabase = createSupabaseServerClient();

  const [
    { data: posts },
    { data: postMedias },
  ] = await Promise.all([
    supabase.from("posts").select("*, medias:post_medias(*)").order("created_at", { ascending: false }),
    supabase.from("post_medias").select("*"),
  ]);

  return <HighlightsClient posts={posts ?? []} postMedias={postMedias ?? []} />;
}
