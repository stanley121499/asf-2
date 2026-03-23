import React, { useEffect, useMemo, useState } from "react";
import { useOrderContext } from "../../context/product/OrderContext";
import { useAuthContext } from "../../context/AuthContext";
import { useAddToCartContext } from "../../context/product/CartContext";
import { usePointsMembership } from "../../context/PointsMembershipContext";
import { HiCheckCircle } from "react-icons/hi";
import Link from "next/link";

interface Session {
  id: string;
  customer_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: Address;
  };
  payment_method_details?: {
    type?: string;
  };
  created?: number;
  shipping?: {
    address?: string;
  };
}
interface Address {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  postal_code?: string;
  state?: string;
}

/**
 * OrderSuccess
 *
 * Displays success details from Stripe session and idempotently persists the
 * order into Supabase through OrderContext. The cart is cleared only once per
 * Stripe session using a localStorage flag to prevent duplicates on refresh.
 */
const OrderSuccess: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const sessionId = new URLSearchParams(window.location.search).get(
    "session_id"
  );
  const mode = new URLSearchParams(window.location.search).get("mode");
  const { user } = useAuthContext();
  const { createOrderWithItemsAndStock } = useOrderContext();
  const { clearCartByUser } = useAddToCartContext();
  const pointsAPI = usePointsMembership();
  const storageKey = useMemo(() => (sessionId ? `order_processed_${sessionId}` : undefined), [sessionId]);
  const lockKey = useMemo(() => (sessionId ? `order_processing_${sessionId}` : undefined), [sessionId]);

  useEffect(() => {
    const fetchSession = async () => {
      if (sessionId) {
        let sessionData: Session | null = null;
        if (mode === "fake") {
          const local = localStorage.getItem(`fake_checkout_session_${sessionId}`);
          if (local) {
            try {
              sessionData = JSON.parse(local) as Session;
            } catch (e) {
              if (process.env.NODE_ENV === "development") {
                console.error(e);
              }
            }
          }
        } else {
        const response = await fetch(
          `https://asf-serverless-2.vercel.app/api/get-checkout-session?session_id=${sessionId}`
        );
          const respData = (await response.json()) as Session;
          sessionData = respData;
        }

        if (sessionData) {
          setSession(sessionData);

          // Persist order on first load only (idempotent via localStorage flag)
          if (storageKey) {
            const alreadyProcessed = Boolean(localStorage.getItem(storageKey));
            const alreadyProcessing = lockKey ? Boolean(localStorage.getItem(lockKey)) : false;
            if (!alreadyProcessed && !alreadyProcessing) {
              if (lockKey) {
                localStorage.setItem(lockKey, "true");
              }
              try {
                const rawCart = localStorage.getItem("cart") || "[]";
                const cartItems: Array<{ id: string; price: number; quantity: number; color_id?: string | null; size_id?: string | null; name?: string; media_url?: string; }> = JSON.parse(rawCart);
                
                // Get order metadata (points info)
                const orderMetadata = JSON.parse(localStorage.getItem("order_metadata") || "{}") as {
                  pointsUsed?: number;
                  pointsDiscount?: number;
                  pointsEarned?: number;
                  originalSubtotal?: number;
                  finalTotal?: number;
                };

                const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) / 100;
                const finalTotal = orderMetadata.finalTotal || totalAmount;
                const shippingAddress = sessionData.customer_details?.address
                  ? [
                      sessionData.customer_details?.address?.line1,
                      sessionData.customer_details?.address?.line2,
                      sessionData.customer_details?.address?.city,
                      sessionData.customer_details?.address?.state,
                      sessionData.customer_details?.address?.postal_code,
                      sessionData.customer_details?.address?.country,
                    ]
                      .filter((p: string | undefined) => typeof p === "string" && p.trim() !== "")
                      .join(", ")
                  : null;

                if (user && cartItems.length > 0) {
                  await createOrderWithItemsAndStock(
                    {
                      userId: user.id,
                      shippingAddress,
                      totalAmount: finalTotal,
                      pointsEarned: orderMetadata.pointsEarned || 0,
                      pointsSpent: orderMetadata.pointsUsed || 0,
                      discountType: orderMetadata.pointsUsed ? "points" : null,
                      discountedAmount: orderMetadata.pointsDiscount || 0,
                    },
                    cartItems.map((c) => ({
                      id: c.id,
                      price: c.price,
                      quantity: c.quantity,
                      color_id: c.color_id ?? null,
                      size_id: c.size_id ?? null,
                    }))
                  );

                  // Handle points updates
                  let currentUserPoints = await pointsAPI.getUserPointsByUserId(user.id);
                  
                  // Create user_points record if it doesn't exist
                  if (!currentUserPoints) {
                    try {
                      currentUserPoints = await pointsAPI.createUserPoints({
                        user_id: user.id,
                        amount: 0,
                      });
                    } catch (createError) {
                      // If creation fails (e.g., due to race condition), try fetching again
                      if (process.env.NODE_ENV === "development") {
                        console.warn("Failed to create user_points, attempting to fetch again:", createError);
                      }
                      currentUserPoints = await pointsAPI.getUserPointsByUserId(user.id);
                      if (!currentUserPoints) {
                        throw new Error("Unable to create or fetch user_points record");
                      }
                    }
                  }
                  
                  let newPointsAmount = currentUserPoints.amount || 0;
                  
                  // Deduct points if used for discount
                  if (orderMetadata.pointsUsed) {
                    newPointsAmount -= orderMetadata.pointsUsed;
                  }
                  
                  // Add points if earned
                  if (orderMetadata.pointsEarned) {
                    newPointsAmount += orderMetadata.pointsEarned;
                  }
                  
                  // Update user points
                  await pointsAPI.updateUserPoints(currentUserPoints.id, {
                    amount: newPointsAmount,
                  });
                  
                  // Log the points transaction
                  if (orderMetadata.pointsUsed || orderMetadata.pointsEarned) {
                    const pointsUsed = orderMetadata.pointsUsed || 0;
                    const pointsEarned = orderMetadata.pointsEarned || 0;
                    
                    await pointsAPI.createUserPointsLog({
                      point_id: currentUserPoints.id,
                      amount: pointsEarned > 0 ? pointsEarned : -pointsUsed,
                      type: pointsUsed > 0 ? "order_discount" : "order_earned",
                    });
                  }

                  // Clear DB-backed cart rows for this user
                  await clearCartByUser(user.id);
                  
                  // Also clear localStorage cart
                  localStorage.removeItem("cart");
                }

                // Clear local cart and order metadata only once
                localStorage.removeItem("cart");
                localStorage.removeItem("order_metadata");
              } catch (err) {
                if (process.env.NODE_ENV === "development") {
                  console.error(err);
                }
              } finally {
                if (storageKey) {
                  localStorage.setItem(storageKey, "true");
                }
                if (lockKey) {
                  localStorage.removeItem(lockKey);
                }
              }
            }
          }
        }
      }
    };

    fetchSession();
  }, [sessionId, mode, storageKey, lockKey, user, createOrderWithItemsAndStock, clearCartByUser, pointsAPI]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-transparent border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  const formatAddress = (address: Address): string => {
    const { line1 = "", line2 = "", city = "", state = "", postal_code = "", country = "" } = address;
    const addressParts = [line1, line2, city, state, postal_code, country].filter((part) => part && part.trim() !== "");
    return addressParts.join(", ");
  };

  const { customer_details, id, created } = session;
  const date = created ? new Date(created * 1000).toLocaleDateString() : "N/A";
  const customerName = customer_details?.name || "Customer";
  const address = session.customer_details?.address ? formatAddress(session.customer_details.address) : "N/A";
  const phone = session.customer_details?.phone || "N/A";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-lg mx-auto w-full">
        <HiCheckCircle className="w-20 h-20 text-green-500 mb-6" />
        <h1 className="font-display text-2xl text-[var(--color-text)] mb-2">订单已确认</h1>
        <p className="text-[var(--color-muted)] text-sm text-center mb-8">
          感谢您的购买，订单 <span className="font-medium text-[var(--color-text)]">#{id.slice(0, 8)}</span> 已收到，我们将尽快为您处理发货。
        </p>

        <div className="w-full card-panel p-6 mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4 border-b border-[var(--color-border)] pb-2">订单摘要</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">下单日期</span>
              <span className="font-medium text-[var(--color-text)]">{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">收件人</span>
              <span className="font-medium text-[var(--color-text)]">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">联系电话</span>
              <span className="font-medium text-[var(--color-text)]">{phone}</span>
            </div>
            <div className="pt-3 border-t border-[var(--color-border)]">
              <span className="block text-[var(--color-muted)] mb-1">配送地址</span>
              <span className="font-medium text-[var(--color-text)] leading-relaxed">{address}</span>
            </div>
          </div>
        </div>

        <Link href="/" className="w-full btn-primary py-4 rounded-xl text-center text-sm font-medium">
          返回首页继续选购
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
