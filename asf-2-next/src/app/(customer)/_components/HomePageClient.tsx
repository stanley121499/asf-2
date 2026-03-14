"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import { FaQrcode, FaBell } from "react-icons/fa";
import Link from "next/link";
import { LandingLayout } from "@/layouts";
import type { Tables } from "@/database.types";
import { HomeHighlightsCard } from "@/components/home/HomeHighlightsCard";
import MediaThumb from "@/components/MediaThumb";
import MediaAwareLink from "@/components/MediaAwareLink";

interface ScrollableSectionProps<TItem> {
  title: string;
  viewAllLink?: string;
  items: readonly TItem[];
  renderItem: (item: TItem, index: number) => React.ReactNode;
  isHighlightSection?: boolean;
}

const ScrollableSection = <TItem,>({
  title,
  viewAllLink,
  items,
  renderItem,
  isHighlightSection = false,
}: ScrollableSectionProps<TItem>): JSX.Element => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4 px-5">
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h2>
        {viewAllLink && (
          isHighlightSection ? (
            <Link href={viewAllLink} className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-sm flex items-center space-x-1">
              <span>查看全部</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <Link href={viewAllLink} className="text-indigo-700 text-sm font-medium hover:text-indigo-900 transition-colors duration-200 flex items-center space-x-1 group">
              <span>查看全部</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )
        )}
      </div>
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto hide-scrollbar space-x-4 px-5 pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {items.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  );
};

const mockUnreadNotifications = 2;

function makePlaceholderImageUrl(text: string): string {
  const safeText = text.replace(/[<>&"]/g, (ch) => {
    const escapes: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" };
    return escapes[ch] ?? ch;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#e5e7eb"/><text x="150" y="105" font-family="sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

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
  products, categories, posts, productMedias, brands, departments, ranges, productCategories, postMedias
}) => {
  const { user, user_detail } = useAuthContext();
  const { listMembershipTiers, getUserPointsByUserId } = usePointsMembership();

  const postMediaMap = useMemo<Map<string, string>>(
    () => new Map(postMedias.map((m) => [m.post_id, m.media_url ?? ""])),
    [postMedias]
  );

  const productMediaMap = useMemo<Map<string, string>>(
    () => new Map(productMedias.map((m) => [m.product_id, m.media_url ?? ""])),
    [productMedias]
  );

  const formatProductCount = (count: number): string => {
    return `${count} 件商品`;
  };

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
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [categories]);

  const sortedDepartments = useMemo(() => {
    return [...departments].sort((a, b) => {
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [departments]);

  const sortedRanges = useMemo(() => {
    return [...ranges].sort((a, b) => {
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [ranges]);

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => {
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [brands]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [products]);

  const categoryProductCountById = useMemo(() => {
    const map = new Map<string, number>();
    for (const pc of productCategories) {
      const categoryId = pc.category_id;
      if (typeof categoryId === "string" && categoryId.trim().length > 0) {
        const prev = map.get(categoryId) ?? 0;
        map.set(categoryId, prev + 1);
      }
    }
    return map;
  }, [productCategories]);

  const categoryProductCountByProductFk = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      const categoryId = product.category_id;
      if (typeof categoryId === "string" && categoryId.trim().length > 0) {
        const prev = map.get(categoryId) ?? 0;
        map.set(categoryId, prev + 1);
      }
    }
    return map;
  }, [products]);

  const productCountByDepartmentId = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      const departmentId = product.department_id;
      if (typeof departmentId === "string" && departmentId.trim().length > 0) {
        const prev = map.get(departmentId) ?? 0;
        map.set(departmentId, prev + 1);
      }
    }
    return map;
  }, [products]);

  const productCountByRangeId = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      const rangeId = product.range_id;
      if (typeof rangeId === "string" && rangeId.trim().length > 0) {
        const prev = map.get(rangeId) ?? 0;
        map.set(rangeId, prev + 1);
      }
    }
    return map;
  }, [products]);

  const productCountByBrandId = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      const brandId = product.brand_id;
      if (typeof brandId === "string" && brandId.trim().length > 0) {
        const prev = map.get(brandId) ?? 0;
        map.set(brandId, prev + 1);
      }
    }
    return map;
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
      return { currentLevel: null as string | null, nextLevel: null as string | null, progress: 0, pointsToNextLevel: 0 };
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
    const currentTier = currentIndex >= 0 ? ordered[currentIndex] : null;
    const nextTier = currentIndex >= 0 && currentIndex < ordered.length - 1 ? ordered[currentIndex + 1] : null;
    const currentThreshold = currentTier?.point_required ?? 0;
    const nextThreshold = nextTier?.point_required ?? currentThreshold;
    let progress = 100;
    let pointsToNextLevel = 0;
    if (nextTier) {
      const denom = nextThreshold - currentThreshold === 0 ? 1 : nextThreshold - currentThreshold;
      progress = ((points - currentThreshold) / denom) * 100;
      progress = Math.min(100, Math.max(0, progress));
      pointsToNextLevel = Math.max(0, (nextThreshold - points));
    } else {
      progress = 100;
      pointsToNextLevel = 0;
    }
    return {
      currentLevel: currentTier?.name ?? null,
      nextLevel: nextTier?.name ?? null,
      progress,
      pointsToNextLevel
    };
  }, [tiers, points]);

  const displayName = useMemo(() => {
    const pickNameFromMetadata = (metadata: unknown): string | null => {
      if (metadata && typeof metadata === "object") {
        const m = metadata as Record<string, unknown>;
        const candidates = [m["display_name"], m["full_name"], m["name"]];
        for (const value of candidates) {
          if (typeof value === "string" && value.trim().length > 0) {
            return value;
          }
        }
      }
      return null;
    };

    const fromMeta = pickNameFromMetadata(user?.user_metadata);
    if (fromMeta !== null) {
      return fromMeta;
    }
    const emailVal: unknown = user?.email;
    if (typeof emailVal === "string" && emailVal.includes("@")) {
      return emailVal.split("@")[0];
    }
    return "Guest";
  }, [user?.user_metadata, user?.email]);

  const getCategoryProductImage = (categoryId: string): string => {
    const productIds = productCategories
      .filter(pc => pc.category_id === categoryId)
      .map(pc => pc.product_id);

    for (const productId of productIds) {
      const mediaUrl = productMediaMap.get(productId ?? "");
      if (mediaUrl) {
        return mediaUrl;
      }
    }
    return "";
  };

  type ProductClassificationKey = "department_id" | "range_id" | "brand_id";

  const getClassificationImage = (key: ProductClassificationKey, id: string): string => {
    const product = products.find((p) => p[key] === id);
    if (product) {
      const mediaUrl = productMediaMap.get(product.id ?? "");
      if (mediaUrl) return mediaUrl;
    }
    return "";
  };

  return (
    <LandingLayout>
      <div className="p-5 pt-8">
        <div className="bg-gradient-to-br from-indigo-800 via-indigo-700 to-purple-800 text-white relative overflow-hidden rounded-xl shadow-lg">
          <div className="absolute inset-0 bg-pattern opacity-5"></div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white bg-opacity-10 blur-xl"></div>
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white bg-opacity-5 blur-xl"></div>

          <div className="px-6 pt-6 pb-4 relative">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wider opacity-90">钱包余额</h2>
              <Link
                href="/notifications"
                className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-full p-2 shadow-inner relative hover:bg-opacity-25 transition-all duration-300 transform hover:scale-105"
              >
                <FaBell size={20} className="text-white" />
                {mockUnreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {mockUnreadNotifications}
                  </span>
                )}
              </Link>
            </div>
            <div className="flex items-baseline mt-3">
              <span className="text-sm mr-1 opacity-80">RM</span>
              <span className="text-6xl font-bold tracking-tight">{user_detail?.lifetime_val?.toFixed(2) || "0.00"}</span>
            </div>
          </div>

          <div className="px-6 pt-3 pb-10 relative z-10">
            <h1 className="text-2xl font-bold tracking-tight"> <span className="opacity-90">{displayName}</span></h1>
            <div className="flex justify-between items-center mt-6">
              <div>
                <div className="flex items-center">
                  <div className="flex flex-col space-y-3 w-full">
                    <div className="flex items-center">
                      <span className="text-3xl font-bold tracking-tight">{points} 积分</span>
                      <span className="ml-3 px-3 py-1 text-xs font-semibold bg-yellow-500 bg-opacity-20 text-yellow-300 rounded-full border border-yellow-500 border-opacity-20">
                        {levelData.currentLevel || "会员"}
                      </span>
                    </div>
                    <div className="w-full">
                      <div className="relative">
                        <div className="overflow-hidden h-1.5 flex rounded-full bg-white bg-opacity-20">
                          <div
                            style={{ width: `${levelData.progress}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white bg-opacity-50 transition-all duration-500 rounded-full"
                          ></div>
                        </div>
                        <div className="mt-1.5">
                          <span className="text-xs font-medium text-white text-opacity-80">
                            {levelData.nextLevel ? `还需 ${levelData.pointsToNextLevel} 积分升至 ${levelData.nextLevel}` : "已达最高等级"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button className="p-4 bg-white bg-opacity-15 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg hover:bg-opacity-25 transition-all duration-300 transform hover:scale-105">
                <FaQrcode size={24} className="text-white" />
              </button>
            </div>

            {!user && (
              <Link
                href="/authentication/sign-in?returnTo=%2F"
                className="mt-6 block py-4 px-5 bg-white bg-opacity-15 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg border border-white border-opacity-20 active:bg-opacity-25 transition-all"
              >
                <p className="text-sm uppercase tracking-wider font-medium">登录 / 注册</p>
                <p className="text-xs mt-1 opacity-80 leading-relaxed">
                  登录以查看您的进度并兑换专属奖励
                </p>
                <p className="text-xs mt-2 font-semibold opacity-90">点击登录 →</p>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <div className="py-4">
          <ScrollableSection
            title="精选推荐"
            viewAllLink="/highlights"
            items={sortedPosts.slice(0, 4)}
            renderItem={(post, index) => {
              const postMedia = post.medias?.[0]?.media_url ||
                postMediaMap.get(post.id) ||
                "/default-image.jpg";

              return (
                <MediaAwareLink
                  to="/product-section"
                  mediaSrc={postMedia}
                  caption={post.caption ?? `帖子 ${index + 1}`}
                  ctaLabel="了解更多"
                  key={`post-${post.id !== "" ? post.id : index}`}
                  className="flex-shrink-0 w-68 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 relative group block"
                  style={{ width: "17rem" }}
                >
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-700 to-purple-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 pointer-events-none">
                    精选
                  </div>
                  <div className="h-48 bg-gray-100 relative overflow-hidden">
                    <MediaThumb
                      src={postMedia}
                      alt={post.caption ?? `帖子 ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
                  </div>
                  <div className="p-5 relative">
                    <h3 className="font-bold text-gray-900 truncate">
                      {post.caption !== "" ? post.caption : `精选帖子 ${index + 1}`}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                      {post.cta_text !== "" ? post.cta_text : "暂无描述"}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <span className="text-xs text-indigo-700 font-medium">了解更多 →</span>
                    </div>
                  </div>
                </MediaAwareLink>
              );
            }}
            isHighlightSection={true}
          />
        </div>

        <div className="py-4">
          <ScrollableSection
            title="分类"
            viewAllLink="/product-section"
            items={sortedCategories.slice(0, 4)}
            renderItem={(category, index) => {
              const placeholder = makePlaceholderImageUrl(`分类 ${index + 1}`);
              const categoryImage = category.media_url || getCategoryProductImage(category.id);

              const countFromJoin = categoryProductCountById.get(category.id) ?? 0;
              const countFromProductFk = categoryProductCountByProductFk.get(category.id) ?? 0;
              const count = Math.max(countFromJoin, countFromProductFk);

              return (
                <HomeHighlightsCard
                  key={`category-${category.id}`}
                  to={`/product-section/${category.id}`}
                  imageUrl={categoryImage}
                  fallbackImageUrl={placeholder}
                  title={category.name}
                  subtitle={formatProductCount(count)}
                />
              );
            }}
            isHighlightSection={true}
          />
        </div>

        <div className="py-4">
          <ScrollableSection
            title="部门"
            viewAllLink="/product-section?department=all"
            items={sortedDepartments.slice(0, 4)}
            renderItem={(dept, index) => {
              const placeholder = makePlaceholderImageUrl(`部门 ${index + 1}`);
              const img = dept.media_url || getClassificationImage("department_id", dept.id);

              const count = productCountByDepartmentId.get(dept.id) ?? 0;

              return (
                <HomeHighlightsCard
                  key={`dept-${dept.id}`}
                  to={`/product-section?department=${dept.id}`}
                  imageUrl={img}
                  fallbackImageUrl={placeholder}
                  title={dept.name ?? `部门 ${index + 1}`}
                  subtitle={formatProductCount(count)}
                />
              );
            }}
            isHighlightSection={true}
          />
        </div>

        <div className="py-4">
          <ScrollableSection
            title="系列"
            viewAllLink="/product-section?range=all"
            items={sortedRanges.slice(0, 4)}
            renderItem={(range, index) => {
              const placeholder = makePlaceholderImageUrl(`系列 ${index + 1}`);
              const img = range.media_url || getClassificationImage("range_id", range.id);

              const count = productCountByRangeId.get(range.id) ?? 0;

              return (
                <HomeHighlightsCard
                  key={`range-${range.id}`}
                  to={`/product-section?range=${range.id}`}
                  imageUrl={img}
                  fallbackImageUrl={placeholder}
                  title={range.name ?? `系列 ${index + 1}`}
                  subtitle={formatProductCount(count)}
                />
              );
            }}
            isHighlightSection={true}
          />
        </div>

        <div className="py-4">
          <ScrollableSection
            title="品牌"
            viewAllLink="/product-section?brand=all"
            items={sortedBrands.slice(0, 4)}
            renderItem={(brand, index) => {
              const placeholder = makePlaceholderImageUrl(`品牌 ${index + 1}`);
              const img = brand.media_url || getClassificationImage("brand_id", brand.id);

              const count = productCountByBrandId.get(brand.id) ?? 0;

              return (
                <HomeHighlightsCard
                  key={`brand-${brand.id}`}
                  to={`/product-section?brand=${brand.id}`}
                  imageUrl={img}
                  fallbackImageUrl={placeholder}
                  title={brand.name ?? `品牌 ${index + 1}`}
                  subtitle={formatProductCount(count)}
                />
              );
            }}
            isHighlightSection={true}
          />
        </div>

        <div className="py-4">
          <ScrollableSection
            title="商品"
            viewAllLink="/products"
            items={sortedProducts.slice(0, 4)}
            renderItem={(product, index) => {
              const productMediaUrl = productMediaMap.get(product.id);

              const productCategoryIds = productCategories
                .filter(pc => pc.product_id === product.id)
                .map(pc => pc.category_id);

              const productCategoryNames = categories
                .filter(cat => productCategoryIds.includes(cat.id))
                .map(cat => cat.name)
                .join(", ");

              return (
                <Link
                  href={`/product-details/${product.id}`}
                  key={`product-${product.id || index}`}
                  className="flex-shrink-0 w-44 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 group"
                >
                  <div className="h-44 bg-gray-100 relative overflow-hidden">
                    <MediaThumb
                      src={productMediaUrl || "/default-image.jpg"}
                      alt={product.name || `商品 ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {productCategoryNames && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 backdrop-filter backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                        {productCategoryNames}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">
                      {product.name || `商品 ${index + 1}`}
                    </h3>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm font-bold text-indigo-800">
                        RM {product.price?.toFixed(2) ?? "—"}
                      </p>
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }}
            isHighlightSection={false}
          />
        </div>
      </div>
    </LandingLayout>
  );
};

export default HomePageClient;
