import React, { useMemo } from "react";
import NavbarHome from "../../components/navbar-home";
import { usePostContext, Post } from "../../context/post/PostContext";
import { usePostMediaContext } from "../../context/post/PostMediaContext";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import { useImagePreloader } from "../../hooks/useImagePreloader";
import SmartMedia from "../../components/SmartMedia";
import MediaAwareLink from "../../components/MediaAwareLink";

/**
 * Highlights page component that displays featured posts with a premium feel.
 * Clicking a card whose media is a **video** opens a VideoLightboxModal so the
 * user can watch the video before navigating. Image cards link directly.
 */
const HighlightsPage: React.FC = () => {
  const { posts, loading: postsLoading } = usePostContext();
  const { postMedias, loading: mediaLoading } = usePostMediaContext();

  /** Build a fast O(1) lookup: post_id → media_url */
  const postMediaMap = useMemo<Map<string, string>>(
    () => new Map(postMedias.map((m) => [m.post_id, m.media_url ?? ""])),
    [postMedias]
  );

  const featuredPosts = useMemo<Post[]>(
    () =>
      [...posts].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [posts]
  );

  /**
   * Preload ALL image URLs for the page immediately after the contexts are ready.
   * This is an editorial/gallery page — the user will scroll through all content,
   * so there is no benefit to holding back any download. SmartMedia will check
   * `imageCache` on mount and skip the skeleton entirely for any URL that finished
   * downloading first. Video URLs are automatically skipped by `useImagePreloader`.
   */
  const preloadUrls = useMemo<string[]>(
    () =>
      featuredPosts.map(
        (post) =>
          post.medias?.[0]?.media_url ??
          postMediaMap.get(post.id) ??
          ""
      ),
    [featuredPosts, postMediaMap]
  );

  useImagePreloader(preloadUrls);

  if (postsLoading || mediaLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <NavbarHome />
        {/* Hero banner skeleton */}
        <div className="w-full h-[75vh] animate-pulse bg-gray-200 dark:bg-gray-700" />
        {/* Second banner skeleton */}
        <div className="w-full h-[75vh] animate-pulse bg-gray-200 dark:bg-gray-700 mt-2" />
        {/* Spotlight section skeleton */}
        <div className="mt-6 px-4">
          <div className="mb-6 h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          {/* Full-width spotlight */}
          <div className="mb-6 w-full aspect-[4/5] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          {/* Side-by-side pair */}
          <div className="flex space-x-2">
            <div className="w-1/2 aspect-[3/4] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="w-1/2 aspect-[3/4] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Top Navigation */}
      <NavbarHome />

      {/* Main Content */}
      <div className="flex-grow">

        {/* ── Hero Banner ──────────────────────────────────────────────── */}
        {featuredPosts.length > 0 && (() => {
          const heroPosts = featuredPosts[0];
          const heroMedia =
            heroPosts.medias?.[0]?.media_url ??
            postMediaMap.get(heroPosts.id) ??
            "https://via.placeholder.com/800x600?text=Featured+Highlight";

          return (
            <MediaAwareLink
              to="/product-section"
              mediaSrc={heroMedia}
              caption={heroPosts.caption ?? "梦幻粉彩"}
              ctaLabel="立即选购"
              className="relative block"
            >
              <SmartMedia
                src={heroMedia}
                alt="Featured Collection"
                className="w-full h-[75vh] object-cover"
                eager={true}
              />
              <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none">
                <h2 className="text-3xl font-semibold text-white uppercase tracking-wide">
                  梦幻粉彩
                </h2>
                <div className="mt-6">
                  <span className="inline-block px-8 py-3 bg-white text-black font-medium uppercase tracking-wider text-sm">
                    立即选购
                  </span>
                </div>
              </div>
            </MediaAwareLink>
          );
        })()}

        {/* ── Festival Swirls Banner ────────────────────────────────────── */}
        {featuredPosts.length > 1 && (() => {
          const post = featuredPosts[1];
          const media =
            post.medias?.[0]?.media_url ??
            postMediaMap.get(post.id) ??
            "https://via.placeholder.com/800x600?text=Festival+Collection";

          return (
            <MediaAwareLink
              to="/product-section"
              mediaSrc={media}
              caption={post.caption ?? "节日风情"}
              ctaLabel="立即选购"
              className="relative block mt-2"
            >
              <SmartMedia
                src={media}
                alt="Festival Collection"
                className="w-full h-[75vh] object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none">
                <h2 className="text-3xl font-semibold text-white uppercase tracking-wide">
                  节日风情
                </h2>
                <div className="mt-6">
                  <span className="inline-block px-8 py-3 bg-white text-black font-medium uppercase tracking-wider text-sm">
                    立即选购
                  </span>
                </div>
              </div>
            </MediaAwareLink>
          );
        })()}

        {/* ── In The Spotlight Section ─────────────────────────────────── */}
        <div className="mt-6 px-4">
          <h2 className="text-xl font-bold mb-6 uppercase tracking-wide">聚光灯</h2>

          {/* Full-Width Spotlight Item */}
          {featuredPosts.length > 2 && (() => {
            const post = featuredPosts[2];
            const media =
              post.medias?.[0]?.media_url ??
              postMediaMap.get(post.id) ??
              "https://via.placeholder.com/800x500?text=Spring+Vacay";

            return (
              <MediaAwareLink
                to="/product-section"
                mediaSrc={media}
                caption={post.caption ?? "春日假期"}
                ctaLabel="立即选购"
                className="relative block mb-6"
              >
                <SmartMedia
                  src={media}
                  alt="Spring Vacay"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="absolute bottom-0 left-0 w-full p-6 pointer-events-none">
                  <h3 className="text-xl font-medium text-white uppercase tracking-wide">
                    春日假期
                  </h3>
                </div>
                <div className="absolute bottom-6 left-0 w-full px-6 pointer-events-none">
                  <span className="inline-block px-6 py-2 bg-white text-black text-sm font-medium uppercase tracking-wider">
                    立即选购
                  </span>
                </div>
              </MediaAwareLink>
            );
          })()}

          {/* Side-by-Side Spotlight Items */}
          <div className="flex space-x-2">
            {featuredPosts.slice(3, 5).map((post, index) => {
              const postMedia =
                post.medias?.[0]?.media_url ??
                postMediaMap.get(post.id) ??
                `https://via.placeholder.com/400x500?text=Spotlight+${index + 1}`;

              const titles = ["时尚拖鞋", "海滩必备"];

              return (
                <MediaAwareLink
                  to="/product-section"
                  mediaSrc={postMedia}
                  caption={post.caption ?? titles[index] ?? ""}
                  ctaLabel="立即选购"
                  key={post.id === "" ? `spotlight-${index}` : post.id}
                  className="w-1/2 block"
                >
                  <div className="relative">
                    <SmartMedia
                      src={postMedia}
                      alt={post.caption ?? titles[index] ?? ""}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <div className="absolute bottom-0 left-0 w-full p-4 pointer-events-none">
                      <h3 className="text-sm font-medium text-white uppercase tracking-wide">
                        {post.caption === "" ? (titles[index] ?? "") : post.caption}
                      </h3>
                    </div>
                  </div>
                </MediaAwareLink>
              );
            })}
          </div>
        </div>

        {/* ── Trending Products Section ────────────────────────────────── */}
        <div className="mt-12 px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold uppercase tracking-wide">热门商品</h2>
            <div className="flex space-x-2">
              <button aria-label="Previous" className="p-2 border rounded-full">
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>
              <button aria-label="Next" className="p-2 border rounded-full">
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex space-x-4 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide scroll-smooth snap-x snap-mandatory overscroll-x-contain">
            {featuredPosts.slice(5, 8).map((post, index) => {
              const postMedia =
                post.medias?.[0]?.media_url ??
                postMediaMap.get(post.id) ??
                `https://via.placeholder.com/400x400?text=Product+${index + 1}`;

              return (
                <MediaAwareLink
                  to="/product-section"
                  mediaSrc={postMedia}
                  caption={post.caption ?? `Product ${index + 1}`}
                  ctaLabel="立即选购"
                  key={post.id === "" ? `product-${index}` : post.id}
                  className="flex-shrink-0 w-[60vw] snap-start block"
                >
                  <div className="relative">
                    <SmartMedia
                      src={postMedia}
                      alt={post.caption ?? `Product ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                </MediaAwareLink>
              );
            })}
          </div>
        </div>

        {/* ── Featured Collections ─────────────────────────────────────── */}
        <div className="mt-12 px-0">
          <h2 className="text-xl font-bold uppercase tracking-wide px-4 mb-6">精选合集</h2>

          {/* First Row — Full Width */}
          {featuredPosts.length > 8 && (() => {
            const post = featuredPosts[8];
            const media =
              post.medias?.[0]?.media_url ??
              postMediaMap.get(post.id) ??
              "https://via.placeholder.com/800x400?text=Featured+Collection";

            return (
              <MediaAwareLink
                to="/product-section"
                mediaSrc={media}
                caption={post.caption ?? "街头明星"}
                ctaLabel="立即选购"
                className="relative block mb-2"
              >
                <SmartMedia
                  src={media}
                  alt={post.caption ?? "Featured Collection"}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6 pointer-events-none">
                  <h3 className="text-xl font-medium text-white uppercase tracking-wide">
                    街头明星
                  </h3>
                  <div className="mt-4">
                    <span className="inline-block px-6 py-2 bg-white text-black text-sm font-medium uppercase tracking-wider">
                      立即选购
                    </span>
                  </div>
                </div>
              </MediaAwareLink>
            );
          })()}

          {/* Second Row — Two Side-by-Side */}
          <div className="flex">
            {featuredPosts.slice(9, 11).map((post, index) => {
              const postMedia =
                post.medias?.[0]?.media_url ??
                postMediaMap.get(post.id) ??
                `https://via.placeholder.com/400x600?text=Collection+${index + 1}`;

              const titles = ["打破常规", "个性前卫"];

              return (
                <MediaAwareLink
                  to="/product-section"
                  mediaSrc={postMedia}
                  caption={post.caption ?? titles[index] ?? ""}
                  ctaLabel="立即选购"
                  key={post.id === "" ? `collection-side-${index}` : post.id}
                  className="w-1/2 relative block"
                >
                  <SmartMedia
                    src={postMedia}
                    alt={post.caption ?? (titles[index] ?? "")}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-4 pointer-events-none">
                    <h3 className="text-sm font-medium text-white uppercase tracking-wide">
                      {post.caption === "" ? (titles[index] ?? "") : post.caption}
                    </h3>
                    <div className="mt-3">
                      <span className="inline-block px-4 py-2 bg-white text-black text-xs font-medium uppercase tracking-wider">
                        立即选购
                      </span>
                    </div>
                  </div>
                </MediaAwareLink>
              );
            })}
          </div>

          {/* Third Row — Full Width */}
          {featuredPosts.length > 11 && (() => {
            const post = featuredPosts[11];
            const media =
              post.medias?.[0]?.media_url ??
              postMediaMap.get(post.id) ??
              "https://via.placeholder.com/800x400?text=Street+Meets+Chic";

            return (
              <MediaAwareLink
                to="/product-section"
                mediaSrc={media}
                caption={post.caption ?? "街头时尚"}
                ctaLabel="立即选购"
                className="relative block mt-2"
              >
                <SmartMedia
                  src={media}
                  alt={post.caption ?? "Street Meets Chic"}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6 pointer-events-none">
                  <h3 className="text-xl font-medium text-white uppercase tracking-wide">
                    街头时尚
                  </h3>
                  <div className="mt-4">
                    <span className="inline-block px-6 py-2 bg-white text-black text-sm font-medium uppercase tracking-wider">
                      立即选购
                    </span>
                  </div>
                </div>
              </MediaAwareLink>
            );
          })()}
        </div>

        {/* ── Texture Talks Section ────────────────────────────────────── */}
        {featuredPosts.length > 12 && (() => {
          const post = featuredPosts[12];
          const media =
            post.medias?.[0]?.media_url ??
            postMediaMap.get(post.id) ??
            "https://via.placeholder.com/800x400?text=Texture+Talks";

          return (
            <MediaAwareLink
              to="/product-section"
              mediaSrc={media}
              caption={post.caption ?? "纹理讲述"}
              ctaLabel="立即购买"
              className="block mt-12 px-0"
            >
              <div className="relative">
                <SmartMedia
                  src={media}
                  alt={post.caption ?? "Texture Talks"}
                  className="w-full aspect-[3/2] object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-center items-start p-8 pointer-events-none">
                  <h2 className="text-2xl font-semibold text-white mb-2">纹理讲述</h2>
                  <p className="text-white text-sm mb-6">感受面料</p>
                  <span className="inline-block px-6 py-3 bg-white text-black text-sm font-medium uppercase tracking-wider rounded-full">
                    立即购买
                  </span>
                </div>
              </div>
            </MediaAwareLink>
          );
        })()}

        {/* ── All Posts Grid ───────────────────────────────────────────── */}
        <div className="mt-12 px-4 mb-16">
          <h2 className="text-xl font-bold uppercase tracking-wide mb-6">探索全部精选</h2>

          <div className="grid grid-cols-2 gap-4">
            {featuredPosts.slice(13).map((post, index) => {
              const postMedia =
                post.medias?.[0]?.media_url ??
                postMediaMap.get(post.id) ??
                `https://via.placeholder.com/400x400?text=Item+${index + 1}`;

              return (
                <MediaAwareLink
                  to="/product-section"
                  mediaSrc={postMedia}
                  caption={post.caption ?? `Item ${index + 1}`}
                  ctaLabel="立即购买"
                  key={post.id === "" ? `all-item-${index}` : post.id}
                  className="flex flex-col block"
                >
                  <div className="relative">
                    <SmartMedia
                      src={postMedia}
                      alt={post.caption ?? `Item ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none">
                      <h3 className="text-sm font-medium text-white">
                        {post.caption === "" ? `Item ${index + 1}` : post.caption}
                      </h3>
                    </div>
                  </div>
                  <div className="py-2">
                    <span className="block w-full py-2 mt-2 border border-gray-300 text-xs font-medium uppercase tracking-wider text-center">
                      立即购买
                    </span>
                  </div>
                </MediaAwareLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightsPage;
