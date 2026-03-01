import React, { useState, useEffect, useMemo } from "react";
import { Button, Card, Badge } from "flowbite-react";
import NavbarHome from "../../components/navbar-home";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineShoppingCart,
  HiOutlineTrash,
  HiOutlineArrowLeft,
  HiOutlineShieldCheck,
  HiOutlineCreditCard,
  HiOutlineTruck,
  HiPlus,
  HiMinus,
} from "react-icons/hi";
import { useAuthContext } from "../../context/AuthContext";
import { useAddToCartContext } from "../../context/product/CartContext";
import { useAddToCartLogContext } from "../../context/product/AddToCartLogContext";
import { supabase } from "../../utils/supabaseClient";
import type { Database } from "../../database.types";
import { readDeletedAt } from "../../utils/softDeleteRuntime";
import CheckoutButton from "../../components/stripe/CheckoutButton";
import { usePointsMembership } from "../../context/PointsMembershipContext";
import { formatCurrency, pointsToRM, rmToPoints, calculatePointsEarned } from "../../utils/pointsConfig";

/**
 * View model for cart items displayed on the page.
 */
interface CartItemViewModel {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  variant: string;
  inStock: boolean;
  maxQuantity: number;
  /** True when the underlying product is soft deleted and cannot be purchased. */
  isDeleted: boolean;
  /** Human-readable deleted timestamp (ISO) when isDeleted is true. */
  deletedAt?: string;
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { add_to_carts, updateAddToCart, deleteAddToCart } = useAddToCartContext();
  const { createAddToCartLog } = useAddToCartLogContext();
  const pointsAPI = usePointsMembership();

  const [cartItems, setCartItems] = useState<CartItemViewModel[]>([]);
  const hasDeletedProducts: boolean = useMemo(() => {
    return cartItems.some((item) => item.isDeleted);
  }, [cartItems]);
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [userPoints, setUserPoints] = useState<number>(0);
  // NOTE: Checkout state is handled by the Stripe button; keep state local to that component.

  // Fetch user points
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (user?.id) {
        try {
          const pointsRecord = await pointsAPI.getUserPointsByUserId(user.id);
          setUserPoints(pointsRecord?.amount || 0);
        } catch (err) {
          console.error("Error fetching user points:", err);
          setUserPoints(0);
        }
      }
    };
    fetchUserPoints();
  }, [user, pointsAPI]);

  /**
   * Derive only current user's cart rows from the context (keeps in sync in real-time).
   */
  const userCartRows = useMemo(() => {
    if (!user?.id) {
      return [] as Database["public"]["Tables"]["add_to_carts"]["Row"][];
    }
    return add_to_carts.filter((row) => row.user_id === user.id);
  }, [add_to_carts, user]);

  /**
   * Fetch product details, media, color and size labels for the user's cart rows
   * and map them into the page view model.
   */
  useEffect(() => {
    let isCancelled = false;

    async function hydrateCart(): Promise<void> {
      // If not authenticated or no cart rows, clear items
      if (!user?.id || userCartRows.length === 0) {
        setCartItems([]);
        return;
      }

      // Collect ids to batch query
      const productIds = Array.from(
        new Set(userCartRows.map((r) => r.product_id))
      );
      const colorIds = Array.from(
        new Set(
          userCartRows
            .map((r) => r.color_id)
            .filter((v): v is string => typeof v === "string")
        )
      );
      const sizeIds = Array.from(
        new Set(
          userCartRows
            .map((r) => r.size_id)
            .filter((v): v is string => typeof v === "string")
        )
      );

      // Parallel batched fetches from Supabase
      const [productsRes, mediasRes, colorsRes, sizesRes] = await Promise.all([
        supabase
          .from("products")
          // Use '*' so this compiles even if `database.types.ts` is temporarily out of sync.
          .select("*")
          .in("id", productIds),
        supabase
          .from("product_medias")
          .select("product_id,media_url,arrangement")
          .in("product_id", productIds),
        colorIds.length > 0
          ? supabase
            .from("product_colors")
            .select("id,color")
            .in("id", colorIds)
          : Promise.resolve({ data: [], error: null } as const),
        sizeIds.length > 0
          ? supabase
            .from("product_sizes")
            .select("id,size")
            .in("id", sizeIds)
          : Promise.resolve({ data: [], error: null } as const),
      ]);

      // Basic error handling for each response
      if (productsRes.error) {
        // Keep UI usable even if one query fails
        // eslint-disable-next-line no-console
        console.error(productsRes.error);
      }
      if (mediasRes.error) {
        // eslint-disable-next-line no-console
        console.error(mediasRes.error);
      }
      if (colorsRes && "error" in colorsRes && colorsRes.error) {
        // eslint-disable-next-line no-console
        console.error(colorsRes.error);
      }
      if (sizesRes && "error" in sizesRes && sizesRes.error) {
        // eslint-disable-next-line no-console
        console.error(sizesRes.error);
      }

      const products = (productsRes.data ?? []).reduce((acc: Record<string, unknown>, p) => {
        // We only require `id`, `name`, `price` at runtime; deleted status is derived via helpers.
        if (typeof p === "object" && p !== null && "id" in p) {
          const record = p as Record<string, unknown>;
          const id = record["id"];
          if (typeof id === "string" && id.length > 0) {
            acc[id] = record;
          }
        }
        return acc;
      }, {});

      // Choose the media with the smallest arrangement per product id
      const firstMediaByProduct: Record<string, string> = {};
      (mediasRes.data ?? [])
        .sort((a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0))
        .forEach((m) => {
          if (!firstMediaByProduct[m.product_id]) {
            firstMediaByProduct[m.product_id] = m.media_url as string;
          }
        });

      const colorLabelById: Record<string, string> = {};
      if (colorsRes && "data" in colorsRes) {
        (colorsRes.data as Array<{ id: string; color: string }>).forEach(
          (c) => {
            colorLabelById[c.id] = c.color;
          }
        );
      }
      const sizeLabelById: Record<string, string> = {};
      if (sizesRes && "data" in sizesRes) {
        (sizesRes.data as Array<{ id: string; size: string }>).forEach((s) => {
          sizeLabelById[s.id] = s.size;
        });
      }

      const hydrated: CartItemViewModel[] = userCartRows.map((row) => {
        const product = products[row.product_id];
        const imageUrl = firstMediaByProduct[row.product_id] || "/images/products/product-1.jpg";
        const colorText = row.color_id ? colorLabelById[row.color_id] : "";
        const sizeText = row.size_id ? sizeLabelById[row.size_id] : "";
        const variant = [colorText, sizeText].filter((t) => t && t.length > 0).join(" / ");

        const deletedAtIso = readDeletedAt(product);
        const isDeleted = typeof deletedAtIso === "string" && deletedAtIso.length > 0;

        const name =
          typeof product === "object" && product !== null && "name" in product
            ? String((product as Record<string, unknown>)["name"] ?? "Product")
            : "Product";
        const priceRaw =
          typeof product === "object" && product !== null && "price" in product
            ? (product as Record<string, unknown>)["price"]
            : 0;
        const price = typeof priceRaw === "number" ? priceRaw : 0;

        return {
          id: row.id,
          productId: row.product_id,
          name,
          price,
          originalPrice: undefined,
          quantity: typeof row.amount === "number" ? row.amount : 1,
          image: imageUrl,
          variant: variant,
          // If the product is deleted, treat it as not purchasable (inStock=false).
          inStock: !isDeleted,
          maxQuantity: isDeleted ? 0 : 99,
          isDeleted: isDeleted,
          deletedAt: isDeleted ? deletedAtIso : undefined,
        };
      });

      if (!isCancelled) {
        setCartItems(hydrated);
      }
    }

    hydrateCart();
    return () => {
      isCancelled = true;
    };
  }, [user, userCartRows]);

  // Calculate cart totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Use fetched user points
  const availablePoints = userPoints;

  // Calculate discount from points
  const pointsDiscount = pointsToRM(pointsToUse);
  const total = Math.max(0, subtotal - pointsDiscount);

  // Calculate points that will be earned (only if not using points for discount)
  const pointsEarned = pointsToUse > 0 ? 0 : calculatePointsEarned(total);

  /**
   * Update quantity for a cart item. Persists to DB and logs the action.
   */
  const handleQuantityChange = async (
    id: string,
    newQuantity: number
  ): Promise<void> => {
    if (newQuantity < 1) {
      return;
    }
    const current = cartItems.find((i) => i.id === id);
    const clamped = current
      ? Math.min(newQuantity, current.maxQuantity)
      : newQuantity;

    // Optimistic UI update
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: clamped } : item))
    );

    // Persist to DB
    await updateAddToCart({ id, amount: clamped });

    // Log the update
    const productId = current?.productId ?? "";
    if (productId) {
      await createAddToCartLog({
        product_id: productId,
        action_type: "update",
        amount: clamped,
      });
    }
  };

  /**
   * Remove a cart item. Persists to DB and logs the action.
   */
  const handleRemoveItem = async (id: string): Promise<void> => {
    const current = cartItems.find((i) => i.id === id);
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    await deleteAddToCart(id);
    if (current?.productId) {
      await createAddToCartLog({
        product_id: current.productId,
        action_type: "delete",
        amount: 0,
      });
    }
  };

  /**
   * Removes all cart items whose products have been soft deleted.
   * This prevents checkout errors and makes the state consistent.
   */
  const handleRemoveDeletedItems = async (): Promise<void> => {
    const idsToRemove = cartItems.filter((i) => i.isDeleted).map((i) => i.id);
    for (const id of idsToRemove) {
      await handleRemoveItem(id);
    }
  };

  // Wishlist and promo features removed per requirements

  // Proceed to checkout
  // Checkout navigation is handled by CheckoutButton.

  /**
   * Create a fake Stripe-like session and local cart, then navigate to success page.
   */
  const handleTestPayNow = (): void => {
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const fakeId = `cs_test_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Persist a minimal fake session for the success page to render
    const fakeSession = {
      id: fakeId,
      customer_details: {
        name: "Test User",
        email: "test@example.com",
        phone: "+60123456789",
        address: {
          line1: "123 Test Street",
          line2: "Unit 4A",
          city: "Test City",
          state: "Selangor",
          postal_code: "43000",
          country: "MY",
        },
      },
      payment_method_details: { type: "card" },
      created: Math.floor(Date.now() / 1000),
    } as const;

    // For OrderSuccess to compute totals, store a compatible cart in localStorage (prices in cents for Stripe)
    const localCart = cartItems.map((i) => ({
      id: i.productId,
      price: Math.round(i.price * 100),
      quantity: i.quantity,
      color_id: null as string | null,
      size_id: null as string | null,
    }));

    // Store points usage information for order processing
    const orderMetadata = {
      pointsUsed: pointsToUse,
      pointsDiscount: pointsDiscount,
      pointsEarned: pointsEarned,
      originalSubtotal: subtotal,
      finalTotal: total,
    };
    localStorage.setItem("order_metadata", JSON.stringify(orderMetadata));
    localStorage.setItem("cart", JSON.stringify(localCart));
    localStorage.setItem(`fake_checkout_session_${fakeId}`, JSON.stringify(fakeSession));

    navigate(`/order-success?session_id=${encodeURIComponent(fakeId)}&mode=fake`);
  };

  /**
   * Handle points usage input
   */
  const handlePointsChange = (points: number): void => {
    const maxUsablePoints = Math.min(availablePoints, rmToPoints(subtotal));
    setPointsToUse(Math.max(0, Math.min(points, maxUsablePoints)));
  };

  // If user not logged in, show a friendly guest state with navigation options.
  // Mobile note: always include a "Continue Shopping" link so users are never
  // left on a dead-end screen with no visible exit.
  if (!user) {
    return (
      <>
        <NavbarHome />
        <div
          className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 pt-20 md:pt-24"
          style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="max-w-3xl mx-auto">
            {/* Back navigation — primary escape on mobile WebView */}
            <div className="mb-4">
              <Link
                to="/product-section"
                className="inline-flex items-center text-blue-600 hover:underline text-sm"
              >
                <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
                Continue Shopping
              </Link>
            </div>

            <Card className="mb-6">
              <div className="text-center py-10">
                <HiOutlineShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Your cart is empty
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Sign in to see your saved items, or keep browsing.
                </p>
                {/* Pass returnTo so after login the user lands back on /cart */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/authentication/sign-in?returnTo=%2Fcart">
                    <Button color="blue" className="w-full sm:w-auto">Sign In</Button>
                  </Link>
                  <Link to="/product-section">
                    <Button color="light" className="w-full sm:w-auto">Browse Products</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarHome />
      {/* Mobile: bottom padding clears the fixed bottom nav + safe area */}
      <div
        className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 pt-20 md:pt-24"
        style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link to="/product-section" className="inline-flex items-center text-blue-600 hover:underline">
              <HiOutlineArrowLeft className="mr-2 h-5 w-5" />
              Continue Shopping
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <HiOutlineShoppingCart className="mr-3 h-8 w-8" />
            Shopping Cart
            <Badge color="gray" className="ml-3">
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
            </Badge>
          </h1>

          {cartItems.length === 0 ? (
            <Card className="mb-6">
              <div className="text-center py-10">
                <div className="mx-auto w-16 h-16 mb-4 text-gray-400">
                  <HiOutlineShoppingCart className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Looks like you haven&apos;t added any items to your cart yet.
                </p>
                <Link to="/product-section">
                  <Button color="blue">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items Section */}
              <div className="lg:col-span-2">
                {hasDeletedProducts && (
                  <Card className="mb-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Some items are unavailable
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          One or more products in your cart were removed from sale. Please remove them before checkout.
                        </p>
                      </div>
                      <Button color="failure" onClick={() => void handleRemoveDeletedItems()}>
                        Remove Unavailable Items
                      </Button>
                    </div>
                  </Card>
                )}
                <Card className="mb-6">
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex flex-col md:flex-row border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                        <div className="w-full md:w-32 h-32 flex-shrink-0 mb-4 md:mb-0">
                          <Link to={`/product-details/${item.productId}`}>
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-md"
                              loading="lazy"
                              decoding="async"
                            />
                          </Link>
                        </div>
                        <div className="flex-grow md:ml-4">
                          <div className="flex flex-col md:flex-row justify-between">
                            <div>
                              <Link to={`/product-details/${item.productId}`} className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600">
                                {item.name}
                              </Link>
                              {item.isDeleted && (
                                <p className="mt-1 text-sm text-red-600">
                                  This product is no longer available.
                                </p>
                              )}
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Variant: {item.variant || "Default"}
                              </p>

                              {/* Price */}
                              <div className="flex items-baseline mt-1">
                                <span className="text-lg font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(item.price)}
                                </span>
                                {item.originalPrice && (
                                  <span className="ml-2 text-sm text-gray-500 line-through">
                                    {formatCurrency(item.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="mt-3 md:mt-0 text-right">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>

                          {/* Quantity and Actions
                              Mobile note: buttons use min 44×44px touch targets
                              (Apple HIG / Google Material minimum) to prevent
                              mis-taps on small screens. */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4">
                            <div className="flex items-center mb-3 md:mb-0">
                              {/* Decrease quantity */}
                              <button
                                type="button"
                                onClick={() => void handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.isDeleted || item.quantity <= 1}
                                aria-label="Decrease quantity"
                                className="flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <HiMinus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                              </button>

                              <span className="mx-4 w-8 text-center text-base font-medium tabular-nums text-gray-900 dark:text-white">
                                {item.quantity}
                              </span>

                              {/* Increase quantity */}
                              <button
                                type="button"
                                onClick={() => void handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={item.isDeleted || item.quantity >= item.maxQuantity}
                                aria-label="Increase quantity"
                                className="flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <HiPlus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                              </button>

                              {item.quantity >= item.maxQuantity && (
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                  Max
                                </span>
                              )}
                            </div>

                            <div className="flex space-x-2">
                              {/* Remove item — also meets 44px minimum via py-2.5 px-4 */}
                              <button
                                type="button"
                                onClick={() => void handleRemoveItem(item.id)}
                                aria-label={`Remove ${item.name} from cart`}
                                className="inline-flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <HiOutlineTrash className="mr-1.5 h-4 w-4" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Security and Information */}
                <Card>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start">
                      <div className="mr-3 text-blue-600">
                        <HiOutlineShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Secure Checkout</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Your payment information is encrypted</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-3 text-blue-600">
                        <HiOutlineTruck className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Free Shipping</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">On orders over $100</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-3 text-blue-600">
                        <HiOutlineCreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Multiple Payment Options</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Credit card, PayPal, and more</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Order Summary Section */}
              <div className="lg:col-span-1">
                <Card>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Order Summary
                  </h2>

                  {/* Points Usage Section */}
                  {availablePoints > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Use Points (Available: {availablePoints.toLocaleString()})
                      </h3>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={Math.min(availablePoints, rmToPoints(subtotal))}
                          value={pointsToUse}
                          onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Points to use"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          = {formatCurrency(pointsToRM(pointsToUse))}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Max usable: {Math.min(availablePoints, rmToPoints(subtotal)).toLocaleString()} points
                      </p>
                    </div>
                  )}

                  {/* Price Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                    </div>

                    {pointsToUse > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Points Discount ({pointsToUse.toLocaleString()} points)</span>
                        <span>-{formatCurrency(pointsDiscount)}</span>
                      </div>
                    )}

                    {pointsEarned > 0 && (
                      <div className="flex justify-between text-blue-600 dark:text-blue-400">
                        <span>Points Earned</span>
                        <span>+{pointsEarned.toLocaleString()} points</span>
                      </div>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      <div className="flex justify-between font-bold">
                        <span className="text-lg">Total</span>
                        <span className="text-xl text-gray-900 dark:text-white">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button (Stripe) */}
                  <div className="mt-6">
                    <CheckoutButton
                      items={cartItems.map((i) => ({
                        name: i.name,
                        quantity: i.quantity,
                        price: Math.round(i.price * 100),
                      }))}
                      customerId={user.id}
                      buttonTitle="Proceed to Checkout"
                    />
                    <div className="mt-3">
                      <Button color="success" onClick={handleTestPayNow}>
                        Test Pay Now (Skip Stripe)
                      </Button>
                    </div>

                    {/* Payment methods image removed */}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartPage; 