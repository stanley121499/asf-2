"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import type { Tables } from "@/database.types";
import { HiOutlineHeart, HiHeart } from "react-icons/hi";
import { useWishlistContext } from "@/context/WishlistContext";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Tables<"products">;
  mediaUrl: string;
  onImageLoad?: () => void;
  onQuickView?: () => void;
  priority?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  mediaUrl, 
  onImageLoad = () => {},
  onQuickView,
  priority = false
}) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthContext();

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const isSaved = isInWishlist(product.id);

  const handleImageReady = () => {
    setImageLoaded(true);
    onImageLoad();
  };

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
    <div className="flex flex-col bg-white">
      <Link href={`/product-details/${product.id}?from=${encodeURIComponent(pathname)}`} className="block relative pt-[133.33%] bg-[var(--color-panel)] overflow-hidden">
        <Image
          className={`object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          src={mediaUrl || "/default-image.jpg"}
          alt={product.name || "商品"}
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          quality={75}
          priority={priority}
          onLoad={handleImageReady}
          onError={handleImageReady}
        />
        {!imageLoaded && <div className="absolute inset-0 skeleton" />}
      </Link>
      
      <div className="pt-3 pb-1 flex flex-col">
        <Link href={`/product-details/${product.id}?from=${encodeURIComponent(pathname)}`} className="block">
          <h3 className="font-sans text-base font-medium text-[var(--color-text)] truncate">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[var(--color-accent)] font-medium text-sm">
              RM {product.price?.toFixed(2) ?? "—"}
            </span>
            <button
              onClick={handleToggleWishlist}
              className="p-1 -mr-1 shrink-0"
            >
              {isSaved ? (
                <HiHeart size={20} className="text-[var(--color-accent)]" />
              ) : (
                <HiOutlineHeart size={20} className="text-[var(--color-muted)]" />
              )}
            </button>
          </div>
        </Link>
        {onQuickView && (
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView();
            }}
            className="text-xs text-[var(--color-muted)] underline underline-offset-2 self-start mt-2 border-none bg-transparent"
          >
            快速查看
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
