import React, { useState } from "react";
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import { useAddToCartContext } from "../../../context/product/CartContext";
import { useAddToCartLogContext } from "../../../context/product/AddToCartLogContext";
import { useProductColorContext } from "../../../context/product/ProductColorContext";
import { useProductSizeContext } from "../../../context/product/ProductSizeContext";
import { Product } from "../../../context/product/ProductContext";

interface ProductCardProps {
  /** The product data to display. */
  product: Product;
  /** Resolved image URL, or "/default-image.jpg" as fallback. */
  mediaUrl: string;
  /**
   * Optional callback fired when the card's image finishes loading (or errors).
   * The parent may use this to track overall page-load progress.
   */
  onImageLoad?: () => void;
}

type CartButtonState = "idle" | "loading" | "done" | "error";

/**
 * ProductCard component
 * Displays a single product with an image, new badge, name, price, and add to cart button.
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, mediaUrl, onImageLoad = () => {} }) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [cartState, setCartState] = useState<CartButtonState>("idle");

  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { createAddToCart } = useAddToCartContext();
  const { createAddToCartLog } = useAddToCartLogContext();
  const { productColors } = useProductColorContext();
  const { productSizes } = useProductSizeContext();

  const isNew = Date.now() - new Date(product.created_at).getTime() < 30 * 24 * 60 * 60 * 1000;

  /**
   * Handles the image load or error event.
   */
  const handleImageReady = () => {
    setImageLoaded(true);
    onImageLoad();
  };

  /**
   * Handles the quick Add to Cart button tap.
   * - Redirects unauthenticated users to sign-in.
   * - Navigates to product detail page if the product has active colour or size variants
   *   (variant selection is required before adding to cart).
   * - For variant-free products, inserts directly into the cart and logs the action.
   */
  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    // Prevent the parent <a> link from navigating when the button is tapped
    e.preventDefault();
    e.stopPropagation();

    // Guard: already in progress
    if (cartState === "loading") return;

    // Guard: not logged in
    if (user === null) {
      navigate("/authentication/sign-in");
      return;
    }

    // Check if this product requires variant selection
    const hasActiveColors = productColors.some(
      (c) => c.product_id === product.id && c.active === true && c.deleted_at === null
    );
    const hasActiveSizes = productSizes.some(
      (s) => s.product_id === product.id && s.active === true && s.deleted_at === null
    );

    if (hasActiveColors || hasActiveSizes) {
      // Navigate to detail page for variant selection
      navigate(`/product-details/${product.id}`);
      return;
    }

    // No variants — add directly to cart
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
      // Reset back to idle after 1.5s
      setTimeout(() => { setCartState("idle"); }, 1500);
    } catch {
      setCartState("error");
      setTimeout(() => { setCartState("idle"); }, 2000);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="w-full">
        <a href={`/product-details/${product.id}`}>
          <div className="relative overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-700">
            {isNew && (
              <span className="absolute left-2 top-2 z-10 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
                新品
              </span>
            )}
            <img
              className={`mx-auto h-56 w-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"
                }`}
              src={mediaUrl}
              alt={product.name || "商品"}
              onLoad={handleImageReady}
              onError={handleImageReady}
            />
            {/* Quick add-to-cart button — bottom-right of image */}
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
