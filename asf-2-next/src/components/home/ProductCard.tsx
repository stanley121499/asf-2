"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import type { Tables } from "@/database.types";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { useWishlistContext } from "@/context/WishlistContext";
import Image from "next/image";

interface ProductCardProps {
  product: Tables<"products">;
  mediaUrl: string;
  onImageLoad?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, mediaUrl, onImageLoad = () => {} }) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const router = useRouter();
  const { user } = useAuthContext();

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const isSaved = isInWishlist(product.id);

  const handleImageReady = () => {
    setImageLoaded(true);
    onImageLoad();
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
          </div>
        </a>
        <div className="p-4 flex justify-between items-start gap-2">
          <a href={`/product-details/${product.id}`} className="flex-1 min-w-0">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white truncate">
              {product.name}
            </h3>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-400">
              RM {product.price}
            </p>
          </a>
          <button
            type="button"
            aria-label={isSaved ? "从收藏中移除" : "添加到收藏"}
            onClick={handleToggleWishlist}
            className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 mt-0.5"
          >
            {isSaved
              ? <FaBookmark size={14} className="text-indigo-600" />
              : <FaRegBookmark size={14} className="text-gray-400 dark:text-gray-300" />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

