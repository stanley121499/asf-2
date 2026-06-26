"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAlertContext } from "@/context/AlertContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useAddToCartLogContext } from "@/context/product/AddToCartLogContext";
import { useAuthContext } from "@/context/AuthContext";
import { isSoftDeletedRow, readDeletedAt } from "@/utils/softDeleteRuntime";
import type { Tables } from "@/database.types";
import { HiOutlineHeart, HiHeart, HiOutlineChevronDown, HiOutlineArrowLeft } from "react-icons/hi";
import { useWishlistContext } from "@/context/WishlistContext";
import ReviewModal from "@/components/ReviewModal";
import ReviewsList from "@/components/ReviewsList";
import {
  getProductStockQuantity,
  resolveProductStockRow,
} from "@/utils/productStock";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { claimPolicyConfig } from "@/modules/claims/claimPolicyConfig";

interface ProductDetailsClientProps {
  productId: string;
  initialProduct: Tables<"products"> | null;
  productMedias: Tables<"product_medias">[];
  productColors: Tables<"product_colors">[];
  productSizes: Tables<"product_sizes">[];
  productStocks: Tables<"product_stock">[];
}

const ProductDetailsClient: React.FC<ProductDetailsClientProps> = ({
  productId,
  initialProduct,
  productMedias,
  productColors,
  productSizes,
  productStocks,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/product-section';
  const { user } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { createAddToCart } = useAddToCartContext();
  const { createAddToCartLog } = useAddToCartLogContext();
  const { isEnabled } = useFeatureFlags();
  const claimsEnabled = isEnabled("claims");

  const product = initialProduct;

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const isSaved = product !== null ? isInWishlist(product.id) : false;

  type ProductAvailability =
    | { status: "available" }
    | { status: "deleted"; name: string; deletedAt: string }
    | { status: "missing" };

  const availability: ProductAvailability = useMemo(() => {
    if (!product) return { status: "missing" };
    if (isSoftDeletedRow(product)) {
      const deletedAt = readDeletedAt(product);
      return {
        status: "deleted",
        name: product.name ?? "Product",
        deletedAt: deletedAt ?? "",
      };
    }
    return { status: "available" };
  }, [product]);

  const sortedProductMedia = useMemo(() => {
    const medias = [...productMedias];
    medias.sort((a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0));
    return medias;
  }, [productMedias]);

  const activeColorsForProduct = useMemo(() => productColors.filter((c) => c.active), [productColors]);
  const activeSizesForProduct = useMemo(() => productSizes.filter((s) => s.active), [productSizes]);

  const requiresColor = activeColorsForProduct.length > 0;
  const requiresSize = activeSizesForProduct.length > 0;

  const [selectedColor, setSelectedColor] = useState<Tables<"product_colors"> | null>(null);
  const [selectedSize, setSelectedSize] = useState<Tables<"product_sizes"> | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<string>("description");

  useEffect(() => {
    if (selectedImageIndex >= sortedProductMedia.length && sortedProductMedia.length > 0) {
      setSelectedImageIndex(0);
    }
  }, [selectedImageIndex, sortedProductMedia.length]);

  useEffect(() => {
    if (!requiresColor) {
      if (selectedColor !== null) setSelectedColor(null);
      return;
    }
    if (activeColorsForProduct.length === 1) {
      setSelectedColor(activeColorsForProduct[0]);
      return;
    }
  }, [activeColorsForProduct, requiresColor, selectedColor]);

  useEffect(() => {
    if (!requiresSize) {
      if (selectedSize !== null) setSelectedSize(null);
      return;
    }
    if (activeSizesForProduct.length === 1) {
      setSelectedSize(activeSizesForProduct[0]);
      return;
    }
  }, [activeSizesForProduct, requiresSize, selectedSize]);

  const currentStockRow = useMemo(() => {
    return resolveProductStockRow({
      productId,
      productStocks,
      requiresColor,
      requiresSize,
      selectedColorId: selectedColor?.id ?? null,
      selectedSizeId: selectedSize?.id ?? null,
    });
  }, [productId, productStocks, requiresColor, requiresSize, selectedColor, selectedSize]);

  const hasAllRequiredSelections = (!requiresColor || selectedColor !== null) && (!requiresSize || selectedSize !== null);
  const currentStockQuantity = getProductStockQuantity(currentStockRow);
  const isInStock = hasAllRequiredSelections && currentStockRow !== null && currentStockQuantity > 0;
  const disableActions = hasAllRequiredSelections && !isInStock;

  const validateVariantAndStock = useCallback(() => {
    if (!productId) return { ok: false, message: "缺少商品ID。" };
    if (requiresColor && !selectedColor) return { ok: false, message: "请选择颜色。" };
    if (requiresSize && !selectedSize) return { ok: false, message: "请选择尺码。" };

    const colorId = requiresColor ? selectedColor?.id ?? null : null;
    const sizeId = requiresSize ? selectedSize?.id ?? null : null;

    if (!currentStockRow) return { ok: false, message: "所选规格暂无库存。" };
    if (typeof currentStockRow.count !== "number" || currentStockRow.count < 1) {
      return { ok: false, message: "此商品库存不足。" };
    }

    return { ok: true, colorId, sizeId };
  }, [currentStockRow, productId, requiresColor, requiresSize, selectedColor, selectedSize]);

  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    if (!user?.id) {
      const confirmLogin = window.confirm("请先登录或注册账号，即可将此商品加入购物袋。");
      if (confirmLogin) {
        const currentPath = `/product-details/${product.id}`;
        router.push(`/authentication/sign-in?returnTo=${encodeURIComponent(currentPath)}`);
      }
      return;
    }

    const validation = validateVariantAndStock();
    if (!validation.ok) {
      showAlert(validation.message || "验证失败", "error");
      return;
    }

    await createAddToCart({
      product_id: product.id,
      user_id: user.id,
      amount: 1,
      color_id: validation.colorId,
      size_id: validation.sizeId,
    });
    await createAddToCartLog({
      product_id: product.id,
      action_type: "add",
      amount: 1,
    });
    router.push("/cart");
  }, [createAddToCart, createAddToCartLog, router, product, showAlert, user?.id, validateVariantAndStock]);

  const handleToggleWishlist = useCallback(async (): Promise<void> => {
    if (!product) return;
    if (!user?.id) {
      const confirmLogin = window.confirm("请先登录或注册账号，即可收藏此商品。");
      if (confirmLogin) {
        const currentPath = `/product-details/${product.id}`;
        router.push(`/authentication/sign-in?returnTo=${encodeURIComponent(currentPath)}`);
      }
      return;
    }
    if (isSaved) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  }, [addToWishlist, isSaved, product, removeFromWishlist, router, user?.id]);

  if (availability.status === "deleted" || availability.status === "missing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-4">
          {availability.status === "deleted" ? "商品不可用" : "未找到商品"}
        </h1>
        <button
          onClick={() => router.push("/product-section")}
          className="btn-primary rounded-xl px-6 py-3"
        >
          继续购物
        </button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white pb-[100px] relative">
      <button 
        onClick={() => router.push(from)}
        className="absolute top-safe-area left-4 top-4 z-50 w-10 h-10 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center"
      >
        <HiOutlineArrowLeft size={20} className="text-black" />
      </button>

      <div className="relative w-full pt-[100%] bg-gray-100">
        <Image
          src={sortedProductMedia[selectedImageIndex]?.media_url || "/default-image.jpg"}
          alt={product.name ?? ""}
          fill
          className="object-cover"
          priority
        />
        {sortedProductMedia.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium tracking-widest flex items-center gap-2">
            <span>{selectedImageIndex + 1} / {sortedProductMedia.length}</span>
          </div>
        )}
        
        {sortedProductMedia.length > 1 && (
          <div className="absolute inset-0 flex">
            <div 
              className="w-1/2 h-full" 
              onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : sortedProductMedia.length - 1)} 
            />
            <div 
              className="w-1/2 h-full" 
              onClick={() => setSelectedImageIndex(prev => prev < sortedProductMedia.length - 1 ? prev + 1 : 0)} 
            />
          </div>
        )}
      </div>

      <div className="px-5 pt-6 pb-8">
        <div className="flex justify-between items-start gap-4">
          <h1 className="font-display text-2xl text-[var(--color-text)] leading-snug">
            {product.name}
          </h1>
          <button
            onClick={() => void handleToggleWishlist()}
            className="shrink-0 p-1"
          >
            {isSaved ? <HiHeart size={24} className="text-red-500" /> : <HiOutlineHeart size={24} className="text-[var(--color-text)]" />}
          </button>
        </div>
        <p className="text-[var(--color-accent)] text-lg font-medium mt-2">
          RM {(product.price ?? 0).toFixed(2)}
        </p>

        <div className="mt-4">
          {!hasAllRequiredSelections && (requiresColor || requiresSize) ? (
            <p className="text-sm text-[var(--color-muted)]">
              请选择{[requiresColor && !selectedColor ? "颜色" : "", requiresSize && !selectedSize ? "尺码" : ""].filter(Boolean).join("和")}
            </p>
          ) : (
            <p className={`text-sm font-medium ${isInStock ? "text-green-600" : "text-red-500"}`}>
              {isInStock ? `有货（剩余 ${currentStockQuantity} 件）` : "缺货"}
            </p>
          )}
        </div>

        {requiresColor && (
          <div className="mt-8">
            <h3 className="text-sm text-[var(--color-text)] mb-3 font-medium">颜色</h3>
            <div className="flex flex-wrap gap-4">
              {activeColorsForProduct.map((color) => {
                const isSelected = selectedColor?.id === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color)}
                    className={`h-10 px-4 rounded-full border-2 flex items-center justify-center text-sm transition-colors ${
                      isSelected ? "border-black text-black font-medium" : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {color.color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {requiresSize && (
          <div className="mt-8">
            <h3 className="text-sm text-[var(--color-text)] mb-3 font-medium">尺码</h3>
            <div className="flex flex-wrap gap-3">
              {activeSizesForProduct.map((size) => {
                const isSelected = selectedSize?.id === size.id;
                return (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`h-12 border ${isSelected ? "border-black bg-black text-white" : "border-gray-200 bg-white text-[var(--color-text)]"} px-6 flex items-center justify-center transition-all`}
                  >
                    <span className={`text-sm ${isSelected ? "font-medium" : ""}`}>{size.size}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-10 border-t border-[var(--color-border)]">
          <button 
            onClick={() => setOpenAccordion(openAccordion === "description" ? "" : "description")}
            className="w-full py-5 flex justify-between items-center border-b border-[var(--color-border)]"
          >
            <span className="text-base text-[var(--color-text)]">商品详情</span>
            <HiOutlineChevronDown className={`transition-transform ${openAccordion === "description" ? "rotate-180" : ""}`} />
          </button>
          {openAccordion === "description" && (
            <div className="py-4 text-[var(--color-muted)] text-sm leading-relaxed whitespace-pre-line border-b border-[var(--color-border)]">
              {product.description || "暂无详情介绍。"}
            </div>
          )}

          <button 
            onClick={() => setOpenAccordion(openAccordion === "material" ? "" : "material")}
            className="w-full py-5 flex justify-between items-center border-b border-[var(--color-border)]"
          >
            <span className="text-base text-[var(--color-text)]">材质与保养</span>
            <HiOutlineChevronDown className={`transition-transform ${openAccordion === "material" ? "rotate-180" : ""}`} />
          </button>
          {openAccordion === "material" && (
            <div className="py-4 text-[var(--color-muted)] text-sm leading-relaxed whitespace-pre-line border-b border-[var(--color-border)]">
              {claimsEnabled
                ? claimPolicyConfig.careInstructions
                : "请手洗或机洗冷水，不可漂白。自然晾干即可。"}
            </div>
          )}

          <button 
            onClick={() => setOpenAccordion(openAccordion === "shipping" ? "" : "shipping")}
            className="w-full py-5 flex justify-between items-center border-b border-[var(--color-border)]"
          >
            <span className="text-base text-[var(--color-text)]">
              {claimsEnabled ? claimPolicyConfig.shippingPolicyTitle : "配送与退货"}
            </span>
            <HiOutlineChevronDown className={`transition-transform ${openAccordion === "shipping" ? "rotate-180" : ""}`} />
          </button>
          {openAccordion === "shipping" && (
            <div className="py-4 text-[var(--color-muted)] text-sm leading-relaxed whitespace-pre-line border-b border-[var(--color-border)]">
              {claimsEnabled ? claimPolicyConfig.shippingReturnCopy : "所有订单提供标准配送。30天内免费退换货服务。"}
            </div>
          )}

          {claimsEnabled && (
            <>
              <button 
                onClick={() => setOpenAccordion(openAccordion === "warranty" ? "" : "warranty")}
                className="w-full py-5 flex justify-between items-center border-b border-[var(--color-border)]"
              >
                <span className="text-base text-[var(--color-text)]">{claimPolicyConfig.productPolicyTitle}</span>
                <HiOutlineChevronDown className={`transition-transform ${openAccordion === "warranty" ? "rotate-180" : ""}`} />
              </button>
              {openAccordion === "warranty" && (
                <div className="py-4 text-[var(--color-muted)] text-sm leading-relaxed border-b border-[var(--color-border)] space-y-3">
                  {(product.warranty_period ?? "").length > 0 ? (
                    <p><span className="font-medium text-[var(--color-text)]">保固期限：</span>{product.warranty_period}</p>
                  ) : null}
                  {(product.warranty_description ?? "").length > 0 ? (
                    <p className="whitespace-pre-line">{product.warranty_description}</p>
                  ) : null}
                  <div>
                    <p className="font-medium text-[var(--color-text)] mb-1">涵盖范围</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {claimPolicyConfig.policyCoveredExamples.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-text)] mb-1">不涵盖</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {claimPolicyConfig.policyNotCoveredExamples.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-[var(--color-text)]">用户评价 (4.8/5)</h2>
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className="text-sm font-medium border border-black rounded-full px-4 py-1.5"
            >
              撰写评价
            </button>
          </div>
          <ReviewsList />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-[var(--color-border)] px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <button
          onClick={() => void handleAddToCart()}
          disabled={disableActions}
          className="w-full h-[56px] btn-primary rounded-full disabled:opacity-40 disabled:bg-gray-400"
        >
          加入购物袋
        </button>
      </div>

      <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />
    </div>
  );
};

export default ProductDetailsClient;
