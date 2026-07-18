"use client";
import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Tables } from "@/database.types";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import PostCard from "@/components/PostCard";
import BottomNavbar from "@/components/home/bottom-nav";

interface HighlightsClientProps {
  posts: (Tables<"posts"> & { medias?: Tables<"post_medias">[] })[];
  postMedias: Tables<"post_medias">[];
}

const HighlightsClient: React.FC<HighlightsClientProps> = ({ posts, postMedias }) => {
  const router = useRouter();
  const { isEnabled } = useFeatureFlags();

  useEffect(() => {
    if (!isEnabled("highlights")) {
      router.replace("/");
    }
  }, [isEnabled, router]);

  const featuredPosts = useMemo(() =>
    [...posts]
      .filter((p) => p.id !== "")
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      ),
  [posts]);

  if (!isEnabled("highlights")) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)] pb-24">
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] flex items-center justify-center h-[56px] px-4">
        <h1 className="font-display text-xl">精选推荐</h1>
      </div>

      <div className="w-full">
        {featuredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-[var(--color-muted)]">暂无内容，敬请期待</p>
          </div>
        ) : (
          featuredPosts.map((post) => {
            const medias = post.medias || postMedias.filter(m => m.post_id === post.id);
            return (
              <PostCard 
                key={post.id} 
                post={post} 
                medias={medias} 
                showActions={true} 
              />
            );
          })
        )}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default HighlightsClient;
