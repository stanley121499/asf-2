"use client";
import React, { useState, useEffect, useMemo } from "react";
import NavbarHome from "@/components/navbar-home";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiOutlineTrash, HiOutlineArrowLeft, HiPlus, HiMinus } from "react-icons/hi";
import { useAuthContext } from "@/context/AuthContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useAddToCartLogContext } from "@/context/product/AddToCartLogContext";
import { supabase } from "@/utils/supabaseClient";
import type { Database } from "@/database.types";
import { readDeletedAt } from "@/utils/softDeleteRuntime";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import { formatCurrency, pointsToRM, rmToPoints, calculatePointsEarned } from "@/utils/pointsConfig";
import {
  writeCheckoutPromo,
  clearCheckoutPromo,
  readCheckoutPromo,
} from "@/utils/checkoutPromoStorage";
import { usePromotionContext } from "@/context/PromotionContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useWarrantyCreditContext } from "@/context/WarrantyCreditContext";
import {
  writeCheckoutWarrantyCredit,
  clearCheckoutWarrantyCredit,
  readCheckoutWarrantyCredit,
} from "@/utils/checkoutWarrantyCreditStorage";
import Image from "next/image";
import { LandingLayout } from "@/layouts";

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
  isDeleted: boolean;
  deletedAt?: string;
}

const CartPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthContext();
  const { add_to_carts, updateAddToCart, deleteAddToCart } = useAddToCartContext();
  const { createAddToCartLog } = useAddToCartLogContext();
  const pointsAPI = usePointsMembership();
  const { validatePromoCode } = usePromotionContext();
  const { isEnabled } = useFeatureFlags();
  const claimsEnabled = isEnabled("claims");
  const { credits: warrantyCredits, applyCreditToCart } = useWarrantyCreditContext();

  const [appliedWarrantyCredit, setAppliedWarrantyCredit] = useState<{
    creditId: string;
    discountAmountMyr: number;
    label: string;
  } | null>(null);
  const [warrantyCreditError, setWarrantyCreditError] = useState<string | null>(null);
  const [warrantyApplying, setWarrantyApplying] = useState(false);

  const [cartItems, setCartItems] = useState<CartItemViewModel[]>([]);
  const hasDeletedProducts: boolean = useMemo(() => cartItems.some((item) => item.isDeleted), [cartItems]);
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [pointsInput, setPointsInput] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplying, setPromoApplying] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    promoCode: string;
    promotionId: string;
    discountAmountMyr: number;
  } | null>(null);

  useEffect(() => {
    const fetchUserPoints = async () => {
      if (user?.id) {
        try {
          const pointsRecord = await pointsAPI.getUserPointsByUserId(user.id);
          setUserPoints(pointsRecord?.amount || 0);
        } catch {
          setUserPoints(0);
        }
      }
    };
    fetchUserPoints();
  }, [user, pointsAPI]);

  const userCartRows = useMemo(() => {
    if (!user?.id) return [] as Database["public"]["Tables"]["add_to_carts"]["Row"][];
    return add_to_carts.filter((row) => row.user_id === user.id);
  }, [add_to_carts, user]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateCart(): Promise<void> {
      if (!user?.id || userCartRows.length === 0) {
        setCartItems([]);
        return;
      }

      const productIds = Array.from(new Set(userCartRows.map((r) => r.product_id)));
      const colorIds = Array.from(new Set(userCartRows.map((r) => r.color_id).filter((v): v is string => typeof v === "string")));
      const sizeIds = Array.from(new Set(userCartRows.map((r) => r.size_id).filter((v): v is string => typeof v === "string")));

      const [productsRes, mediasRes, colorsRes, sizesRes] = await Promise.all([
        supabase.from("products").select("*").in("id", productIds),
        supabase.from("product_medias").select("product_id,media_url,arrangement").in("product_id", productIds),
        colorIds.length > 0 ? supabase.from("product_colors").select("id,color").in("id", colorIds) : Promise.resolve({ data: [] }),
        sizeIds.length > 0 ? supabase.from("product_sizes").select("id,size").in("id", sizeIds) : Promise.resolve({ data: [] }),
      ]);

      const products = (productsRes.data ?? []).reduce<
        Record<string, Database["public"]["Tables"]["products"]["Row"]>
      >((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      const firstMediaByProduct: Record<string, string> = {};
      (mediasRes.data ?? [])
        .sort((a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0))
        .forEach((m) => {
          if (!firstMediaByProduct[m.product_id]) {
            firstMediaByProduct[m.product_id] = m.media_url as string;
          }
        });

      const colorLabelById: Record<string, string> = {};
      (colorsRes.data ?? []).forEach((c) => {
        colorLabelById[c.id] = typeof c.color === "string" ? c.color : "";
      });
      const sizeLabelById: Record<string, string> = {};
      (sizesRes.data ?? []).forEach((s) => {
        sizeLabelById[s.id] = typeof s.size === "string" ? s.size : "";
      });

      const hydrated: CartItemViewModel[] = userCartRows.map((row) => {
        const product = products[row.product_id] || {};
        const imageUrl = firstMediaByProduct[row.product_id] || "/default-image.jpg";
        const colorText = row.color_id ? colorLabelById[row.color_id] : "";
        const sizeText = row.size_id ? sizeLabelById[row.size_id] : "";
        const variant = [colorText, sizeText].filter(Boolean).join(" / ");

        const deletedAtIso = readDeletedAt(product);
        const isDeleted = typeof deletedAtIso === "string" && deletedAtIso.length > 0;

        return {
          id: row.id,
          productId: row.product_id,
          name: product.name || "Product",
          price: product.price || 0,
          originalPrice: undefined,
          quantity: row.amount || 1,
          image: imageUrl,
          variant: variant || "默认规格",
          inStock: !isDeleted,
          maxQuantity: isDeleted ? 0 : 99,
          isDeleted,
          deletedAt: isDeleted ? deletedAtIso : undefined,
        };
      });

      if (!isCancelled) setCartItems(hydrated);
    }

    hydrateCart();
    return () => { isCancelled = true; };
  }, [user, userCartRows]);

  /**
   * Restores an applied promo from sessionStorage when returning from checkout.
   */
  useEffect(() => {
    const stored = readCheckoutPromo();
    if (stored !== null) {
      setAppliedPromo(stored);
    }
    const storedCredit = readCheckoutWarrantyCredit();
    if (storedCredit !== null) {
      setAppliedWarrantyCredit({
        creditId: storedCredit.creditId,
        discountAmountMyr: storedCredit.discountAmountMyr,
        label: "Warranty credit",
      });
    }
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const promoDiscountMyr = appliedPromo !== null ? appliedPromo.discountAmountMyr : 0;
  const warrantyDiscountMyr =
    appliedWarrantyCredit !== null ? appliedWarrantyCredit.discountAmountMyr : 0;
  const merchandiseAfterPromo = Math.max(0, subtotal - promoDiscountMyr - warrantyDiscountMyr);
  const availablePoints = userPoints;
  const pointsDiscount = pointsToRM(pointsToUse);
  const total = Math.max(0, merchandiseAfterPromo - pointsDiscount);
  const pointsEarned = pointsToUse > 0 ? 0 : calculatePointsEarned(total);

  const handleApplyPoints = () => {
    const pts = parseInt(pointsInput, 10) || 0;
    const maxUsablePoints = Math.min(availablePoints, rmToPoints(merchandiseAfterPromo));
    setPointsToUse(Math.max(0, Math.min(pts, maxUsablePoints)));
  };

  /**
   * Validates the coupon against the current cart via the promotions API.
   */
  const handleApplyCoupon = async (): Promise<void> => {
    setPromoError(null);
    if (user === null) {
      return;
    }
    if (userCartRows.length === 0) {
      setPromoError("购物车为空。");
      return;
    }
    setPromoApplying(true);
    try {
      const cartLines = userCartRows.map((row) => ({
        product_id: row.product_id,
        amount: row.amount,
      }));
      const result = await validatePromoCode(couponInput, cartLines);
      if (result.valid === false) {
        setAppliedPromo(null);
        setPromoError(result.reason);
        return;
      }
      setAppliedPromo({
        promoCode: couponInput.trim(),
        promotionId: result.promotionId,
        discountAmountMyr: result.discountAmountMyr,
      });
      setCouponInput("");
    } finally {
      setPromoApplying(false);
    }
  };

  /**
   * Persists promo metadata for checkout and navigates to the checkout page.
   */
  const handleGoToCheckout = (): void => {
    if (cartItems.length === 0) {
      return;
    }
    if (appliedPromo !== null) {
      writeCheckoutPromo({
        promoCode: appliedPromo.promoCode,
        promotionId: appliedPromo.promotionId,
        discountAmountMyr: appliedPromo.discountAmountMyr,
      });
    } else {
      clearCheckoutPromo();
    }
    if (appliedWarrantyCredit !== null) {
      writeCheckoutWarrantyCredit({
        creditId: appliedWarrantyCredit.creditId,
        discountAmountMyr: appliedWarrantyCredit.discountAmountMyr,
      });
    } else {
      clearCheckoutWarrantyCredit();
    }
    router.push("/checkout");
  };

  const activeWarrantyCredits = warrantyCredits.filter((c) => c.status === "active");

  const handleApplyWarrantyCredit = async (creditId: string): Promise<void> => {
    setWarrantyCreditError(null);
    setWarrantyApplying(true);
    try {
      const result = await applyCreditToCart(creditId, subtotal);
      if (result.valid === false) {
        setAppliedWarrantyCredit(null);
        setWarrantyCreditError(result.reason);
        return;
      }
      const credit = warrantyCredits.find((c) => c.id === creditId);
      setAppliedWarrantyCredit({
        creditId,
        discountAmountMyr: result.discountAmountMyr,
        label: credit?.productName ?? "Warranty credit",
      });
    } finally {
      setWarrantyApplying(false);
    }
  };

  const handleQuantityChange = async (id: string, newQuantity: number): Promise<void> => {
    if (newQuantity < 1) return;
    const current = cartItems.find((i) => i.id === id);
    if (!current) return;
    const clamped = Math.min(newQuantity, current.maxQuantity);

    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: clamped } : item)));
    await updateAddToCart({ id, amount: clamped });
    if (current.productId) {
      await createAddToCartLog({ product_id: current.productId, action_type: "update", amount: clamped });
    }
  };

  const handleRemoveItem = async (id: string): Promise<void> => {
    const current = cartItems.find((i) => i.id === id);
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    await deleteAddToCart(id);
    if (current?.productId) {
      await createAddToCartLog({ product_id: current.productId, action_type: "delete", amount: 0 });
    }
  };

  const handleRemoveDeletedItems = async (): Promise<void> => {
    const idsToRemove = cartItems.filter((i) => i.isDeleted).map((i) => i.id);
    for (const id of idsToRemove) await handleRemoveItem(id);
  };

  const handleTestPayNow = (): void => {
    if (cartItems.length === 0) {
      alert("您的购物车为空。");
      return;
    }

    const fakeId = `cs_test_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const fakeSession = {
      id: fakeId,
      customer_details: {
        name: "Test User",
        email: "test@example.com",
        phone: "+60123456789",
        address: { line1: "123 Test Street", line2: "Unit 4A", city: "Test City", state: "Selangor", postal_code: "43000", country: "MY" },
      },
      payment_method_details: { type: "card" },
      created: Math.floor(Date.now() / 1000),
    };

    const localCart = cartItems.map((i) => ({
      id: i.productId,
      price: Math.round(i.price * 100),
      quantity: i.quantity,
      color_id: null,
      size_id: null,
    }));

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

    router.push(`/order-success?session_id=${encodeURIComponent(fakeId)}&mode=fake`);
  };

  if (!user) {
    return (
      <LandingLayout>
        <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-xl font-medium text-[var(--color-text)] mb-2">登录以查看购物车</h3>
          <p className="text-sm text-[var(--color-muted)] mb-6">您需要登录后才能查看或添加商品到购物车</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link href="/authentication/sign-in?returnTo=%2Fcart" className="w-full btn-primary rounded-xl py-3 text-center">
              登录 / 注册
            </Link>
            <Link href="/" className="w-full border border-[var(--color-border)] rounded-xl py-3 text-[var(--color-text)] text-sm font-medium">
              回到首页
            </Link>
          </div>
        </div>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <div className="min-h-screen bg-[var(--color-bg)] pb-32">
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] h-[56px] flex items-center px-4">
        <button onClick={() => router.push('/product-section')} className="text-[var(--color-text)] text-sm font-medium shrink-0">
          ← 继续购物
        </button>
        <h1 className="flex-1 text-center font-display text-lg tracking-wide pr-14">
          购物车
        </h1>
      </div>

      <div className="px-4 py-6">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-display text-xl text-[var(--color-text)] mb-2">您的购物车为空</p>
            <p className="text-[var(--color-muted)] text-sm mb-6">快去挑选您喜欢的商品吧</p>
            <Link href="/" className="btn-primary rounded-xl px-8 py-3">
              去购物
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {hasDeletedProducts && (
              <div className="bg-red-50 p-4 rounded-xl flex items-center justify-between">
                <span className="text-sm text-red-600 font-medium">包含已下架商品</span>
                <button onClick={handleRemoveDeletedItems} className="text-sm text-red-600 underline">移除</button>
              </div>
            )}
            
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-[var(--color-border)] pb-6 last:border-0 last:pb-0">
                  <div className="w-[100px] h-[100px] shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-text)] line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-[var(--color-muted)] mt-1">{item.variant}</p>
                      {item.isDeleted && <p className="text-xs text-red-500 mt-1">此商品已下架</p>}
                    </div>
                    
                    <div className="flex items-end justify-between mt-2">
                      <span className="font-medium text-[var(--color-text)]">RM {item.price.toFixed(2)}</span>
                      <div className="flex items-center gap-4">
                        <button onClick={() => handleRemoveItem(item.id)}>
                          <HiOutlineTrash className="text-[var(--color-muted)]" size={18} />
                        </button>
                        <div className="flex items-center gap-3 border border-[var(--color-border)] rounded-full px-3 py-1">
                          <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.isDeleted || item.quantity <= 1} className="disabled:opacity-30">
                            <HiMinus size={14} className="text-[var(--color-text)]" />
                          </button>
                          <span className="text-sm font-medium tabular-nums min-w-[20px] text-center text-[var(--color-text)]">{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} disabled={item.isDeleted || item.quantity >= item.maxQuantity} className="disabled:opacity-30">
                            <HiPlus size={14} className="text-[var(--color-text)]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-xs text-[var(--color-muted)]">优惠码</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    setPromoError(null);
                  }}
                  placeholder="输入代码"
                  className="flex-1 bg-white border border-[var(--color-border)] text-sm px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-black"
                  disabled={promoApplying}
                />
                <button
                  type="button"
                  onClick={() => void handleApplyCoupon()}
                  disabled={promoApplying || couponInput.trim().length === 0}
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                >
                  {promoApplying ? "…" : "应用"}
                </button>
              </div>
              {promoError !== null ? (
                <p className="text-xs text-red-600">{promoError}</p>
              ) : null}
              {appliedPromo !== null ? (
                <div className="flex justify-between text-sm text-green-700">
                  <span>已应用: {appliedPromo.promoCode}</span>
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() => {
                      setAppliedPromo(null);
                      clearCheckoutPromo();
                    }}
                  >
                    移除
                  </button>
                </div>
              ) : null}
            </div>

            {claimsEnabled && activeWarrantyCredits.length > 0 ? (
              <div className="mt-6 space-y-2">
                <p className="text-xs text-[var(--color-muted)]">保固抵扣</p>
                <div className="space-y-2">
                  {activeWarrantyCredits.map((credit) => (
                    <div
                      key={credit.id}
                      className="flex items-center justify-between gap-2 text-sm border border-[var(--color-border)] rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">RM {credit.amountMyr.toFixed(2)}</p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {credit.productName} · 至{" "}
                          {new Date(credit.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={warrantyApplying}
                        onClick={() => void handleApplyWarrantyCredit(credit.id)}
                        className="text-xs font-medium border border-black rounded-full px-3 py-1 disabled:opacity-40"
                      >
                        应用
                      </button>
                    </div>
                  ))}
                </div>
                {warrantyCreditError !== null ? (
                  <p className="text-xs text-red-600">{warrantyCreditError}</p>
                ) : null}
                {appliedWarrantyCredit !== null ? (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>保固抵扣 −RM {appliedWarrantyCredit.discountAmountMyr.toFixed(2)}</span>
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => {
                        setAppliedWarrantyCredit(null);
                        clearCheckoutWarrantyCredit();
                      }}
                    >
                      移除
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-8 border-t border-[var(--color-border)] pt-6">
              <h3 className="font-display text-lg mb-4 text-[var(--color-text)]">订单摘要</h3>
              
              <div className="space-y-3 text-sm text-[var(--color-text)]">
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">小计</span>
                  <span className="font-medium">RM {subtotal.toFixed(2)}</span>
                </div>
                {appliedPromo !== null && promoDiscountMyr > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>优惠</span>
                    <span>-RM {promoDiscountMyr.toFixed(2)}</span>
                  </div>
                )}
                {appliedWarrantyCredit !== null && warrantyDiscountMyr > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>保固抵扣</span>
                    <span>-RM {warrantyDiscountMyr.toFixed(2)}</span>
                  </div>
                )}
                {pointsToUse > 0 && (
                  <div className="flex justify-between text-[var(--color-accent)]">
                    <span>积分抵扣 (-{pointsToUse})</span>
                    <span>-RM {pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-[var(--color-border)]">
                  <span>总计</span>
                  <span>RM {total.toFixed(2)}</span>
                </div>
                {pointsEarned > 0 && (
                  <p className="text-xs text-[var(--color-muted)] text-right mt-1">
                    完成订单可获 {pointsEarned} 积分
                  </p>
                )}
              </div>

              {availablePoints > 0 && (
                <div className="mt-6 bg-[var(--color-panel)] p-4 rounded-xl">
                  <p className="text-xs text-[var(--color-muted)] mb-2">可用积分: {availablePoints}</p>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="输入使用数量"
                      value={pointsInput}
                      onChange={(e) => setPointsInput(e.target.value)}
                      className="flex-1 bg-white border border-[var(--color-border)] text-sm px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-black"
                    />
                    <button 
                      onClick={handleApplyPoints}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      应用
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={handleGoToCheckout}
                className="w-full btn-primary h-[56px] rounded-full text-lg"
              >
                前往结账
              </button>
              <button
                type="button"
                onClick={handleTestPayNow}
                className="w-full text-xs text-[var(--color-muted)] underline py-2"
              >
                测试支付（模拟成功）
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </LandingLayout>
  );
};

export default CartPage;