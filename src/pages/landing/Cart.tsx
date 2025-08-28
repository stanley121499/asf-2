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
import type { Database } from "../../../database.types";
import CheckoutButton from "../../components/stripe/CheckoutButton";

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
}

interface PromoCode {
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  valid: boolean;
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { add_to_carts, updateAddToCart, deleteAddToCart } = useAddToCartContext();
  const { createAddToCartLog } = useAddToCartLogContext();

  const [cartItems, setCartItems] = useState<CartItemViewModel[]>([]);
  // Promo codes removed per requirements
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

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
          .select("id,name,price")
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

      const products = (productsRes.data ?? []).reduce(
        (acc: Record<string, { id: string; name: string; price: number }>, p) => {
          acc[p.id] = p as { id: string; name: string; price: number };
          return acc;
        },
        {}
      );

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

        return {
          id: row.id,
          productId: row.product_id,
          name: product?.name ?? "Product",
          price: typeof product?.price === "number" ? product.price : 0,
          originalPrice: undefined,
          quantity: typeof row.amount === "number" ? row.amount : 1,
          image: imageUrl,
          variant: variant,
          inStock: true,
          maxQuantity: 99,
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
  // Total equals subtotal (no promo code, shipping, or estimated tax)
  const total = subtotal;

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

  // Wishlist and promo features removed per requirements

  // Proceed to checkout
  const handleCheckout = () => {
    navigate("/checkout");
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  // If user not logged in, prompt to sign in
  if (!user) {
    return (
      <>
        <NavbarHome />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 pt-20 md:pt-24">
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6">
              <div className="text-center py-10">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Please sign in to view your cart
                </h3>
                <Link to="/authentication/sign-in">
                  <Button color="blue">Sign In</Button>
                </Link>
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 pt-20 md:pt-24">
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
                            />
                          </Link>
                        </div>
                        <div className="flex-grow md:ml-4">
                          <div className="flex flex-col md:flex-row justify-between">
                            <div>
                              <Link to={`/product-details/${item.productId}`} className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600">
                                {item.name}
                              </Link>
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

                          {/* Quantity and Actions */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4">
                            <div className="flex items-center mb-3 md:mb-0">
                              <Button 
                                size="xs" 
                                color="light"
                                onClick={() => void handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <HiMinus className="h-3 w-3" />
                              </Button>
                              <span className="mx-3 w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button 
                                size="xs" 
                                color="light"
                                onClick={() => void handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.maxQuantity}
                              >
                                <HiPlus className="h-3 w-3" />
                              </Button>
                              {item.quantity >= item.maxQuantity && (
                                <span className="ml-2 text-xs text-gray-500">
                                  Max
                                </span>
                              )}
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                size="xs" 
                                color="light"
                                onClick={() => void handleRemoveItem(item.id)}
                              >
                                <HiOutlineTrash className="mr-1 h-4 w-4" />
                                Remove
                              </Button>
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
                  
                  {/* Promo code UI removed */}
                  
                  {/* Price Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                    </div>
                    
                    
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