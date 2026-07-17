"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "flowbite-react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import NavbarHome from "@/components/navbar-home";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/utils/supabaseClient";
import type { Database } from "@/database.types";
import { formatCurrency } from "@/utils/pointsConfig";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { evaluateClaimEligibility, isOrderDelivered } from "@/modules/claims/claimEligibility";
import { claimPolicyConfig } from "@/modules/claims/claimPolicyConfig";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

interface OrderItemWithProduct extends OrderItemRow {
  product: { id: string; name: string; price: number } | null;
  color: { id: string; color: string } | null;
  size: { id: string; size: string } | null;
}

interface OrderDetail extends OrderRow {
  items: OrderItemWithProduct[];
}

/**
 * Resolves dynamic route param `orderId` to a single string (UUID).
 */
function useOrderIdParam(): string {
  const params = useParams();
  return useMemo(() => {
    const raw = params.orderId;
    if (typeof raw === "string") {
      return raw;
    }
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
      return raw[0];
    }
    return "";
  }, [params.orderId]);
}

/** Five stages shown when the order has a tracking number (DB status drives the highlight). */
const SHIPMENT_TIMELINE_LABELS: readonly string[] = ["已下单", "处理中", "待取件", "运输中", "已送达"];

/**
 * Maps `orders.status` to the active step index for the shipment timeline (0–4). Cancelled → -1.
 */
function getShipmentTimelineStepIndex(status: string | null): number {
  const key = (status ?? "").trim().toLowerCase();
  switch (key) {
    case "pending":
      return 0;
    case "processing":
      return 1;
    case "awaiting_pickup":
      return 2;
    case "shipped":
      return 3;
    case "delivered":
    case "completed":
      return 4;
    case "cancelled":
      return -1;
    default:
      return 1;
  }
}

/**
 * Short headline under the timeline for orders with tracking.
 */
function getShipmentTimelineSubtitle(status: string | null): string {
  const key = (status ?? "").trim().toLowerCase();
  switch (key) {
    case "pending":
      return "等待付款";
    case "processing":
      return "订单处理中";
    case "awaiting_pickup":
      return "等待快递员取件";
    case "shipped":
      return "包裹运输中";
    case "delivered":
    case "completed":
      return "订单已送达";
    case "cancelled":
      return "订单已取消";
    default:
      return "处理中";
  }
}

/**
 * Status label when the order has no tracking row yet (list page–aligned).
 */
function getOrderStatusLabelForDetail(status: string | null): string {
  const key = (status ?? "").trim().toLowerCase();
  switch (key) {
    case "pending":
      return "待付款";
    case "processing":
      return "处理中";
    case "awaiting_pickup":
      return "待取件";
    case "shipped":
      return "已发货";
    case "delivered":
      return "已完成";
    case "completed":
      return "已完成";
    case "cancelled":
      return "已取消";
    default:
      return "处理中";
  }
}

/**
 * Renders the five-step shipment timeline when `tracking_number` is set (uses DB `status` only).
 */
function ShipmentTimelineCard(props: { status: string | null }): React.ReactElement {
  const activeStep = getShipmentTimelineStepIndex(props.status);
  if (activeStep === -1) {
    return (
      <div className="card-panel p-5">
        <p className="text-center text-red-600 font-medium">订单已取消</p>
      </div>
    );
  }
  return (
    <div className="card-panel p-5">
      <div className="flex justify-between text-[10px] sm:text-xs text-center gap-0.5 sm:gap-1 mb-3 px-0 sm:px-1">
        {SHIPMENT_TIMELINE_LABELS.map((label, i) => (
          <span
            key={label}
            className={
              i < activeStep
                ? "text-[var(--color-accent)] font-medium flex-1 min-w-0 leading-tight"
                : i === activeStep
                  ? "text-[var(--color-text)] font-semibold flex-1 min-w-0 leading-tight"
                  : "text-[var(--color-muted)] flex-1 min-w-0 leading-tight"
            }
          >
            {label}
          </span>
        ))}
      </div>
      <div className="relative flex items-center justify-between px-0 sm:px-1">
        <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-gray-100 -translate-y-1/2 -z-10" />
        {SHIPMENT_TIMELINE_LABELS.map((_, i) => (
          <div
            key={`dot-${String(i)}`}
            className={
              i < activeStep
                ? "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[var(--color-accent)] ring-2 ring-white shrink-0 z-0"
                : i === activeStep
                  ? "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-accent)]/25 shrink-0 z-0"
                  : "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-200 ring-2 ring-white shrink-0 z-0"
            }
          />
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="font-display text-lg text-[var(--color-text)]">
          {getShipmentTimelineSubtitle(props.status)}
        </p>
      </div>
    </div>
  );
}

const OrderDetailPage = (): React.ReactElement => {
  const orderId = useOrderIdParam();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const claimsEnabled = isEnabled("claims");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [fetchLoading, setFetchLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user === null) {
      router.replace("/authentication/sign-in?next=/order-details");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || user === null) {
      return;
    }

    if (orderId.length === 0) {
      router.push("/settings");
      setFetchLoading(false);
      return;
    }

    let cancelled = false;

    const fetchOrderDetails = async (): Promise<void> => {
      setFetchLoading(true);
      setLoadError(null);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (orderError !== null) {
        setLoadError(orderError.message);
        setOrder(null);
        setFetchLoading(false);
        return;
      }

      if (orderData === null) {
        setOrder(null);
        setLoadError(null);
        setFetchLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(
          `*, product:products(id, name, price), color:product_colors(id, color), size:product_sizes(id, size)`,
        )
        .eq("order_id", orderId)
        .is("deleted_at", null);

      if (cancelled) {
        return;
      }

      if (itemsError !== null) {
        setLoadError(itemsError.message);
        setOrder(null);
        setFetchLoading(false);
        return;
      }

      setOrder({ ...orderData, items: itemsData ?? [] });
      setFetchLoading(false);
    };

    void fetchOrderDetails();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, orderId, router]);

  if (authLoading || user === null) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center pb-24">
        <NavbarHome />
        <Spinner size="lg" />
      </div>
    );
  }

  if (orderId.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center pb-24">
        <NavbarHome />
        <Spinner size="lg" />
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <NavbarHome />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-[var(--color-muted)]">
          <Spinner size="lg" className="mb-4" />
          <span>正在加载订单详情...</span>
        </div>
      </div>
    );
  }

  if (loadError !== null) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <NavbarHome />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
          <p className="text-red-600 mb-4 text-center">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              router.push("/order-details");
            }}
            className="btn-primary px-6 py-2 rounded-xl text-sm font-medium"
          >
            返回订单列表
          </button>
        </div>
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <NavbarHome />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
          <p className="text-[var(--color-muted)] mb-4 text-center">找不到该订单。</p>
          <button
            type="button"
            onClick={() => {
              router.push("/order-details");
            }}
            className="btn-primary px-6 py-2 rounded-xl text-sm font-medium"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  const totalItems = order.items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24">
      <NavbarHome />

      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center px-4 border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => {
            router.push("/order-details");
          }}
          className="text-[var(--color-text)] text-sm font-medium flex items-center shrink-0"
        >
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          我的订单
        </button>
        <h1 className="flex-1 text-center font-display text-lg tracking-wide pr-16">订单详情</h1>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Status: 5-step timeline when tracking exists; otherwise simple status */}
        {order.tracking_number !== null && order.tracking_number.length > 0 ? (
          <ShipmentTimelineCard status={order.status} />
        ) : (
          <div className="card-panel p-5">
            <div className="text-center">
              <p className="font-display text-lg text-[var(--color-text)]">
                {getOrderStatusLabelForDetail(order.status)}
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">发货后将显示物流进度</p>
            </div>
          </div>
        )}

        {/* Order Info */}
        <div className="card-panel p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">订单信息</h2>
            <span className="text-xs text-[var(--color-muted)]">
              {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="text-sm text-[var(--color-text)] mb-2">
            <span className="text-[var(--color-muted)] mr-2">订单号:</span>
            <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          {order.shipping_address && (
            <div className="text-sm text-[var(--color-text)] mt-4">
              <span className="block text-[var(--color-muted)] mb-1">配送地址:</span>
              <p className="leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                {order.shipping_address}
              </p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="card-panel p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4">商品 ({totalItems} 件)</h2>
          {claimsEnabled && isOrderDelivered(order.status) ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[var(--color-muted)]">选择需要报修的商品（可多选）</p>
              {selectedItemIds.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    router.push(
                      `/my-claims/new?orderId=${encodeURIComponent(order.id)}&orderItemIds=${selectedItemIds.map(encodeURIComponent).join(",")}`
                    );
                  }}
                  className="text-xs font-medium bg-black text-white rounded-full px-4 py-2"
                >
                  报告问题 ({selectedItemIds.length})
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0"
              >
                {claimsEnabled && isOrderDelivered(order.status) ? (
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItemIds((prev) => [...prev, item.id]);
                        } else {
                          setSelectedItemIds((prev) => prev.filter((id) => id !== item.id));
                        }
                      }}
                      aria-label={`选择 ${item.product?.name ?? "商品"}`}
                    />
                  </div>
                ) : null}
                <div className="flex-1">
                  <h4 className="font-medium text-[var(--color-text)] text-sm mb-1">
                    {item.product?.name || "商品"}
                  </h4>
                  <div className="text-xs text-[var(--color-muted)]">
                    {item.color && <span>颜色: {item.color.color}</span>}
                    {item.color && item.size && <span> | </span>}
                    {item.size && <span>尺码: {item.size.size}</span>}
                  </div>
                  <p className="text-xs text-[var(--color-text)] mt-2">数量: {item.amount || 0}</p>
                  {claimsEnabled && isOrderDelivered(order.status) ? (
                    <div className="mt-3">
                      {(() => {
                        const defaultType = claimPolicyConfig.claimTypes[0]?.key ?? "manufacturing_defect";
                        const eligibility = evaluateClaimEligibility(
                          defaultType,
                          order.status,
                          order.created_at
                        );
                        return (
                          <p className={`text-xs ${eligibility.eligible ? "text-green-600" : "text-[var(--color-muted)]"}`}>
                            {eligibility.eligible ? eligibility.reason : "该商品暂不可申请"}
                          </p>
                        );
                      })()}
                    </div>
                  ) : null}
                </div>
                <div className="text-right flex flex-col justify-end">
                  <p className="font-medium text-[var(--color-text)] text-sm">
                    {item.product?.price
                      ? formatCurrency(item.product.price * (item.amount || 0))
                      : "RM 0.00"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="card-panel p-5 mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4">金额详情</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>商品小计</span>
              <span>
                {typeof order.total_amount === "number" ? formatCurrency(order.total_amount) : "RM 0.00"}
              </span>
            </div>
            {order.points_earned && order.points_earned > 0 && (
              <div className="flex justify-between text-green-600">
                <span>订单积分奖励</span>
                <span>+{order.points_earned} 积分</span>
              </div>
            )}
            {order.points_spent && order.points_spent > 0 && (
              <div className="flex justify-between text-red-500">
                <span>积分抵扣</span>
                <span>-{order.points_spent} 积分</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[var(--color-text)] text-base pt-3 border-t border-[var(--color-border)] mt-3">
              <span>实付金额</span>
              <span>
                {typeof order.total_amount === "number" ? formatCurrency(order.total_amount) : "RM 0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
