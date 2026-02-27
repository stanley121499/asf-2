import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavbarHome from "../../components/navbar-home";
import CheckoutButton from "../../components/stripe/CheckoutButton";
import { useAlertContext } from "../../context/AlertContext";
import { Product, useProductContext } from "../../context/product/ProductContext";
import { ProductMedia, useProductMediaContext } from "../../context/product/ProductMediaContext";
import { useAddToCartContext } from "../../context/product/CartContext";
import { useAddToCartLogContext } from "../../context/product/AddToCartLogContext";
import { useAuthContext } from "../../context/AuthContext";
import { ProductColor, useProductColorContext } from "../../context/product/ProductColorContext";
import { ProductSize, useProductSizeContext } from "../../context/product/ProductSizeContext";
import { useProductStockContext } from "../../context/product/ProductStockContext";
import { supabase } from "../../utils/supabaseClient";
import { isSoftDeletedRow, readDeletedAt } from "../../utils/softDeleteRuntime";

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { products } = useProductContext();
  const { productMedias } = useProductMediaContext();
  const { productColors } = useProductColorContext();
  const { productSizes } = useProductSizeContext();
  const { productStocks } = useProductStockContext();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { createAddToCart } = useAddToCartContext();
  const { createAddToCartLog } = useAddToCartLogContext();

  /**
   * Normalize the route param so downstream logic can avoid unsafe checks.
   */
  const productIdSafe: string = typeof productId === "string" ? productId : "";

  /**
   * Product row from context cache (loaded via RPC in ProductContext).
   */
  const product: Product | undefined = useMemo(() => {
    if (!productIdSafe) {
      return undefined;
    }
    return products.find((prod) => prod.id === productIdSafe);
  }, [products, productIdSafe]);

  /**
   * Tracks whether the requested product exists and whether it has been soft deleted.
   * This prevents an infinite loading skeleton when a user visits a link to a deleted product.
   */
  type ProductAvailability =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "available" }
    | { status: "deleted"; name: string; deletedAt: string }
    | { status: "missing" };

  const [availability, setAvailability] = useState<ProductAvailability>({ status: "idle" });

  useEffect(() => {
    let isCancelled = false;

    async function resolveAvailability(): Promise<void> {
      if (!productIdSafe) {
        if (!isCancelled) {
          setAvailability({ status: "missing" });
        }
        return;
      }

      // If we already have the product in memory, prefer it.
      if (product) {
        if (isSoftDeletedRow(product)) {
          const deletedAt = readDeletedAt(product);
          if (!isCancelled) {
            setAvailability({
              status: "deleted",
              name: product.name,
              deletedAt: deletedAt ?? "",
            });
          }
          return;
        }

        if (!isCancelled) {
          setAvailability({ status: "available" });
        }
        return;
      }

      // Fallback: query the database to detect "deleted" vs "missing".
      if (!isCancelled) {
        setAvailability({ status: "loading" });
      }

      const { data, error } = await supabase
        .from("products")
        // Use '*' so this compiles even if `database.types.ts` is temporarily out of sync.
        .select("*")
        .eq("id", productIdSafe)
        .maybeSingle();

      if (isCancelled) {
        return;
      }

      if (error) {
        console.error("Failed to check product availability:", error);
        setAvailability({ status: "missing" });
        return;
      }

      if (!data) {
        setAvailability({ status: "missing" });
        return;
      }

      if (isSoftDeletedRow(data)) {
        const deletedAt = readDeletedAt(data);
        setAvailability({
          status: "deleted",
          name:
            typeof data === "object" && data !== null && "name" in data
              ? String((data as Record<string, unknown>)["name"] ?? "Product")
              : "Product",
          deletedAt: deletedAt ?? "",
        });
        return;
      }

      setAvailability({ status: "available" });
    }

    void resolveAvailability();

    return () => {
      isCancelled = true;
    };
  }, [product, productIdSafe]);

  /**
   * Derive all medias for the product and sort by `arrangement` (fallback: 0).
   */
  const sortedProductMedia: ProductMedia[] = useMemo(() => {
    if (!productIdSafe) {
      return [];
    }
    const medias = productMedias
      .filter((media) => media.product_id === productIdSafe)
      .slice(); // Copy before sorting to avoid mutating context state
    medias.sort((a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0));
    return medias;
  }, [productIdSafe, productMedias]);

  /**
   * Derive active variants for the product using the dedicated contexts.
   * NOTE: `product.product_colors` / `product.product_sizes` are not reliable here
   * because ProductContext initializes those arrays empty.
   */
  const activeColorsForProduct: ProductColor[] = useMemo(() => {
    if (!productIdSafe) {
      return [];
    }
    return productColors.filter(
      (c) => c.product_id === productIdSafe && c.active
    );
  }, [productColors, productIdSafe]);

  const activeSizesForProduct: ProductSize[] = useMemo(() => {
    if (!productIdSafe) {
      return [];
    }
    return productSizes.filter((s) => s.product_id === productIdSafe && s.active);
  }, [productSizes, productIdSafe]);

  const requiresColor: boolean = activeColorsForProduct.length > 0;
  const requiresSize: boolean = activeSizesForProduct.length > 0;

  // Variant selection state (auto-select when there is only one option).
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);

  // Gallery selection state.
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  /**
   * Keep the selected image index valid when medias change.
   */
  useEffect(() => {
    if (selectedImageIndex >= sortedProductMedia.length) {
      setSelectedImageIndex(0);
    }
  }, [selectedImageIndex, sortedProductMedia.length]);

  /**
   * Auto-select the only available color if there is exactly one; otherwise ensure
   * the selected color still exists.
   */
  useEffect(() => {
    if (!requiresColor) {
      if (selectedColor !== null) {
        setSelectedColor(null);
      }
      return;
    }

    if (activeColorsForProduct.length === 1) {
      const only = activeColorsForProduct[0];
      if (!selectedColor || selectedColor.id !== only.id) {
        setSelectedColor(only);
      }
      return;
    }

    // If the selected color no longer exists (e.g., became inactive), clear it.
    if (
      selectedColor &&
      !activeColorsForProduct.some((c) => c.id === selectedColor.id)
    ) {
      setSelectedColor(null);
    }
  }, [activeColorsForProduct, requiresColor, selectedColor]);

  /**
   * Auto-select the only available size if there is exactly one; otherwise ensure
   * the selected size still exists.
   */
  useEffect(() => {
    if (!requiresSize) {
      if (selectedSize !== null) {
        setSelectedSize(null);
      }
      return;
    }

    if (activeSizesForProduct.length === 1) {
      const only = activeSizesForProduct[0];
      if (!selectedSize || selectedSize.id !== only.id) {
        setSelectedSize(only);
      }
      return;
    }

    // If the selected size no longer exists (e.g., became inactive), clear it.
    if (selectedSize && !activeSizesForProduct.some((s) => s.id === selectedSize.id)) {
      setSelectedSize(null);
    }
  }, [activeSizesForProduct, requiresSize, selectedSize]);

  /**
   * Compute the current variant stock row for the user's selection.
   *
   * Rules:
   * - If a dimension has variants, it is considered required.
   * - For products without variants, we match stock rows with null color_id/size_id.
   */
  const currentStockRow = useMemo(() => {
    if (!productIdSafe) {
      return null;
    }

    // If variants exist, we require selection to compute stock.
    if (requiresColor && !selectedColor) {
      return null;
    }
    if (requiresSize && !selectedSize) {
      return null;
    }

    const wantedColorId: string | null = requiresColor ? selectedColor?.id ?? null : null;
    const wantedSizeId: string | null = requiresSize ? selectedSize?.id ?? null : null;

    const match = productStocks.find((s) => {
      const stockColorId: string | null = s.color_id ?? null;
      const stockSizeId: string | null = s.size_id ?? null;
      return (
        s.product_id === productIdSafe &&
        stockColorId === wantedColorId &&
        stockSizeId === wantedSizeId
      );
    });

    return match ?? null;
  }, [productIdSafe, productStocks, requiresColor, requiresSize, selectedColor, selectedSize]);

  const hasAllRequiredSelections: boolean =
    (!requiresColor || selectedColor !== null) && (!requiresSize || selectedSize !== null);

  const currentStockQuantity: number =
    currentStockRow && typeof currentStockRow.count === "number"
      ? currentStockRow.count
      : 0;

  const isInStock: boolean =
    hasAllRequiredSelections && currentStockRow !== null && currentStockQuantity > 0;

  /**
   * Disable purchase actions only when the selection is complete and the chosen
   * variant is not purchasable (out of stock or missing stock row).
   *
   * When selection is incomplete, actions stay enabled so we can surface a helpful
   * validation message on click (instead of silently doing nothing).
   */
  const disableActions: boolean = hasAllRequiredSelections && !isInStock;

  /**
   * Validate variant selection and stock before allowing cart/checkout actions.
   */
  const validateVariantAndStock = useCallback((): { ok: true; colorId: string | null; sizeId: string | null } | { ok: false; message: string } => {
    if (!productIdSafe) {
      return { ok: false, message: "Missing product id." };
    }

    if (requiresColor && !selectedColor) {
      return { ok: false, message: "Please select a color." };
    }
    if (requiresSize && !selectedSize) {
      return { ok: false, message: "Please select a size." };
    }

    // For non-variant products we keep these null to match `product_stock` and `add_to_carts`.
    const colorId: string | null = requiresColor ? selectedColor?.id ?? null : null;
    const sizeId: string | null = requiresSize ? selectedSize?.id ?? null : null;

    if (!currentStockRow) {
      return { ok: false, message: "This selection is not available in stock." };
    }
    if (typeof currentStockRow.count !== "number" || currentStockRow.count < 1) {
      return { ok: false, message: "This item is out of stock." };
    }

    return { ok: true, colorId, sizeId };
  }, [currentStockRow, productIdSafe, requiresColor, requiresSize, selectedColor, selectedSize]);

  /**
   * Add product to cart in Supabase and navigate to cart.
   */
  const handleAddToCart = useCallback(async (): Promise<void> => {
    // Hooks must be declared unconditionally; guard product availability at runtime.
    if (!product) {
      showAlert("Product not found.", "error");
      return;
    }
    if (!user?.id) {
      navigate("/authentication/sign-in");
      return;
    }

    const validation = validateVariantAndStock();
    if (!validation.ok) {
      showAlert(validation.message, "error");
      return;
    }

    await createAddToCart({
      product_id: product.id,
      user_id: user.id,
      amount: 1,
      // ✅ Correct: pass selected variants (or null for non-variant products)
      color_id: validation.colorId,
      size_id: validation.sizeId,
    });
    await createAddToCartLog({
      product_id: product.id,
      action_type: "add",
      amount: 1,
    });
    navigate("/cart");
  }, [createAddToCart, createAddToCartLog, navigate, product, showAlert, user?.id, validateVariantAndStock]);

  /**
   * Gate the Buy Now flow with the same validations as Add to Cart.
   * This does not create a cart row; it prevents invalid variant/out-of-stock checkout attempts.
   */
  const beforeBuyNow = useCallback(async (): Promise<boolean> => {
    // Hooks must be declared unconditionally; guard product availability at runtime.
    if (!product) {
      showAlert("Product not found.", "error");
      return false;
    }
    if (!user?.id) {
      navigate("/authentication/sign-in");
      return false;
    }

    const validation = validateVariantAndStock();
    if (!validation.ok) {
      showAlert(validation.message, "error");
      return false;
    }

    return true;
  }, [navigate, product, showAlert, user?.id, validateVariantAndStock]);

  // After all hooks are declared, it's safe to early-return.
  if (availability.status === "deleted") {
    return (
      <>
        <NavbarHome />
        <div className="pt-20 md:pt-24 pb-8 md:pb-16 bg-white dark:bg-gray-900 antialiased">
          <div className="max-w-screen-md px-4 mx-auto py-16 text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Product Unavailable
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {availability.name} is no longer available for purchase.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Deleted: {new Date(availability.deletedAt).toLocaleString()}
            </p>
            <button
              type="button"
              onClick={() => navigate("/product-section")}
              className="inline-flex items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </>
    );
  }

  if (availability.status === "missing") {
    return (
      <>
        <NavbarHome />
        <div className="pt-20 md:pt-24 pb-8 md:pb-16 bg-white dark:bg-gray-900 antialiased">
          <div className="max-w-screen-md px-4 mx-auto py-16 text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Product Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              We couldn&apos;t find this product.
            </p>
            <button
              type="button"
              onClick={() => navigate("/product-section")}
              className="inline-flex items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-gray-200 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavbarHome />
      <section className="pt-20 md:pt-24 pb-8 md:pb-16 bg-white dark:bg-gray-900 antialiased">
        <div className="max-w-screen-xl px-4 mx-auto 2xl:px-0 py-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
            {/* Product Image */}
            <div className="shrink-0 max-w-md lg:max-w-lg mx-auto">
              <img
                className="w-full rounded-lg"
                src={sortedProductMedia[selectedImageIndex]?.media_url || "/default-image.jpg"}
                alt={product.name}
              />

              {/* Thumbnail gallery */}
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
                        aria-label={`Select image ${index + 1}`}
                      >
                        <img
                          src={media.media_url}
                          alt={`${product.name} ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="mt-6 sm:mt-8 lg:mt-0">
              <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
                {product.name}
              </h1>

              {/* Optional metadata */}
              <div className="mt-2 space-y-1">
                {product.article_number && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Article #:</span> {product.article_number}
                  </p>
                )}
                {product.festival && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Festival:</span> {product.festival}
                  </p>
                )}
                {product.season && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Season:</span> {product.season}
                  </p>
                )}
              </div>

              {/* Price and Rating */}
              <div className="mt-4 sm:items-center sm:gap-4 sm:flex">
                <p className="text-2xl font-extrabold text-gray-900 sm:text-3xl dark:text-white">
                  RM {product.price.toFixed(2)}
                </p>
              </div>

              {/* Stock status */}
              <div className="mt-4">
                {!hasAllRequiredSelections && (requiresColor || requiresSize) ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Select {[
                      requiresColor && !selectedColor ? "color" : "",
                      requiresSize && !selectedSize ? "size" : "",
                    ].filter((t) => t.length > 0).join(" and ")} to see stock.
                  </p>
                ) : (
                  <p
                    className={[
                      "text-sm font-medium",
                      isInStock ? "text-green-600" : "text-red-600",
                    ].join(" ")}
                  >
                    {isInStock
                      ? `In Stock (${currentStockQuantity} available)`
                      : "Out of Stock"}
                  </p>
                )}
              </div>

              {/* Color selection */}
              {requiresColor && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Color
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
                      Please choose a color.
                    </p>
                  )}
                </div>
              )}

              {/* Size selection */}
              {requiresSize && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Size
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
                      Please choose a size.
                    </p>
                  )}
                </div>
              )}

              <hr className="my-6 md:my-8 border-gray-200 dark:border-gray-800" />

              {/* Product Description */}
              <p className="mb-6 text-gray-500 dark:text-gray-400">
                {product.description}
              </p>

              {/* Warranty Information */}
              {(product.warranty_period || product.warranty_description) && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Warranty Information
                  </h3>
                  {product.warranty_period && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <span className="font-medium">Warranty Period:</span> {product.warranty_period}
                    </p>
                  )}
                  {product.warranty_description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Terms & Conditions:</span> {product.warranty_description}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons — visible on larger screens inline (hidden on mobile, sticky bar used instead) */}
              <div className="mt-6 hidden sm:flex sm:gap-4 sm:items-center sm:mt-8">
                <button
                  className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 sm:mt-0"
                  onClick={() => void handleAddToCart()}
                  disabled={disableActions}
                  aria-disabled={disableActions}
                >
                  Add to Cart
                </button>
                <CheckoutButton
                  items={[
                    {
                      name: product.name,
                      quantity: 1,
                      price: Math.round(product.price * 100),
                    },
                  ]}
                  customerId={user?.id ?? ""}
                  beforeCheckout={beforeBuyNow}
                  disabled={disableActions}
                  buttonTitle="Buy Now"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky mobile action bar ────────────────────────────────────
          Always visible at the bottom on small screens.
          Sits ABOVE the fixed BottomNavbar so both remain accessible.
          Uses safe-area-inset-bottom so it does not overlap the iOS home
          indicator bar or Android gesture navigation zone.        ──── */}
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
          Add to Cart
        </button>
        <CheckoutButton
          items={[
            {
              name: product.name,
              quantity: 1,
              price: Math.round(product.price * 100),
            },
          ]}
          customerId={user?.id ?? ""}
          beforeCheckout={beforeBuyNow}
          disabled={disableActions}
          buttonTitle="Buy Now"
        />
      </div>
    </>
  );
};

export default ProductDetails;
