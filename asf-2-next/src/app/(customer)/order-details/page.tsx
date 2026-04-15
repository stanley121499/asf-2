"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Alert, Spinner } from "flowbite-react";
import { HiOutlineArrowLeft, HiOutlineChevronRight } from "react-icons/hi";
import NavbarHome from "@/components/navbar-home";
import BottomNavbar from "@/components/home/bottom-nav";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/utils/supabaseClient";
import type { Database } from "@/database.types";
import { formatCurrency } from "@/utils/pointsConfig";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemNested = Pick<
  Database["public"]["Tables"]["order_items"]["Row"],
  "id" | "product_id"
>;

/** Row shape returned by the orders list query (nested order_items). */
type OrderListQueryRow = Pick<OrderRow, "id" | "created_at" | "status" | "total_amount"> & {
  order_items: OrderItemNested[] | null;
};

/** One row in the list UI: order fields plus resolved thumbnail URL. */
interface OrderListViewRow {
  id: string;
  created_at: string;
  status: string | null;
  total_amount: number | null;
  order_items: OrderItemNested[];
  thumbnailUrl: string | null;
}

/**
 * Maps order status to Chinese label and Tailwind classes (customer order list).
 */
function getStatusDisplay(status: string | null): { label: string; className: string } {
  const key = (status ?? "").trim().toLowerCase();
  switch (key) {
    case "pending":
      return {
        label: "待付款",
        className: "text-yellow-600 bg-yellow-50 border-yellow-200",
      };
    case "processing":
      return {
        label: "处理中",
        className: "text-blue-600 bg-blue-50 border-blue-200",
      };
    case "awaiting_pickup":
      return {
        label: "待取件",
        className: "text-purple-600 bg-purple-50 border-purple-200",
      };
    case "shipped":
      return {
        label: "已发货",
        className: "text-orange-600 bg-orange-50 border-orange-200",
      };
    case "delivered":
      return {
        label: "已完成",
        className: "text-green-600 bg-green-50 border-green-200",
      };
    case "cancelled":
      return {
        label: "已取消",
        className: "text-red-600 bg-red-50 border-red-200",
      };
    default:
      return {
        label: "处理中",
        className: "text-gray-600 bg-gray-50 border-gray-200",
      };
  }
}

/**
 * Picks the first line item's product_id (by order_items.id ascending) for thumbnail lookup.
 */
function pickFirstProductId(items: OrderItemNested[]): string | null {
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
  for (const row of sorted) {
    if (typeof row.product_id === "string" && row.product_id.length > 0) {
      return row.product_id;
    }
  }
  return null;
}

type MediaRow = Pick<
  Database["public"]["Tables"]["product_medias"]["Row"],
  "id" | "product_id" | "media_url" | "arrangement"
>;

/**
 * For each product_id, selects the media row with minimum arrangement (then id tie-break).
 */
function mapProductIdToThumbnailUrl(mediaRows: MediaRow[]): Map<string, string> {
  const best = new Map<string, MediaRow>();
  for (const row of mediaRows) {
    const prev = best.get(row.product_id);
    if (
      prev === undefined ||
      row.arrangement < prev.arrangement ||
      (row.arrangement === prev.arrangement && row.id < prev.id)
    ) {
      best.set(row.product_id, row);
    }
  }
  const urls = new Map<string, string>();
  best.forEach((row, productId) => {
    urls.set(productId, row.media_url);
  });
  return urls;
}

/**
 * Builds order id → thumbnail URL using first line item product and batch media map.
 */
function attachThumbnails(
  orders: OrderListQueryRow[],
  productIdToUrl: Map<string, string>,
): OrderListViewRow[] {
  return orders.map((o) => {
    const items = o.order_items ?? [];
    const pid = pickFirstProductId(items);
    const thumbnailUrl = pid !== null ? productIdToUrl.get(pid) ?? null : null;
    return {
      id: o.id,
      created_at: o.created_at,
      status: o.status,
      total_amount: o.total_amount,
      order_items: items,
      thumbnailUrl,
    };
  });
}

export default function OrderListPage(): React.ReactElement {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [orders, setOrders] = useState<OrderListViewRow[]>([]);
  const [listLoading, setListLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

    const userId = user.id;
    let cancelled = false;

    async function loadOrders(): Promise<void> {
      setListLoading(true);
      setLoadError(null);

      const { data: orderRows, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          id,
          created_at,
          status,
          total_amount,
          order_items ( id, product_id )
        `,
        )
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (cancelled) {
        return;
      }

      if (orderError !== null) {
        setLoadError(orderError.message);
        setOrders([]);
        setListLoading(false);
        return;
      }

      const raw: OrderListQueryRow[] = (orderRows ?? []) as OrderListQueryRow[];
      const productIds = new Set<string>();
      for (const o of raw) {
        const pid = pickFirstProductId(o.order_items ?? []);
        if (pid !== null) {
          productIds.add(pid);
        }
      }

      if (productIds.size === 0) {
        setOrders(attachThumbnails(raw, new Map()));
        setListLoading(false);
        return;
      }

      const { data: mediaRows, error: mediaError } = await supabase
        .from("product_medias")
        .select("id, product_id, media_url, arrangement")
        .in("product_id", Array.from(productIds));

      if (cancelled) {
        return;
      }

      if (mediaError !== null) {
        setLoadError(mediaError.message);
        setOrders([]);
        setListLoading(false);
        return;
      }

      const urlByProduct = mapProductIdToThumbnailUrl((mediaRows ?? []) as MediaRow[]);
      setOrders(attachThumbnails(raw, urlByProduct));
      setListLoading(false);
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-panel)] flex flex-col items-center justify-center pb-24">
        <NavbarHome />
        <Spinner size="lg" />
        <BottomNavbar />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="min-h-screen bg-[var(--color-panel)] flex flex-col items-center justify-center pb-24">
        <NavbarHome />
        <Spinner size="lg" />
        <BottomNavbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-panel)] pb-24 flex flex-col">
      <NavbarHome />

      <div className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] h-[56px] flex items-center px-4">
        <button
          type="button"
          onClick={() => {
            router.push("/settings");
          }}
          className="text-[var(--color-text)] text-sm font-medium flex items-center shrink-0"
        >
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          返回
        </button>
        <h1 className="flex-1 text-center font-display text-lg tracking-wide pr-14">我的订单</h1>
      </div>

      <div className="px-4 py-6 flex-1">
        {listLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : loadError !== null ? (
          <Alert color="failure">
            <span className="font-medium">加载失败</span> {loadError}
          </Alert>
        ) : orders.length === 0 ? (
          <div className="text-center mt-20">
            <h2 className="font-display text-xl text-[var(--color-text)] mb-2">暂无订单记录</h2>
            <button
              type="button"
              onClick={() => {
                router.push("/product-section");
              }}
              className="mt-6 text-[var(--color-accent)] font-medium bg-white border border-[var(--color-border)] rounded-full px-6 py-2"
            >
              去购物 →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const { label, className: statusColor } = getStatusDisplay(order.status);
              const refDisplay = `#${order.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
              const dateStr = new Date(order.created_at).toLocaleDateString("zh-CN");
              const itemCount = order.order_items.length;
              const total =
                typeof order.total_amount === "number" && Number.isFinite(order.total_amount)
                  ? order.total_amount
                  : 0;

              return (
                <div
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    router.push(`/order-details/${order.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/order-details/${order.id}`);
                    }
                  }}
                  className="bg-white border border-[var(--color-border)] rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                    {order.thumbnailUrl !== null && order.thumbnailUrl.length > 0 ? (
                      <Image
                        src={order.thumbnailUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-3 gap-2">
                      <span className="font-bold text-[var(--color-text)] truncate">{refDisplay}</span>
                      <span className={`text-xs px-2 py-1 rounded-full border shrink-0 ${statusColor}`}>
                        {label}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--color-muted)] mb-3">
                      {dateStr} · 共 {itemCount} 件商品
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="font-medium text-[var(--color-accent)]">{formatCurrency(total)}</span>
                      <HiOutlineChevronRight className="text-[var(--color-muted)] shrink-0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNavbar />
    </div>
  );
}
