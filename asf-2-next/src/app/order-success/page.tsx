"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuthContext } from "@/context/AuthContext";
import type { Database } from "@/database.types";
import { formatCurrency } from "@/utils/pointsConfig";
import { supabase } from "@/utils/supabaseClient";

import { isUuid } from "@/utils/uuid";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

const FALLBACK_TIMEOUT_MS = 10_000;

/**
 * Matches webhook display format: first 8 hex chars of order UUID, uppercased.
 */
function shortOrderRef(orderId: string): string {
  return orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function LoadingDots(): React.ReactElement {
  return (
    <div className="flex items-center justify-center py-12 gap-1.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * Order success: waits for webhook to set order status to `processing`, with Realtime + 10s fallback.
 */
function OrderSuccessInner(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("order_id");
  const paymentIntentId = searchParams.get("payment_intent");

  const { user, loading: authLoading } = useAuthContext();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const orderIdValid = useMemo(() => {
    return typeof orderIdParam === "string" && isUuid(orderIdParam);
  }, [orderIdParam]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user === null) {
      router.replace("/authentication/sign-in?next=/order-success");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || user === null) {
      return;
    }
    if (typeof orderIdParam !== "string" || !isUuid(orderIdParam)) {
      return;
    }
    const orderId: string = orderIdParam;
    const userId = user.id;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) {
        setTimedOut(true);
      }
    }, FALLBACK_TIMEOUT_MS);

    async function loadOrder(): Promise<void> {
      const { data, error: qErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) {
        return;
      }
      if (qErr !== null) {
        setLoadError(qErr.message);
        return;
      }
      if (data === null) {
        setLoadError("找不到该订单。");
        return;
      }
      if (data.user_id !== userId) {
        setLoadError("无权查看该订单。");
        return;
      }
      if (data.status === "processing") {
        setOrder(data);
      }
    }

    void loadOrder();

    const channel = supabase
      .channel(`order-success:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new === null || typeof payload.new !== "object") {
            return;
          }
          const row = payload.new as OrderRow;
          if (row.status === "processing") {
            setOrder(row);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [authLoading, user, orderIdParam]);

  if (authLoading) {
    return <LoadingDots />;
  }

  if (user === null) {
    return <LoadingDots />;
  }

  if (!orderIdValid) {
    return (
      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16 min-h-screen flex flex-col justify-center px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">缺少有效的订单参数。</p>
          <Link href="/" className="text-blue-600 hover:underline">
            返回首页
          </Link>
        </div>
      </section>
    );
  }

  if (loadError !== null) {
    return (
      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16 min-h-screen flex flex-col justify-center px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{loadError}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            返回首页
          </Link>
        </div>
      </section>
    );
  }

  if (order !== null) {
    const ref = shortOrderRef(order.id);
    const total =
      typeof order.total_amount === "number" && Number.isFinite(order.total_amount)
        ? order.total_amount
        : 0;
    return (
      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16 min-h-screen flex flex-col justify-center px-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl mb-2">感谢您的订购！</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 md:mb-8">
            订单{" "}
            <span className="font-medium text-gray-900 dark:text-white" data-testid="order-ref">
              #{ref}
            </span>{" "}
            已确认。我们将在工作日尽快处理并发货。
          </p>
          {typeof paymentIntentId === "string" && paymentIntentId.length > 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 break-all">付款参考：{paymentIntentId}</p>
          ) : null}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800 mb-8">
            <dl className="sm:flex items-center justify-between gap-4">
              <dt className="font-normal mb-1 sm:mb-0 text-gray-500 dark:text-gray-400">金额</dt>
              <dd className="font-medium text-gray-900 dark:text-white sm:text-end">{formatCurrency(total)}</dd>
            </dl>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/order-details"
              className="inline-flex items-center justify-center py-2.5 px-5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700">
              查看订单
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center py-2.5 px-5 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
              继续购物
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (timedOut) {
    return (
      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16 min-h-screen flex flex-col justify-center px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl mb-2">付款已收到</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            我们正在确认您的订单。请留意通知中心的订单确认消息。
          </p>
          <Link href="/notifications" className="text-blue-600 hover:underline mr-4">
            查看通知
          </Link>
          <Link href="/" className="text-blue-600 hover:underline">
            返回首页
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16 min-h-screen flex flex-col justify-center px-4">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">正在确认订单…</p>
        <LoadingDots />
      </div>
    </section>
  );
}

export default function OrderSuccessPage(): React.ReactElement {
  return (
    <Suspense fallback={<LoadingDots />}>
      <OrderSuccessInner />
    </Suspense>
  );
}
