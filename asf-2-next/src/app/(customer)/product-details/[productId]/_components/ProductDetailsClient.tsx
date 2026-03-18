"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import NavbarHome from "@/components/navbar-home";
import CheckoutButton from "@/components/stripe/CheckoutButton";
import { useAlertContext } from "@/context/AlertContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useAddToCartLogContext } from "@/context/product/AddToCartLogContext";
import { useAuthContext } from "@/context/AuthContext";
import { isSoftDeletedRow, readDeletedAt } from "@/utils/softDeleteRuntime";
import type { Tables } from "@/database.types";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useWishlistContext } from "@/context/WishlistContext";

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
  const { user } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { createAddToCart } = useAddToCartContext();
  const { createAddToCartLog } = useAddToCartLogContext();

  const product = initialProduct;

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const isSaved = product !== null ? isInWishlist(product.id) : false;

  type ProductAvailability =
    | { status: "available" }
    | { status: "deleted"; name: string; deletedAt: string }
    | { status: "missing" };

  const availability: ProductAvailability = useMemo(() => {
    if (!product) {
      return { status: "missing" };
    }
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

  const activeColorsForProduct = useMemo(() => {
    return productColors.filter((c) => c.active);
  }, [productColors]);

  const activeSizesForProduct = useMemo(() => {
    return productSizes.filter((s) => s.active);
  }, [productSizes]);

  const requiresColor = activeColorsForProduct.length > 0;
  const requiresSize = activeSizesForProduct.length > 0;

  const [selectedColor, setSelectedColor] = useState<Tables<"product_colors"> | null>(null);
  const [selectedSize, setSelectedSize] = useState<Tables<"product_sizes"> | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

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
      const only = activeColorsForProduct[0];
      if (!selectedColor || selectedColor.id !== only.id) {
        setSelectedColor(only);
      }
      return;
    }
    if (selectedColor && !activeColorsForProduct.some((c) => c.id === selectedColor.id)) {
      setSelectedColor(null);
    }
  }, [activeColorsForProduct, requiresColor, selectedColor]);

  useEffect(() => {
    if (!requiresSize) {
      if (selectedSize !== null) setSelectedSize(null);
      return;
    }
    if (activeSizesForProduct.length === 1) {
      const only = activeSizesForProduct[0];
      if (!selectedSize || selectedSize.id !== only.id) {
        setSelectedSize(only);
      }
      return;
    }
    if (selectedSize && !activeSizesForProduct.some((s) => s.id === selectedSize.id)) {
      setSelectedSize(null);
    }
  }, [activeSizesForProduct, requiresSize, selectedSize]);

  const currentStockRow = useMemo(() => {
    if (requiresColor && !selectedColor) return null;
    if (requiresSize && !selectedSize) return null;

    const wantedColorId = requiresColor ? selectedColor?.id ?? null : null;
    const wantedSizeId = requiresSize ? selectedSize?.id ?? null : null;

    const match = productStocks.find((s) => {
      const stockColorId = s.color_id ?? null;
      const stockSizeId = s.size_id ?? null;
      return stockColorId === wantedColorId && stockSizeId === wantedSizeId;
    });

    return match ?? null;
  }, [productStocks, requiresColor, requiresSize, selectedColor, selectedSize]);

  const hasAllRequiredSelections =
    (!requiresColor || selectedColor !== null) && (!requiresSize || selectedSize !== null);

  const currentStockQuantity =
    currentStockRow && typeof currentStockRow.count === "number" ? currentStockRow.count : 0;

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
    if (!product) {
      showAlert("未找到商品。", "error");
      return;
    }
    if (!user?.id) {
      router.push("/authentication/sign-in");
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

  const beforeBuyNow = useCallback(async () => {
    if (!product) {
      showAlert("未找到商品。", "error");
      return false;
    }
    if (!user?.id) {
      router.push("/authentication/sign-in");
      return false;
    }

    const validation = validateVariantAndStock();
    if (!validation.ok) {
      showAlert(validation.message || "验证失败", "error");
      return false;
    }
    return true;
  }, [router, product, showAlert, user?.id, validateVariantAndStock]);

  /**
   * Toggles the wishlist state for the current product.
   * Redirects to sign-in if the user is not authenticated.
   */
  const handleToggleWishlist = useCallback(async (): Promise<void> => {
    if (!product) return;
    if (!user?.id) {
      router.push("/authentication/sign-in");
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
      <>
        <NavbarHome />
        <div className="px-4 pt-3 pb-1 bg-gray-50 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label="返回"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>
        </div>
        <div className="pb-8 md:pb-16 bg-white dark:bg-gray-900 antialiased">
          <div className="max-w-screen-md px-4 mx-auto py-16 text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {availability.status === "deleted" ? "商品不可用" : "未找到商品"}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {availability.status === "deleted"
                ? `${availability.name} 已停止销售。`
                : "我们找不到此商品。"}
            </p>
            {availability.status === "deleted" && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                删除时间：{new Date(availability.deletedAt).toLocaleString()}
              </p>
            )}
            <button
              type="button"
              onClick={() => router.push("/product-section")}
              className="inline-flex items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700"
            >
              继续购物
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!product) return null;

  return (
    <>
      <NavbarHome />
      <div className="px-4 pt-3 pb-1 bg-gray-50 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
          aria-label="返回"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          <span>返回</span>
        </button>
      </div>
      <section
        className="bg-white dark:bg-gray-900 antialiased md:pb-16"
        style={{ paddingBottom: "calc(3.5rem + 4rem + 1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="max-w-screen-xl px-4 mx-auto 2xl:px-0 py-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
            <div className="shrink-0 max-w-md lg:max-w-lg mx-auto">
              <Image
                width={800}
                height={800}
                className="w-full h-auto rounded-lg object-cover aspect-square"
                src={sortedProductMedia[selectedImageIndex]?.media_url || "/default-image.jpg"}
                alt={product.name ?? ""}
              />

              {sortedProductMedia.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                  {sortedProductMedia.map((media, index) => {
                    const isSelected = index === selectedImageIndex;
                    return (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={[
                          "shrink-0 rounded border",
                          isSelected ? "border-primary-600" : "border-gray-200 dark:border-gray-700",
                        ].join(" ")}
                        aria-label={`选择图片 ${index + 1}`}
                      >
                        <Image
                          width={80}
                          height={80}
                          src={media.media_url || "/default-image.jpg"}
                          alt={`${product.name} ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 sm:mt-8 lg:mt-0">
              <div className="flex justify-between items-start gap-3">
                <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
                  {product.name}
                </h1>
                <button
                  type="button"
                  onClick={() => void handleToggleWishlist()}
                  aria-label={isSaved ? "从收藏中移除" : "添加到收藏"}
                  className="mt-1 flex-shrink-0 p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isSaved
                    ? <FaBookmark size={18} className="text-indigo-600" />
                    : <FaRegBookmark size={18} className="text-gray-500 dark:text-gray-400" />
                  }
                </button>
              </div>

              <div className="mt-2 space-y-1">
                {product.article_number && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">货号：</span> {product.article_number}
                  </p>
                )}
                {product.festival && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">节日：</span> {product.festival}
                  </p>
                )}
                {product.season && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">季节：</span> {product.season}
                  </p>
                )}
              </div>

              <div className="mt-4 sm:items-center sm:gap-4 sm:flex">
                <p className="text-2xl font-extrabold text-gray-900 sm:text-3xl dark:text-white">
                  RM {(product.price ?? 0).toFixed(2)}
                </p>
              </div>

              <div className="mt-4">
                {!hasAllRequiredSelections && (requiresColor || requiresSize) ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    请选择{[
                      requiresColor && !selectedColor ? "颜色" : "",
                      requiresSize && !selectedSize ? "尺码" : "",
                    ].filter((t) => t.length > 0).join("和")}以查看库存。
                  </p>
                ) : (
                  <p
                    className={[
                      "text-sm font-medium",
                      isInStock ? "text-green-600" : "text-red-600",
                    ].join(" ")}
                  >
                    {isInStock
                      ? `有货（剩余 ${currentStockQuantity} 件）`
                      : "缺货"}
                  </p>
                )}
              </div>

              {requiresColor && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    颜色
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeColorsForProduct.map((color) => {
                      const isSelected = selectedColor?.id === color.id;
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={[
                            "px-4 py-2 rounded-lg border text-sm",
                            isSelected
                              ? "bg-primary-700 text-white border-primary-700"
                              : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700",
                          ].join(" ")}
                        >
                          {color.color}
                        </button>
                      );
                    })}
                  </div>
                  {!selectedColor && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      请选择颜色。
                    </p>
                  )}
                </div>
              )}

              {requiresSize && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    尺码
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeSizesForProduct.map((size) => {
                      const isSelected = selectedSize?.id === size.id;
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={[
                            "px-4 py-2 rounded-lg border text-sm",
                            isSelected
                              ? "bg-primary-700 text-white border-primary-700"
                              : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700",
                          ].join(" ")}
                        >
                          {size.size}
                        </button>
                      );
                    })}
                  </div>
                  {!selectedSize && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      请选择尺码。
                    </p>
                  )}
                </div>
              )}

              <hr className="my-6 md:my-8 border-gray-200 dark:border-gray-800" />

              <p className="mb-6 text-gray-500 dark:text-gray-400">
                {product.description}
              </p>

              {(product.warranty_period || product.warranty_description) && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    质保信息
                  </h3>
                  {product.warranty_period && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <span className="font-medium">质保期：</span> {product.warranty_period}
                    </p>
                  )}
                  {product.warranty_description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">条款与条件：</span> {product.warranty_description}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 hidden sm:flex sm:gap-4 sm:items-center sm:mt-8">
                <button
                  className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 sm:mt-0"
                  onClick={() => void handleAddToCart()}
                  disabled={disableActions}
                  aria-disabled={disableActions}
                >
                  加入购物车
                </button>
                <CheckoutButton
                  items={[
                    {
                      name: product.name ?? "",
                      quantity: 1,
                      price: Math.round((product.price ?? 0) * 100),
                    },
                  ]}
                  customerId={user?.id ?? ""}
                  beforeCheckout={beforeBuyNow}
                  disabled={disableActions}
                  buttonTitle="立即购买"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        className="fixed left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 flex gap-3 sm:hidden"
        style={{
          bottom: "calc(4rem + 1rem + env(safe-area-inset-bottom, 0px))",
          paddingTop: "0.75rem",
          paddingBottom: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={() => void handleAddToCart()}
          disabled={disableActions}
          aria-disabled={disableActions}
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white disabled:opacity-40 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          加入购物车
        </button>
        <CheckoutButton
          items={[
            {
              name: product.name ?? "",
              quantity: 1,
              price: Math.round((product.price ?? 0) * 100),
            },
          ]}
          customerId={user?.id ?? ""}
          beforeCheckout={beforeBuyNow}
          disabled={disableActions}
          buttonTitle="立即购买"
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 text-white disabled:opacity-40 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
        />
      </div>
    </>
  );
};

export default ProductDetailsClient;
