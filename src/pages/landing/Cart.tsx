import React, { useState, useEffect } from "react";
import { Button, Card, TextInput, Alert, Badge, Tooltip } from "flowbite-react";
import NavbarHome from "../../components/navbar-home";
import { Link, useNavigate } from "react-router-dom";
import { 
  HiOutlineShoppingCart, 
  HiOutlineTrash, 
  HiOutlineHeart, 
  HiOutlineArrowLeft, 
  HiOutlineShieldCheck, 
  HiOutlineCreditCard,
  HiOutlineTruck,
  HiOutlineInformationCircle,
  HiPlus,
  HiMinus
} from "react-icons/hi";

// Define TypeScript interfaces
interface CartItem {
  id: string;
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
  
  // Mock data for cart items
  const initialItems: CartItem[] = [
    {
      id: "p1",
      name: "Wireless Noise-Cancelling Headphones",
      price: 99.99,
      originalPrice: 149.99,
      quantity: 1,
      image: "/images/products/product-1.jpg",
      variant: "Black",
      inStock: true,
      maxQuantity: 5
    },
    {
      id: "p2",
      name: "Smart Watch Series 5",
      price: 199.99,
      quantity: 2,
      image: "/images/products/product-2.jpg",
      variant: "Silver",
      inStock: true,
      maxQuantity: 3
    },
    {
      id: "p3",
      name: "Premium Leather Wallet",
      price: 49.99,
      originalPrice: 59.99,
      quantity: 1,
      image: "/images/products/product-3.jpg",
      variant: "Brown",
      inStock: true,
      maxQuantity: 10
    }
  ];

  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems);
  const [promoCode, setPromoCode] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = appliedPromo ? (
    appliedPromo.type === "percentage" 
      ? subtotal * (appliedPromo.discount / 100) 
      : appliedPromo.discount
  ) : 0;
  
  // Fixed shipping cost for simplicity
  const shipping = subtotal > 0 ? 5.99 : 0;
  
  // Estimated tax (for example, 8%)
  const taxRate = 0.08;
  const tax = (subtotal - discount) * taxRate;
  
  // Total
  const total = subtotal - discount + shipping + tax;

  // Handle item quantity change
  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        // Don't allow exceeding max quantity
        const quantity = Math.min(newQuantity, item.maxQuantity);
        return { ...item, quantity };
      }
      return item;
    }));
  };

  // Handle item removal
  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  // Handle move to wishlist
  const handleMoveToWishlist = (id: string) => {
    // In a real app, this would add the item to the wishlist in your state management
    console.log(`Moving item ${id} to wishlist`);
    
    // Remove from cart
    handleRemoveItem(id);
  };

  // Apply promo code
  const handleApplyPromoCode = () => {
    // Reset previous error
    setPromoError(null);
    
    // Simple validation
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }
    
    // Check if code is valid (mock validation)
    if (promoCode.toUpperCase() === "DISCOUNT20") {
      setAppliedPromo({
        code: "DISCOUNT20",
        discount: 20,
        type: "percentage",
        valid: true
      });
      setPromoCode("");
    } else if (promoCode.toUpperCase() === "SAVE10") {
      setAppliedPromo({
        code: "SAVE10",
        discount: 10,
        type: "fixed",
        valid: true
      });
      setPromoCode("");
    } else {
      setPromoError("Invalid promo code. Please try again.");
    }
  };

  // Remove applied promo code
  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
  };

  // Proceed to checkout
  const handleCheckout = () => {
    // Navigate directly to the checkout page
    navigate("/checkout");
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  return (
    <>
      <NavbarHome />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
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
                          <Link to={`/product-details/${item.id}`}>
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
                              <Link to={`/product-details/${item.id}`} className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600">
                                {item.name}
                              </Link>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Variant: {item.variant}
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
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
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
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
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
                                onClick={() => handleMoveToWishlist(item.id)}
                              >
                                <HiOutlineHeart className="mr-1 h-4 w-4" />
                                Save
                              </Button>
                              <Button 
                                size="xs" 
                                color="light"
                                onClick={() => handleRemoveItem(item.id)}
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
                  
                  {/* Promo Code Section */}
                  <div className="mb-6">
                    {appliedPromo ? (
                      <div className="bg-green-50 dark:bg-green-900 border border-green-100 dark:border-green-800 rounded-lg p-3 mb-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-100">
                              {appliedPromo.code}
                              {appliedPromo.type === "percentage" 
                                ? ` (${appliedPromo.discount}% off)` 
                                : ` ($${appliedPromo.discount.toFixed(2)} off)`}
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-200">
                              Promo code applied successfully!
                            </p>
                          </div>
                          <Button 
                            size="xs" 
                            color="light"
                            onClick={handleRemovePromoCode}
                          >
                            <HiOutlineTrash className="mr-1 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Have a promo code?
                        </p>
                        <div className="flex">
                          <TextInput
                            type="text"
                            placeholder="Enter promo code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="flex-grow"
                          />
                          <Button 
                            color="light"
                            className="ml-2"
                            onClick={handleApplyPromoCode}
                          >
                            Apply
                          </Button>
                        </div>
                        {promoError && (
                          <p className="text-xs text-red-600 mt-1">
                            {promoError}
                          </p>
                        )}
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Try codes: &quot;DISCOUNT20&quot; for 20% off or &quot;SAVE10&quot; for $10 off
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Price Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Shipping</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(shipping)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center text-gray-700 dark:text-gray-300">
                        Estimated Tax
                        <Tooltip content="Tax calculated based on your shipping address">
                          <HiOutlineInformationCircle className="ml-1 h-4 w-4 text-gray-400" />
                        </Tooltip>
                      </span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(tax)}</span>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      <div className="flex justify-between font-bold">
                        <span className="text-lg">Total</span>
                        <span className="text-xl text-gray-900 dark:text-white">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Checkout Button */}
                  <div className="mt-6">
                    <Button 
                      onClick={handleCheckout} 
                      color="blue" 
                      className="w-full mb-2 py-3 font-medium text-base"
                      disabled={cartItems.length === 0 || isCheckingOut}
                    >
                      {isCheckingOut ? (
                        <>
                          <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <HiOutlineCreditCard className="mr-2 h-5 w-5" />
                          Proceed to Checkout
                        </>
                      )}
                    </Button>
                    
                    <div className="flex items-center justify-center mt-4">
                      <img 
                        src="/images/payment-methods.png" 
                        alt="Payment Methods" 
                        className="h-6"
                      />
                    </div>
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