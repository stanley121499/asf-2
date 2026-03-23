"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWishlistContext } from "@/context/WishlistContext";
import { useCategoryContext } from "@/context/product/CategoryContext";
import { useProductMediaContext } from "@/context/product/ProductMediaContext";
import { useAuthContext } from "@/context/AuthContext";
import ProductCard from "@/components/home/ProductCard";
import Link from "next/link";
import BottomNavbar from "@/components/home/bottom-nav";

const WishlistPage: React.FC = () => {
  const { wishlistItems, loading } = useWishlistContext();
  const { productMedias } = useProductMediaContext();
  const { categories } = useCategoryContext();

  const router = useRouter();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'products' | 'posts'>('products');

  const categoryNameById = useMemo<Record<string, string>>(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const primaryImageByProductId = useMemo<Record<string, string>>(() => {
    const record: Record<string, { url: string; arrangement: number }> = {};
    productMedias.forEach((media) => {
      const productId = media.product_id;
      if (!productId || !media.media_url) return;
      const arrangement = media.arrangement ?? 0;
      const existing = record[productId];
      if (!existing || arrangement < existing.arrangement) {
        record[productId] = { url: media.media_url, arrangement };
      }
    });

    return Object.keys(record).reduce<Record<string, string>>((acc, key) => {
      acc[key] = record[key]?.url ?? "";
      return acc;
    }, {});
  }, [productMedias]);

  const validWishlistProducts = useMemo(() => {
    return wishlistItems
      .map(item => item.product)
      .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);
  }, [wishlistItems]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-xl font-medium text-[var(--color-text)] mb-2">登录以查看收藏</h3>
        <p className="text-sm text-[var(--color-muted)] mb-6">您需要登录后才能查看已保存的商品</p>
        <Link href="/authentication/sign-in?returnTo=%2Fwishlist" className="w-full btn-primary rounded-xl py-3 max-w-xs">
          登录 / 注册
        </Link>
        <button
          onClick={() => router.push("/product-section")}
          className="mt-4 text-sm text-[var(--color-muted)] underline underline-offset-4"
        >
          继续浏览商品 →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24">
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] h-[56px] flex items-center px-4 justify-center">
        <h1 className="text-center font-display text-lg tracking-wide">
          已收藏
        </h1>
      </div>

      <div className="px-4 py-3 bg-white flex justify-center gap-3 sticky top-[56px] z-30">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-8 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-[var(--color-text)] text-white' : 'border border-[var(--color-border)] text-[var(--color-text)]'}`}
        >
          商品
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-8 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'posts' ? 'bg-[var(--color-text)] text-white' : 'border border-[var(--color-border)] text-[var(--color-text)]'}`}
        >
          帖子
        </button>
      </div>

      <div className="px-4 py-6">
        {activeTab === 'products' ? (
          loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          ) : validWishlistProducts.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">收藏夹为空</h3>
              <p className="text-sm text-[var(--color-muted)] mb-6">浏览商品，发现心仪款式</p>
              <button onClick={() => router.push('/product-section')} className="btn-primary rounded-xl px-8 py-3 max-w-[200px] w-full mx-auto">
                去购物
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {validWishlistProducts.map((product) => {
                const mediaUrl = primaryImageByProductId[product.id] || "/default-image.jpg";
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    mediaUrl={mediaUrl}
                    onQuickView={() => router.push(`/product-details/${product.id}`)}
                  />
                );
              })}
            </div>
          )
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">暂无收藏帖子</h3>
            <p className="text-sm text-[var(--color-muted)] mb-6">去首页发现更多精彩内容</p>
            <button onClick={() => router.push('/highlights')} className="btn-primary rounded-xl px-8 py-3 max-w-[200px] w-full mx-auto">
              去浏览
            </button>
          </div>
        )}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default WishlistPage;