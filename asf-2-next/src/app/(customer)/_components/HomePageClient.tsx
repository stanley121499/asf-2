"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { HiOutlineHeart, HiHeart, HiOutlineBookmark, HiBookmark, HiOutlinePlay } from "react-icons/hi";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LandingLayout } from "@/layouts";
import type { Tables } from "@/database.types";
import MediaThumb from "@/components/MediaThumb";
import OnboardingOverlay from "@/components/OnboardingOverlay";

// Thumbnail for posts in the home page strip.
// isVideo comes from media_type DB column — no fallback detection needed.
const HomeThumbnail: React.FC<{ src: string; alt: string; isVideo: boolean }> = ({ src, alt, isVideo }) => {
  if (isVideo) {
    return (
      <div className="absolute inset-0 w-full h-full">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={src}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black/60 rounded-full px-2 py-1 flex items-center gap-1 pointer-events-none">
          <HiOutlinePlay size={10} className="text-white" />
          <span className="text-white text-[10px] font-medium">视频</span>
        </div>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover"
      onError={(e) => {
        e.currentTarget.src = "/default-image.jpg";
        e.currentTarget.className = "absolute inset-0 w-full h-full object-cover opacity-50 grayscale";
      }}
    />
  );
};

interface HomePageProps {
  products: Tables<"products">[];
  categories: Tables<"categories">[];
  posts: (Tables<"posts"> & { medias?: Tables<"post_medias">[] })[];
  productMedias: Tables<"product_medias">[];
  brands: Tables<"brand">[];
  departments: Tables<"departments">[];
  ranges: Tables<"ranges">[];
  productCategories: Tables<"product_categories">[];
  postMedias: Tables<"post_medias">[];
}

const HomePageClient: React.FC<HomePageProps> = ({
  products, categories, posts, productMedias, postMedias
}) => {
  const router = useRouter();
  const { user } = useAuthContext();
  const { listMembershipTiers, getUserPointsByUserId } = usePointsMembership();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();

  const [localSavedItems, setLocalSavedItems] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const raw = localStorage.getItem("saved_posts");
      return new Set<string>(raw !== null ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set<string>();
    }
  });

  const toggleLocalSaved = useCallback((id: string): void => {
    setLocalSavedItems((prev) => {
      const next = new Set<string>(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem("saved_posts", JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const postMediaMap = useMemo<Map<string, string>>(
    () => new Map(postMedias.map((m) => [m.post_id, m.media_url ?? ""])),
    [postMedias]
  );

  const productMediaMap = useMemo<Map<string, string>>(
    () => new Map(productMedias.map((m) => [m.product_id, m.media_url ?? ""])),
    [productMedias]
  );

  const sortedPosts = useMemo(() => {
    return [...posts]
      .filter((p) => p.id !== "")
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [posts]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      if (a.arrangement !== null && b.arrangement !== null) return a.arrangement - b.arrangement;
      if (a.arrangement !== null) return -1;
      if (b.arrangement !== null) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [categories]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [products]);

  const [points, setPoints] = useState<number>(0);
  const [tiers, setTiers] = useState<Tables<"membership_tiers">[]>([]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        if (user?.id) {
          const row = await getUserPointsByUserId(user.id);
          if (isActive) {
            setPoints(row?.amount ?? 0);
          }
        } else if (isActive) {
          setPoints(0);
        }
      } catch {
        if (isActive) {
          setPoints(0);
        }
      }
    };
    void load();
    return () => { isActive = false; };
  }, [user?.id, getUserPointsByUserId]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const rows = await listMembershipTiers(true);
        if (isActive) {
          setTiers(rows);
        }
      } catch {
        if (isActive) {
          setTiers([]);
        }
      }
    };
    void load();
    return () => { isActive = false; };
  }, [listMembershipTiers]);

  const levelData = useMemo(() => {
    if (tiers.length === 0) {
      return { nextLevel: null as string | null, pointsToNextLevel: 0 };
    }
    const ordered = [...tiers].sort((a, b) => {
      const aReq = a.point_required ?? 0;
      const bReq = b.point_required ?? 0;
      return aReq - bReq;
    });
    let currentIndex = -1;
    for (let i = 0; i < ordered.length; i += 1) {
      const req = ordered[i].point_required ?? 0;
      if (points >= req) {
        currentIndex = i;
      }
    }
    const nextTier = currentIndex >= 0 && currentIndex < ordered.length - 1 ? ordered[currentIndex + 1] : (ordered.length > 0 && currentIndex === -1 ? ordered[0] : null);
    const nextThreshold = nextTier?.point_required ?? 0;
    const pointsToNextLevel = Math.max(0, (nextThreshold - points));
    return {
      nextLevel: nextTier?.name ?? null,
      pointsToNextLevel
    };
  }, [tiers, points]);

  const firstPost = sortedPosts.length > 0 ? sortedPosts[0] : null;
  const heroImage = firstPost ? (firstPost.medias?.[0]?.media_url || postMediaMap.get(firstPost.id)) : null;

  const CATEGORY_NAMES: Record<string, string> = {
    "Handbag": "手袋",
    "Streetwear": "街头服饰",
    "Spring Collection": "春季新品",
    "Ladies": "女装",
    "Men": "男装",
    "Accessories": "配饰",
    "Shoes": "鞋履",
    "Beauty": "美妆",
    "Pants": "长裤",
    "Tops": "上衣",
    "Bottoms": "下装"
  };

  return (
    <LandingLayout>
      <OnboardingOverlay />

      <div className="pb-24">
        {/* 1. Lookbook Hero */}
        <div 
          className="relative w-full h-[55vh] flex flex-col justify-end overflow-hidden cursor-pointer"
          onClick={() => router.push('/highlights')}
        >
          {heroImage ? (
            <Image
              src={heroImage}
              alt="Hero Lookbook"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900" />
          )}
          
          {/* Top gradient for navbar/logo readability */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-[1]" />
          
          {/* Bottom gradient for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-[1]" />
          
          <div className="relative z-10 p-6 w-full">
            {firstPost?.caption && (
              <p 
                className="font-display text-white text-lg mb-4 line-clamp-2 leading-snug max-w-[85%]"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 0 32px rgba(0,0,0,0.7)" }}
              >
                {firstPost.caption}
              </p>
            )}
            <div className="flex gap-3 flex-wrap mb-3">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push("/product-section"); }}
                className="px-5 py-2.5 rounded-full bg-white/90 text-[var(--color-text)] text-sm font-medium min-h-[44px] flex items-center backdrop-blur-sm"
              >
                探索新品 →
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push("/highlights"); }}
                className="px-5 py-2.5 rounded-full border border-white/70 bg-white/10 text-white text-sm font-medium min-h-[44px] flex items-center backdrop-blur-sm"
              >
                精选内容 →
              </button>
            </div>
          </div>
        </div>

        {/* 2. 新品上市 section */}
        <div className="mt-8 px-4">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-display text-2xl text-[var(--color-text)] shrink-0">新品上市</h2>
            <div className="h-[1px] bg-[var(--color-border)] w-full flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {sortedProducts.slice(0, 6).map((product, index) => {
              const imgUrl = productMediaMap.get(product.id);
              const isSaved = isInWishlist(product.id);

              return (
                <Link key={product.id} href={`/product-details/${product.id}?from=%2F`} className="flex flex-col">
                  {/* 3:4 aspect ratio wrapper */}
                  <div className="relative pt-[133.33%] bg-[var(--color-panel)] overflow-hidden w-full mb-3">
                    {imgUrl ? (
                      <Image 
                        src={imgUrl} 
                        alt={product.name || "商品"} 
                        fill 
                        sizes="50vw" 
                        quality={75} 
                        priority={index < 2} 
                        className="object-cover" 
                      />
                    ) : (
                      <div className="absolute inset-0 skeleton" />
                    )}
                  </div>
                  <h3 className="font-sans text-sm text-[var(--color-text)] truncate mb-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-accent)] font-medium text-sm">
                      RM {product.price?.toFixed(2) ?? "—"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isSaved) {
                          void removeFromWishlist(product.id);
                        } else {
                          void addToWishlist(product.id);
                        }
                      }}
                      className="p-1 -mr-1"
                    >
                      {isSaved ? <HiHeart size={18} className="text-[var(--color-accent)]" /> : <HiOutlineHeart size={18} className="text-[var(--color-muted)]" />}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 3. 商品分类 category pills */}
        {sortedCategories.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl text-[var(--color-text)] px-4 mb-4">商品分类</h2>
            <div className="flex overflow-x-auto hide-scrollbar px-4 gap-3 pb-2">
              {sortedCategories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/product-section/${cat.id}`}
                  className="shrink-0 px-5 py-2.5 rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text)] text-sm font-medium whitespace-nowrap whitespace-nowrap"
                >
                  {CATEGORY_NAMES[cat.name || ""] ?? cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 4. 精选推荐 posts strip */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3 px-4">
            <h2 className="font-display text-xl text-[var(--color-text)]">精选推荐</h2>
            <Link href="/highlights" className="text-[var(--color-accent)] text-sm">查看全部 →</Link>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar px-4 gap-4 pb-4">
            {sortedPosts.map((post, index) => {
              const firstMediaObj = post.medias?.[0];
              const imgUrl = firstMediaObj?.media_url || postMediaMap.get(post.id);
              const isVideoPost = (firstMediaObj?.media_type ?? "image") === "video";
              const isSaved = localSavedItems.has(post.id);

              return (
                <Link
                  key={post.id || index}
                  href="/highlights"
                  className="shrink-0 w-[80vw] flex flex-col relative group"
                >
                  <div className="relative pt-[125%] bg-[var(--color-panel)] overflow-hidden w-full mb-3 rounded-xl border border-[var(--color-border)]">
                    {!imgUrl ? (
                      <div className="absolute inset-0 bg-[#2d2417]" />
                    ) : (
                      <HomeThumbnail src={imgUrl} alt={post.caption ?? "精选内容"} isVideo={isVideoPost} />
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleLocalSaved(post.id);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/40 backdrop-blur-md z-10"
                    >
                      {isSaved ? <HiBookmark size={20} className="text-white" /> : <HiOutlineBookmark size={20} className="text-white" />}
                    </button>
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white tracking-widest z-10">
                      查看全部内容 →
                    </div>
                  </div>
                  {post.caption && (
                    <p className="text-sm text-[var(--color-text)] line-clamp-2 leading-relaxed">
                      {post.caption}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 5. Points status strip */}
        {user && (
          <div className="px-4 mt-8 cursor-pointer" onClick={() => router.push('/goal')}>
            <div className="bg-[var(--color-panel)] rounded-xl py-3 px-4 flex items-center justify-center">
              <span className="text-[var(--color-text)] text-sm">
                您有 <span className="font-medium">{points}</span> 积分
                {levelData.nextLevel && (
                  <span className="text-[var(--color-muted)]">
                    {" "}· 距{levelData.nextLevel}还差 {levelData.pointsToNextLevel} 积分
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </LandingLayout>
  );
};

export default HomePageClient;
