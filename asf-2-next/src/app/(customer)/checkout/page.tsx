"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Label,
  Spinner,
  TextInput,
} from "flowbite-react";
import {
  HiOutlineChevronLeft,
  HiOutlineDocumentText,
  HiOutlineLocationMarker,
  HiOutlineShoppingCart,
} from "react-icons/hi";

import NavbarHome from "@/components/navbar-home";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import type { Database } from "@/database.types";
import { formatCurrency } from "@/utils/pointsConfig";
import { readDeletedAt } from "@/utils/softDeleteRuntime";
import { supabase } from "@/utils/supabaseClient";

import {
  readCheckoutPromo,
  type CheckoutPromoPayload,
} from "@/utils/checkoutPromoStorage";
import {
  readCheckoutWarrantyCredit,
  type CheckoutWarrantyCreditPayload,
} from "@/utils/checkoutWarrantyCreditStorage";
import {
  buildFlatFallbackRate,
  fetchDeliveryRates,
  FLAT_SHIPPING_MYR,
  formatDeliveryEta,
  type DeliveryRateOption,
} from "@/utils/checkoutDelivery";

import { CheckoutStripePaymentInner } from "./_components/CheckoutStripePayment";
import { stripePromise } from "./_components/stripeClient";

enum CheckoutStep {
  Shipping = "shipping",
  Review = "review",
}

interface AddressFormState {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface CartLineViewModel {
  cartRowId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant: string;
  isDeleted: boolean;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Reads the first matching string from user metadata for address prefill.
 */
function readMetaString(meta: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = meta[key];
    if (isNonEmptyString(v)) {
      return v.trim();
    }
  }
  return "";
}

/**
 * Builds display and structured payloads for the pending-order API.
 */
function buildShippingPayload(address: AddressFormState): {
  shipping_address: string;
  shipping_address_structured: {
    address1: string;
    address2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    recipientName: string;
    recipientPhone: string;
  };
} {
  const recipientName = `${address.firstName} ${address.lastName}`.trim();
  const parts = [
    recipientName,
    address.address1,
    address.address2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
    address.phone,
  ].filter((p) => p.trim().length > 0);
  const shipping_address = parts.join(", ");
  return {
    shipping_address,
    shipping_address_structured: {
      address1: address.address1.trim(),
      address2: address.address2.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      postcode: address.postalCode.trim(),
      country: address.country.trim(),
      recipientName: recipientName.length > 0 ? recipientName : "Customer",
      recipientPhone: address.phone.trim(),
    },
  };
}

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const { user, user_detail, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { add_to_carts, loading: cartLoading } = useAddToCartContext();

  useEffect(() => {
    if (!isEnabled("cart")) {
      router.replace("/");
    }
  }, [isEnabled, router]);

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.Shipping);
  const [address, setAddress] = useState<AddressFormState>({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "MY",
    phone: "",
  });
  const [addressInitialized, setAddressInitialized] = useState(false);

  const [cartLines, setCartLines] = useState<CartLineViewModel[]>([]);
  const [cartHydrateError, setCartHydrateError] = useState<string | null>(null);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [preparingCheckout, setPreparingCheckout] = useState(false);

  const [agreeToTerms, setAgreeToTerms] = useState(false);

  /** Promo carried from cart via sessionStorage; totals are re-validated on the server. */
  const [checkoutPromo, setCheckoutPromo] = useState<CheckoutPromoPayload | null>(null);
  const [checkoutWarrantyCredit, setCheckoutWarrantyCredit] =
    useState<CheckoutWarrantyCreditPayload | null>(null);

  const [deliveryRates, setDeliveryRates] = useState<DeliveryRateOption[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [selectedServiceCode, setSelectedServiceCode] = useState<string | null>(null);

  useEffect(() => {
    setCheckoutPromo(readCheckoutPromo());
    setCheckoutWarrantyCredit(readCheckoutWarrantyCredit());
  }, []);

  useEffect(() => {
    if (authLoading || user === null || addressInitialized) {
      return;
    }
    const meta: Record<string, unknown> =
      user.user_metadata && typeof user.user_metadata === "object" && !Array.isArray(user.user_metadata)
        ? (user.user_metadata as Record<string, unknown>)
        : {};

    setAddress((prev) => ({
      ...prev,
      firstName: isNonEmptyString(user_detail?.first_name) ? String(user_detail.first_name) : prev.firstName,
      lastName: isNonEmptyString(user_detail?.last_name) ? String(user_detail.last_name) : prev.lastName,
      city: isNonEmptyString(user_detail?.city) ? String(user_detail.city) : prev.city,
      state: isNonEmptyString(user_detail?.state) ? String(user_detail.state) : prev.state,
      address1: readMetaString(meta, ["address_line1", "line1", "address1"]) || prev.address1,
      address2: readMetaString(meta, ["address_line2", "line2", "address2"]) || prev.address2,
      postalCode: readMetaString(meta, ["postcode", "postal_code", "zip"]) || prev.postalCode,
      country: readMetaString(meta, ["country"]) || prev.country,
      phone: readMetaString(meta, ["phone"]) || prev.phone,
    }));
    setAddressInitialized(true);
  }, [authLoading, user, user_detail, addressInitialized]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user === null) {
      router.replace("/authentication/sign-in?next=/checkout");
    }
  }, [authLoading, user, router]);

  const userCartRows = useMemo((): Database["public"]["Tables"]["add_to_carts"]["Row"][] => {
    if (user === null) {
      return [];
    }
    return add_to_carts.filter((row) => row.user_id === user.id);
  }, [add_to_carts, user]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateCart(): Promise<void> {
      if (user === null || userCartRows.length === 0) {
        setCartLines([]);
        setCartHydrateError(null);
        return;
      }

      const productIds = Array.from(new Set(userCartRows.map((r) => r.product_id)));
      const colorIds = Array.from(
        new Set(userCartRows.map((r) => r.color_id).filter((v): v is string => typeof v === "string")),
      );
      const sizeIds = Array.from(
        new Set(userCartRows.map((r) => r.size_id).filter((v): v is string => typeof v === "string")),
      );

      const [productsRes, mediasRes, colorsRes, sizesRes] = await Promise.all([
        supabase.from("products").select("*").in("id", productIds),
        supabase.from("product_medias").select("product_id,media_url,arrangement").in("product_id", productIds),
        colorIds.length > 0
          ? supabase.from("product_colors").select("id,color").in("id", colorIds)
          : Promise.resolve({ data: [] as { id: string; color: string | null }[], error: null }),
        sizeIds.length > 0
          ? supabase.from("product_sizes").select("id,size").in("id", sizeIds)
          : Promise.resolve({ data: [] as { id: string; size: string | null }[], error: null }),
      ]);

      if (productsRes.error !== null) {
        if (!cancelled) {
          setCartHydrateError(productsRes.error.message);
        }
        return;
      }

      const products = (productsRes.data ?? []).reduce(
        (acc: Record<string, Database["public"]["Tables"]["products"]["Row"]>, p) => {
          acc[p.id] = p;
          return acc;
        },
        {},
      );

      const firstMediaByProduct: Record<string, string> = {};
      (mediasRes.data ?? [])
        .sort((a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0))
        .forEach((m) => {
          if (firstMediaByProduct[m.product_id] === undefined && typeof m.media_url === "string") {
            firstMediaByProduct[m.product_id] = m.media_url;
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

      const hydrated: CartLineViewModel[] = userCartRows.map((row) => {
        const product = products[row.product_id];
        const imageUrl =
          firstMediaByProduct[row.product_id] !== undefined
            ? firstMediaByProduct[row.product_id]
            : "/default-image.jpg";
        const colorText = row.color_id ? colorLabelById[row.color_id] : "";
        const sizeText = row.size_id ? sizeLabelById[row.size_id] : "";
        const variant = [colorText, sizeText].filter((x) => x.length > 0).join(" / ");

        const deletedAtIso = product !== undefined ? readDeletedAt(product) : null;
        const isDeleted = typeof deletedAtIso === "string" && deletedAtIso.length > 0;

        return {
          cartRowId: row.id,
          productId: row.product_id,
          name: product?.name ?? "Product",
          price: typeof product?.price === "number" ? product.price : 0,
          quantity: row.amount ?? 1,
          image: imageUrl,
          variant: variant.length > 0 ? variant : "默认规格",
          isDeleted,
        };
      });

      if (!cancelled) {
        setCartHydrateError(null);
        setCartLines(hydrated);
      }
    }

    void hydrateCart();
    return () => {
      cancelled = true;
    };
  }, [user, userCartRows]);

  const subtotal = useMemo(() => {
    return cartLines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  }, [cartLines]);

  const hasBlockingDeleted = useMemo(() => cartLines.some((l) => l.isDeleted), [cartLines]);

  const promoDiscountMyr =
    checkoutPromo !== null && Number.isFinite(checkoutPromo.discountAmountMyr)
      ? checkoutPromo.discountAmountMyr
      : 0;

  const addressCompleteForRates = useMemo((): boolean => {
    return (
      isNonEmptyString(address.firstName) &&
      isNonEmptyString(address.lastName) &&
      isNonEmptyString(address.address1) &&
      isNonEmptyString(address.city) &&
      isNonEmptyString(address.state) &&
      isNonEmptyString(address.postalCode) &&
      isNonEmptyString(address.country) &&
      isNonEmptyString(address.phone)
    );
  }, [address]);

  const selectedRate = useMemo((): DeliveryRateOption | null => {
    if (selectedServiceCode === null) {
      return null;
    }
    return deliveryRates.find((r) => r.serviceCode === selectedServiceCode) ?? null;
  }, [deliveryRates, selectedServiceCode]);

  const shippingMyr = selectedRate?.price ?? FLAT_SHIPPING_MYR;

  const grandTotal = Math.max(
    0,
    subtotal + shippingMyr - promoDiscountMyr
  );

  /** Fetch live courier rates when shipping address is complete (debounced). */
  useEffect(() => {
    if (user === null || !addressCompleteForRates || currentStep !== CheckoutStep.Shipping) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async (): Promise<void> => {
        setRatesLoading(true);
        setRatesError(null);
        try {
          const rates = await fetchDeliveryRates({
            userId: user.id,
            destination: {
              address1: address.address1.trim(),
              city: address.city.trim(),
              state: address.state.trim(),
              postcode: address.postalCode.trim(),
              country: address.country.trim(),
            },
          });
          if (cancelled) {
            return;
          }
          const options = rates.length > 0 ? rates : [buildFlatFallbackRate()];
          setDeliveryRates(options);
          setSelectedServiceCode((prev) => {
            if (prev !== null && options.some((o) => o.serviceCode === prev)) {
              return prev;
            }
            return options[0]?.serviceCode ?? null;
          });
        } catch (e) {
          if (cancelled) {
            return;
          }
          const fallback = buildFlatFallbackRate();
          setDeliveryRates([fallback]);
          setSelectedServiceCode(fallback.serviceCode);
          setRatesError(e instanceof Error ? e.message : "无法获取配送报价");
        } finally {
          if (!cancelled) {
            setRatesLoading(false);
          }
        }
      })();
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address, addressCompleteForRates, currentStep, user]);

  const handleAddressField = (field: keyof AddressFormState, value: string): void => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleShippingContinue = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setPrepareError(null);
    if (user === null) {
      return;
    }
    if (!isNonEmptyString(address.firstName) || !isNonEmptyString(address.lastName)) {
      setPrepareError("请填写收件人姓名。");
      return;
    }
    if (!isNonEmptyString(address.address1) || !isNonEmptyString(address.city)) {
      setPrepareError("请填写完整地址。");
      return;
    }
    if (!isNonEmptyString(address.phone)) {
      setPrepareError("请填写电话号码。");
      return;
    }
    if (hasBlockingDeleted) {
      setPrepareError("购物车包含已下架商品，请返回购物车移除后再结账。");
      return;
    }
    if (selectedServiceCode === null || selectedServiceCode.length === 0) {
      setPrepareError("请选择配送方式。");
      return;
    }

    setPreparingCheckout(true);
    try {
      const { shipping_address, shipping_address_structured } = buildShippingPayload(address);

      const pendingBody: Record<string, unknown> = {
        userId: user.id,
        shipping_address,
        shipping_address_structured,
      };
      if (checkoutPromo !== null) {
        pendingBody["promoCode"] = checkoutPromo.promoCode;
        pendingBody["promotionId"] = checkoutPromo.promotionId;
      }
      if (checkoutWarrantyCredit !== null) {
        pendingBody["warrantyCreditId"] = checkoutWarrantyCredit.creditId;
      }
      pendingBody["serviceCode"] = selectedServiceCode;

      const pendingRes = await fetch("/api/checkout/create-pending-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingBody),
      });
      const pendingJson = (await pendingRes.json()) as { orderId?: string; error?: string };
      if (!pendingRes.ok || typeof pendingJson.orderId !== "string") {
        setPrepareError(typeof pendingJson.error === "string" ? pendingJson.error : "无法创建待支付订单");
        return;
      }

      const piRes = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          orderId: pendingJson.orderId,
        }),
      });
      const piJson = (await piRes.json()) as { clientSecret?: string; error?: string };
      if (!piRes.ok || typeof piJson.clientSecret !== "string") {
        setPrepareError(typeof piJson.error === "string" ? piJson.error : "无法启动支付");
        return;
      }

      setOrderId(pendingJson.orderId);
      setClientSecret(piJson.clientSecret);
      setCurrentStep(CheckoutStep.Review);
      window.scrollTo(0, 0);
    } finally {
      setPreparingCheckout(false);
    }
  };

  const goToPreviousStep = (): void => {
    setCurrentStep(CheckoutStep.Shipping);
    setOrderId(null);
    setClientSecret(null);
    setPrepareError(null);
    window.scrollTo(0, 0);
  };

  const renderOrderSummary = (): React.ReactElement => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {cartLines.map((item) => (
            <div key={item.cartRowId} className="flex justify-between items-center">
              <div className="flex items-center min-w-0">
                <span className="font-medium text-gray-900 dark:text-white shrink-0">{item.quantity}x</span>
                <span className="ml-2 text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{item.name}</span>
              </div>
              <span className="text-gray-900 dark:text-white font-medium shrink-0">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">小计</span>
            <span className="text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              运费{selectedRate !== null ? `（${selectedRate.name}）` : ""}
            </span>
            <span className="text-gray-900 dark:text-white">{formatCurrency(shippingMyr)}</span>
          </div>
          {promoDiscountMyr > 0 ? (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>优惠码</span>
              <span>-{formatCurrency(promoDiscountMyr)}</span>
            </div>
          ) : null}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">总计</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderShippingForm = (): React.ReactElement => {
    return (
      <form onSubmit={(e) => void handleShippingContinue(e)}>
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <HiOutlineLocationMarker className="mr-2 h-6 w-6" />
            配送信息
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ship-firstName">名</Label>
              <TextInput
                id="ship-firstName"
                value={address.firstName}
                onChange={(e) => handleAddressField("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ship-lastName">姓</Label>
              <TextInput
                id="ship-lastName"
                value={address.lastName}
                onChange={(e) => handleAddressField("lastName", e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="ship-address1">地址行 1</Label>
              <TextInput
                id="ship-address1"
                value={address.address1}
                onChange={(e) => handleAddressField("address1", e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="ship-address2">地址行 2（可选）</Label>
              <TextInput
                id="ship-address2"
                value={address.address2}
                onChange={(e) => handleAddressField("address2", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ship-city">城市</Label>
              <TextInput
                id="ship-city"
                value={address.city}
                onChange={(e) => handleAddressField("city", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ship-state">州 / 省</Label>
              <TextInput
                id="ship-state"
                value={address.state}
                onChange={(e) => handleAddressField("state", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ship-postal">邮政编码</Label>
              <TextInput
                id="ship-postal"
                value={address.postalCode}
                onChange={(e) => handleAddressField("postalCode", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ship-country">国家</Label>
              <TextInput
                id="ship-country"
                value={address.country}
                onChange={(e) => handleAddressField("country", e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="ship-phone">电话号码</Label>
              <TextInput
                id="ship-phone"
                type="tel"
                value={address.phone}
                onChange={(e) => handleAddressField("phone", e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        {addressCompleteForRates ? (
          <Card className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">配送方式</h2>
            {ratesLoading ? (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
                <Spinner size="sm" />
                <span>正在获取配送报价…</span>
              </div>
            ) : null}
            {ratesError !== null ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {ratesError}（已使用标准配送）
              </p>
            ) : null}
            <div className="space-y-3">
              {deliveryRates.map((option) => {
                const selected = selectedServiceCode === option.serviceCode;
                const eta = formatDeliveryEta(option.etaDays);
                return (
                  <button
                    key={option.serviceCode}
                    type="button"
                    onClick={() => setSelectedServiceCode(option.serviceCode)}
                    className={`w-full flex items-center justify-between gap-4 rounded-lg border p-4 text-left transition-colors ${
                      selected
                        ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{option.name}</p>
                      {eta.length > 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{eta}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(option.price)}
                      </span>
                      <span
                        className={`inline-block h-5 w-5 rounded-full border-2 ${
                          selected ? "border-blue-600 bg-blue-600" : "border-gray-300 dark:border-gray-600"
                        }`}
                        aria-hidden
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        ) : null}

        {prepareError !== null ? (
          <Alert color="failure" className="mb-4">
            {prepareError}
          </Alert>
        ) : null}
        <div className="flex justify-end">
          <Button
            type="submit"
            color="blue"
            disabled={
              preparingCheckout ||
              cartLines.length === 0 ||
              hasBlockingDeleted ||
              ratesLoading ||
              selectedServiceCode === null
            }
          >
            {preparingCheckout ? (
              <>
                <Spinner size="sm" className="mr-2" />
                准备付款…
              </>
            ) : (
              "继续付款"
            )}
          </Button>
        </div>
      </form>
    );
  };

  const renderReview = (): React.ReactElement => {
    return (
      <>
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <HiOutlineDocumentText className="mr-2 h-6 w-6" />
            确认并付款
          </h2>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 mb-6">
            <p>
              <span className="font-medium text-gray-900 dark:text-white">收件人：</span>
              {address.firstName} {address.lastName}
            </p>
            <p>{address.address1}</p>
            {address.address2.trim().length > 0 ? <p>{address.address2}</p> : null}
            <p>
              {address.city}, {address.state} {address.postalCode}
            </p>
            <p>{address.country}</p>
            <p>{address.phone}</p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">商品</h3>
            <div className="space-y-4">
              {cartLines.map((item) => (
                <div key={item.cartRowId} className="flex items-start gap-3">
                  <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-gray-100">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">规格：{item.variant}</p>
                    <p className="text-sm mt-1">
                      {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start mb-6">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mr-2"
            />
            <Label htmlFor="terms" className="text-sm">
              我同意{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                服务条款
              </Link>{" "}
              和{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                隐私政策
              </Link>
            </Label>
          </div>

          {stripePromise === null ? (
            <Alert color="failure">缺少 Stripe 配置（NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY）。</Alert>
          ) : clientSecret !== null && orderId !== null ? (
            agreeToTerms ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutStripePaymentInner orderId={orderId} />
              </Elements>
            ) : (
              <Alert color="warning">请勾选同意服务条款与隐私政策后再付款。</Alert>
            )
          ) : (
            <Alert color="failure">无法加载支付表单，请返回上一步重试。</Alert>
          )}
        </Card>
        <div className="flex justify-between">
          <Button type="button" color="light" onClick={goToPreviousStep}>
            <HiOutlineChevronLeft className="mr-2 h-5 w-5" />
            返回配送
          </Button>
        </div>
      </>
    );
  };

  if (authLoading || cartLoading) {
    return (
      <>
        <NavbarHome />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (user === null) {
    return null;
  }

  if (cartHydrateError !== null) {
    return (
      <>
        <NavbarHome />
        <div className="min-h-screen p-6">
          <Alert color="failure">{cartHydrateError}</Alert>
        </div>
      </>
    );
  }

  const awaitingCartHydration = userCartRows.length > 0 && cartLines.length === 0;
  if (awaitingCartHydration) {
    return (
      <>
        <NavbarHome />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (userCartRows.length === 0 || cartLines.length === 0) {
    return (
      <>
        <NavbarHome />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-4">购物车是空的。</p>
            <Link href="/cart" className="text-blue-600 hover:underline">
              返回购物车
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!isEnabled("cart")) {
    return null;
  }

  return (
    <>
      <NavbarHome />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/cart" className="inline-flex items-center text-blue-600 hover:underline">
              <HiOutlineChevronLeft className="mr-2 h-5 w-5" />
              返回购物车
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <HiOutlineShoppingCart className="mr-3 h-8 w-8" />
            结账
          </h1>

          <div className="mb-8">
            <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
              {[
                { key: CheckoutStep.Shipping, label: "配送" },
                { key: CheckoutStep.Review, label: "付款" },
              ].map((step, index) => {
                const isActive = currentStep === step.key;
                const isPassed = currentStep === CheckoutStep.Review && step.key === CheckoutStep.Shipping;
                return (
                  <li
                    key={step.key}
                    className={`flex md:w-full items-center ${isPassed ? "text-blue-600 dark:text-blue-500" : ""} ${
                      isActive ? "text-blue-600 dark:text-blue-500" : ""
                    } after:content-[""] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700 last:after:hidden`}>
                    <span
                      className={`flex items-center justify-center w-8 h-8 ${
                        isPassed || isActive ? "bg-blue-100 dark:bg-blue-800" : "bg-gray-100 dark:bg-gray-700"
                      } rounded-full shrink-0`}>
                      {isPassed ? (
                        <svg
                          className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 16 12">
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M1 5.917 5.724 10.5 15 1.5"
                          />
                        </svg>
                      ) : (
                        <span className={isActive ? "text-blue-600 dark:text-blue-500" : ""}>{index + 1}</span>
                      )}
                    </span>
                    <span className="hidden sm:inline-flex sm:ml-2">{step.label}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {currentStep === CheckoutStep.Shipping ? renderShippingForm() : null}
              {currentStep === CheckoutStep.Review ? renderReview() : null}
            </div>
            <div className="lg:col-span-1">
              <Card>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">订单摘要</h2>
                {renderOrderSummary()}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
