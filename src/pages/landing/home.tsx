import React, { useRef, useMemo, useEffect, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { usePostContext } from "../../context/post/PostContext";
import { usePostMediaContext } from "../../context/post/PostMediaContext";
import { useCategoryContext } from "../../context/product/CategoryContext";
import { useDepartmentContext } from "../../context/product/DepartmentContext";
import { useRangeContext } from "../../context/product/RangeContext";
import { useBrandContext } from "../../context/product/BrandContext";
import { useProductCategoryContext } from "../../context/product/ProductCategoryContext";
import { useProductContext } from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import { usePointsMembership } from "../../context/PointsMembershipContext";
import { FaQrcode, FaBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import { LandingLayout } from "../../layouts";
import type { Tables } from "../../database.types";
import { HomeHighlightsCard } from "../../components/home/HomeHighlightsCard";

/**
 * Horizontal scrollable section component for reuse across different content types
 */
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
            <Link to={viewAllLink} className="group bg-gradient-to-r from-indigo-700 to-purple-800 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-sm transform transition-all duration-300 hover:shadow-md hover:scale-105 hover:from-indigo-800 hover:to-purple-900 flex items-center space-x-1 hover:-translate-y-0.5">
              <span>View All</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <Link to={viewAllLink} className="text-indigo-700 text-sm font-medium hover:text-indigo-900 transition-colors duration-200 flex items-center space-x-1 group">
              <span>View All</span>
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
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  );
};

// Add this mock data near the top of the file, after imports
const mockUnreadNotifications = 2;

const HomePage: React.FC = () => {
  const { user, user_detail } = useAuthContext();
  const { posts } = usePostContext();
  const { postMedias } = usePostMediaContext();
  const { categories } = useCategoryContext();
  const { departments } = useDepartmentContext();
  const { ranges } = useRangeContext();
  const { brands } = useBrandContext();
  const { productCategories } = useProductCategoryContext();
  const { products } = useProductContext();
  const { productMedias } = useProductMediaContext();

  /**
   * Build placeholder image URLs for cards that don't have a usable image.
   * Using `encodeURIComponent` prevents broken URLs when text contains spaces.
   */
  const makePlaceholderImageUrl = (text: string): string => {
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(text)}`;
  };

  /**
   * Formats product counts into a human-readable subtitle.
   * Example: "1 product" / "12 products"
   */
  const formatProductCount = (count: number): string => {
    return `${count} product${count === 1 ? "" : "s"}`;
  };

  // Sort posts by latest (created_at or updated_at)
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
  }, [posts]);

  // Sort categories alphabetically by name
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

  // Sort products by latest
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
  }, [products]);

  /**
   * Memoized lookup maps for product counts per classification.
   * These avoid O(n*m) `.filter()` calls inside render loops.
   */
  const categoryProductCountById = useMemo(() => {
    const map = new Map<string, number>();
    for (const pc of productCategories) {
      // `product_categories.category_id` is nullable in DB types; guard to keep map keys strict.
      const categoryId = pc.category_id;
      if (typeof categoryId === "string" && categoryId.trim().length > 0) {
        const prev = map.get(categoryId) ?? 0;
        map.set(categoryId, prev + 1);
      }
    }
    return map;
  }, [productCategories]);

  /**
   * Some environments rely on the direct `products.category_id` foreign key (not product_categories).
   * Build a fallback map so homepage counts reflect reality even when `product_categories` is incomplete.
   */
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

  // Note: Promotions section is currently commented out below, so we avoid building unused mock data here.

  // Points & Membership: fetch actual user points and membership tiers
  const { listMembershipTiers, getUserPointsByUserId } = usePointsMembership();
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

  // Resolve display name from Supabase user data; fallback to email username; otherwise "Guest"
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

  

  // Helper function to get a product image for a category
  const getCategoryProductImage = (categoryId: string): string => {
    // Find product IDs associated with this category
    const productIds = productCategories
      .filter(pc => pc.category_id === categoryId)
      .map(pc => pc.product_id);
    
    // Find the first product that has media
    for (const productId of productIds) {
      const media = productMedias.find(media => media.product_id === productId);
      if (media?.media_url) {
        return media.media_url;
      }
    }

    // Fallback to placeholder
    return "";
  };

  /**
   * Finds an image for a given product classification (department/range/brand) by selecting
   * the first matching product that has media.
   */
  type ProductClassificationKey = "department_id" | "range_id" | "brand_id";

  const getClassificationImage = (key: ProductClassificationKey, id: string): string => {
    const product = products.find((p) => p[key] === id);
    if (product) {
      const media = productMedias.find((m) => m.product_id === product.id);
      if (media?.media_url) return media.media_url;
    }
    return "";
  };

  return (
    <LandingLayout>
      {/* User Information Card */}
      <div className="p-5 pt-8">
        <div className="bg-gradient-to-br from-indigo-800 via-indigo-700 to-purple-800 text-white relative overflow-hidden rounded-xl shadow-lg">
          <div className="absolute inset-0 bg-pattern opacity-5"></div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white bg-opacity-10 blur-xl"></div>
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white bg-opacity-5 blur-xl"></div>
          
          <div className="px-6 pt-6 pb-4 relative">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wider opacity-90">Wallet Balance</h2>
              <Link 
                to="/notifications" 
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
                      <span className="text-3xl font-bold tracking-tight">{points} Points</span>
                      <span className="ml-3 px-3 py-1 text-xs font-semibold bg-yellow-500 bg-opacity-20 text-yellow-300 rounded-full border border-yellow-500 border-opacity-20">
                        {levelData.currentLevel || "Member"}
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
                            {levelData.nextLevel ? `${levelData.pointsToNextLevel} points to ${levelData.nextLevel}` : "Max tier reached"}
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
              /* Wrap in Link so the banner is tappable on mobile.
                 `returnTo=/` brings the user back to the home page after login. */
              <Link
                to="/authentication/sign-in?returnTo=%2F"
                className="mt-6 block py-4 px-5 bg-white bg-opacity-15 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg border border-white border-opacity-20 active:bg-opacity-25 transition-all"
              >
                <p className="text-sm uppercase tracking-wider font-medium">LOG IN / REGISTER</p>
                <p className="text-xs mt-1 opacity-80 leading-relaxed">
                  Login to check your progress and redeem exclusive rewards
                </p>
                <p className="text-xs mt-2 font-semibold opacity-90">Tap to sign in →</p>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="pt-4">
        {/* Highlights Section */}
        <div className="py-4">
          <ScrollableSection
            title="Highlights"
            viewAllLink="/highlights"
            items={sortedPosts.slice(0, 10)}
            renderItem={(post, index) => {
              // Find media for this post
              const postMedia = post.medias?.[0]?.media_url || 
                postMedias.find(media => media.post_id === post.id)?.media_url || 
                `https://via.placeholder.com/300x200?text=Post+${index + 1}`;
              
              return (
                <Link 
                  to="/product-section"
                  key={`post-${post.id || index}`} 
                  className="flex-shrink-0 w-68 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 relative group"
                  style={{ width: "17rem" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-xl"></div>
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-700 to-purple-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    FEATURED
                  </div>
                  <div className="h-48 bg-gray-100 relative">
                    <img 
                      src={postMedia} 
                      alt={post.caption || `Post ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-30"></div>
                  </div>
                  <div className="p-5 relative">
                    <h3 className="font-bold text-gray-900 truncate">
                      {post.caption || `Featured Post ${index + 1}`}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                      {post.cta_text || "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <span className="text-xs text-indigo-700 font-medium">Discover More →</span>
                    </div>
                  </div>
                </Link>
              );
            }}
            isHighlightSection={true}
          />
        </div>
        
        {/* Categories Section */}
        <div className="py-4">
          <ScrollableSection
            title="Categories"
            viewAllLink="/product-section"
            items={sortedCategories.slice(0, 10)}
            renderItem={(category, index) => {
              // Step 1: Determine the best image we can show for this category.
              const placeholder = makePlaceholderImageUrl(`Category ${index + 1}`);
              const categoryImage = category.media_url || getCategoryProductImage(category.id);

              // Step 2: Compute product count subtitle (via product_categories mapping).
              // Prefer many-to-many counts (product_categories), but fall back to products.category_id counts.
              const countFromJoin = categoryProductCountById.get(category.id) ?? 0;
              const countFromProductFk = categoryProductCountByProductFk.get(category.id) ?? 0;
              const count = Math.max(countFromJoin, countFromProductFk);

              // Step 3: Render the Highlights-style card (large, consistent with Highlights section).
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

        {/* Departments Section */}
        <div className="py-4">
          <ScrollableSection
            title="Departments"
            viewAllLink="/product-section?department=all"
            items={sortedDepartments.slice(0, 10)}
            renderItem={(dept, index) => {
              // Step 1: Determine image for this department.
              const placeholder = makePlaceholderImageUrl(`Department ${index + 1}`);
              const img = dept.media_url || getClassificationImage("department_id", dept.id);

              // Step 2: Compute product count subtitle (via products foreign key).
              const count = productCountByDepartmentId.get(dept.id) ?? 0;

              // Step 3: Render Highlights-style card.
              return (
                <HomeHighlightsCard
                  key={`dept-${dept.id}`}
                  to={`/product-section?department=${dept.id}`}
                  imageUrl={img}
                  fallbackImageUrl={placeholder}
                  title={dept.name ?? `Department ${index + 1}`}
                  subtitle={formatProductCount(count)}
                />
              );
            }}
            isHighlightSection={true}
          />
        </div>

        {/* Ranges Section */}
        <div className="py-4">
          <ScrollableSection
            title="Ranges"
            viewAllLink="/product-section?range=all"
            items={sortedRanges.slice(0, 10)}
            renderItem={(range, index) => {
              // Step 1: Determine image for this range.
              const placeholder = makePlaceholderImageUrl(`Range ${index + 1}`);
              const img = range.media_url || getClassificationImage("range_id", range.id);

              // Step 2: Compute product count subtitle.
              const count = productCountByRangeId.get(range.id) ?? 0;

              // Step 3: Render Highlights-style card.
              return (
                <HomeHighlightsCard
                  key={`range-${range.id}`}
                  to={`/product-section?range=${range.id}`}
                  imageUrl={img}
                  fallbackImageUrl={placeholder}
                  title={range.name ?? `Range ${index + 1}`}
                  subtitle={formatProductCount(count)}
                />
              );
            }}
            isHighlightSection={true}
          />
        </div>

        {/* Brands Section */}
        <div className="py-4">
          <ScrollableSection
            title="Brands"
            viewAllLink="/product-section?brand=all"
            items={sortedBrands.slice(0, 10)}
            renderItem={(brand, index) => {
              // Step 1: Determine image for this brand.
              const placeholder = makePlaceholderImageUrl(`Brand ${index + 1}`);
              const img = brand.media_url || getClassificationImage("brand_id", brand.id);

              // Step 2: Compute product count subtitle.
              const count = productCountByBrandId.get(brand.id) ?? 0;

              // Step 3: Render Highlights-style card.
              return (
                <HomeHighlightsCard
                  key={`brand-${brand.id}`}
                  to={`/product-section?brand=${brand.id}`}
                  imageUrl={img}
                  fallbackImageUrl={placeholder}
                  title={brand.name ?? `Brand ${index + 1}`}
                  subtitle={formatProductCount(count)}
                />
              );
            }}
            isHighlightSection={true}
          />
        </div>
        
        {/* Products Section */}
        <div className="py-4">
          <ScrollableSection
            title="Products"
            viewAllLink="/products"
            items={sortedProducts.slice(0, 10)}
            renderItem={(product, index) => {
              const productMedia = productMedias.find(media => media.product_id === product.id);
              
              // Get categories for this product
              const productCategoryIds = productCategories
                .filter(pc => pc.product_id === product.id)
                .map(pc => pc.category_id);
              
              const productCategoryNames = categories
                .filter(cat => productCategoryIds.includes(cat.id))
                .map(cat => cat.name)
                .join(", ");

              return (
                <Link
                  to={`/product-details/${product.id}`}
                  key={`product-${product.id || index}`}
                  className="flex-shrink-0 w-44 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1 group"
                >
                  <div className="h-44 bg-gray-100 relative">
                    <img 
                      src={productMedia?.media_url || `https://via.placeholder.com/160?text=Product+${index + 1}`} 
                      alt={product.name || `Product ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {productCategoryNames && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 backdrop-filter backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                        {productCategoryNames}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-10 group-hover:opacity-30 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">
                      {product.name || `Product ${index + 1}`}
                    </h3>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm font-bold text-indigo-800">
                        RM {product.price?.toFixed(2) || (Math.random() * 100).toFixed(2)}
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
        
        {/* Promotions Section */}
        {/* <div className="py-6 pb-24">
          <ScrollableSection
            title="Promotions"
            viewAllLink="/promotions"
            items={sortedPromotions}
            renderItem={(promotion, index) => (
              <div 
                key={`promotion-${promotion.id || index}`} 
                className="flex-shrink-0 w-68 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                style={{ width: "17rem" }}
              >
                <div className="h-44 bg-gray-100 relative">
                  <img 
                    src={`https://via.placeholder.com/300x200?text=Promotion+${index + 1}`} 
                    alt={`Promotion ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-50"></div>
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    {promotion.type}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900">{promotion.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Limited time offer</p>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-indigo-800 font-bold flex items-center">
                      <span className="text-xs mr-1">SAVE</span>
                      <span>{promotion.discount}</span>
                    </p>
                    <button className="px-4 py-1.5 bg-gradient-to-r from-indigo-700 to-purple-800 text-white rounded-full text-sm font-medium hover:from-indigo-800 hover:to-purple-900 transition-colors duration-300 shadow-sm hover:shadow">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            )}
            isHighlightSection={false}
          />
        </div> */}
      </div>
    </LandingLayout>
  );
};

export default HomePage;