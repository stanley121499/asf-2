"use client";
import React, { useState } from "react";
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useAddToCartLogContext } from "@/context/product/AddToCartLogContext";
import { useProductColorContext } from "@/context/product/ProductColorContext";
import { useProductSizeContext } from "@/context/product/ProductSizeContext";
import type { Tables } from "@/database.types";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useWishlistContext } from "@/context/WishlistContext";
import Image from "next/image";

interface ProductCardProps {
  product: Tables<"products">;
  mediaUrl: string;
  onImageLoad?: () => void;
}

type CartButtonState = "idle" | "loading" | "done" | "error";

const ProductCard: React.FC<ProductCardProps> = ({ product, mediaUrl, onImageLoad = () => {} }) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [cartState, setCartState] = useState<CartButtonState>("idle");

  const router = useRouter();
  const { user } = useAuthContext();
  const { createAddToCart } = useAddToCartContext();
  const { createAddToCartLog } = useAddToCartLogContext();
  const { productColors } = useProductColorContext();
  const { productSizes } = useProductSizeContext();

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const isSaved = isInWishlist(product.id);

  const isNew = Date.now() - new Date(product.created_at).getTime() < 30 * 24 * 60 * 60 * 1000;

  const handleImageReady = () => {
    setImageLoaded(true);
    onImageLoad();
  };

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();

    if (cartState === "loading") return;

    if (user === null) {
      router.push("/authentication/sign-in");
      return;
    }

    const hasActiveColors = productColors.some(
      (c) => c.product_id === product.id && c.active === true && c.deleted_at === null
    );
    const hasActiveSizes = productSizes.some(
      (s) => s.product_id === product.id && s.active === true && s.deleted_at === null
    );

    if (hasActiveColors || hasActiveSizes) {
      router.push(`/product-details/${product.id}`);
      return;
    }

    setCartState("loading");
    try {
      await createAddToCart({
        product_id: product.id,
        user_id: user.id,
        amount: 1,
        color_id: null,
        size_id: null,
      });
      await createAddToCartLog({
        product_id: product.id,
        action_type: "add",
        amount: 1,
      });
      setCartState("done");
      setTimeout(() => { setCartState("idle"); }, 1500);
    } catch {
      setCartState("error");
      setTimeout(() => { setCartState("idle"); }, 2000);
    }
  };

  /**
   * Toggles the wishlist state for this product.
   * Redirects to sign-in if the user is not authenticated.
   */
  const handleToggleWishlist = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();

    if (user === null) {
      router.push("/authentication/sign-in");
      return;
    }

    if (isSaved) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="w-full">
        <a href={`/product-details/${product.id}`}>
          <div className="relative h-56 w-full overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-700">
            {/* Note: if you need Image, make sure to import it from next/image, wait let me check if Image is imported. It was removed. Re-adding. */}
            <Image
              className={`object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              src={mediaUrl || "/default-image.jpg"}
              alt={product.name || "商品"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={handleImageReady}
              onError={handleImageReady}
            />
            <button
              type="button"
              aria-label={isSaved ? "从收藏中移除" : "添加到收藏"}
              onClick={handleToggleWishlist}
              className="absolute top-2 left-2 z-10 flex items-center justify-center h-9 w-9 rounded-full shadow-md bg-white dark:bg-gray-800 transition-colors duration-200 hover:bg-red-50 dark:hover:bg-gray-700"
            >
              {isSaved
                ? <FaHeart size={14} className="text-red-500" />
                : <FaRegHeart size={14} className="text-gray-500 dark:text-gray-300" />
              }
            </button>
            <button
              type="button"
              aria-label="加入购物车"
              onClick={handleAddToCart}
              className={`
                absolute bottom-2 right-2 z-10
                flex items-center justify-center
                h-9 w-9 rounded-full shadow-md
                transition-colors duration-200
                ${cartState === "done"
                  ? "bg-green-500 text-white"
                  : cartState === "error"
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-700 hover:bg-green-500 hover:text-white dark:bg-gray-800 dark:text-gray-300"
                }
              `}
            >
              {cartState === "loading" && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
              )}
              {cartState === "done" && <FaCheck size={14} />}
              {(cartState === "idle" || cartState === "error") && <FaShoppingCart size={14} />}
            </button>
          </div>
          <div className="p-4">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white">
              {product.name}
            </h3>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-400">
              RM {product.price}
            </p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default ProductCard;
