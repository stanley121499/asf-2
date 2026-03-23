"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi";
import NavbarHome from "@/components/navbar-home";
import { supabase } from "@/utils/supabaseClient";
import type { Database } from "@/database.types";
import { formatCurrency } from "@/utils/pointsConfig";

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

const OrderDetailPage = () => {
  const params = useParams();
  const orderId = params.orderId as string;
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        router.push("/settings");
        return;
      }
      try {
        setLoading(true);
        const { data: orderData, error: orderError } = await supabase
          .from("orders").select("*").eq("id", orderId).single();

        if (orderError || !orderData) throw new Error(orderError?.message || "Order not found");

        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(`*, product:products(id, name, price), color:product_colors(id, color), size:product_sizes(id, size)`)
          .eq("order_id", orderId);

        if (itemsError) throw new Error(itemsError.message);

        setOrder({ ...orderData, items: itemsData || [] });
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <NavbarHome />
        <div className="flex-1 flex justify-center py-20 text-[var(--color-muted)]">正在加载订单详情...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <NavbarHome />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <p className="text-[var(--color-muted)] mb-4">未找到订单</p>
          <button onClick={() => router.push("/settings")} className="btn-primary px-6 py-2 rounded-xl text-sm font-medium">返回设置</button>
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
        <button onClick={() => router.push('/settings')} className="text-[var(--color-text)] text-sm font-medium flex items-center shrink-0">
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          我的订单
        </button>
        <h1 className="flex-1 text-center font-display text-lg tracking-wide pr-16">
          订单详情
        </h1>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Status Tracker */}
        <div className="card-panel p-5">
          <div className="flex items-center justify-between text-xs text-[var(--color-muted)] font-medium px-4 mb-2">
            <span className="text-[var(--color-accent)]">已下单</span>
            <span>处理中</span>
            <span>已发货</span>
          </div>
          <div className="relative flex items-center justify-between px-8">
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gray-100 -translate-y-1/2 -z-10" />
            <div className="w-3 h-3 rounded-full bg-[var(--color-accent)] ring-4 ring-white" />
            <div className="w-3 h-3 rounded-full bg-gray-200 ring-4 ring-white" />
            <div className="w-3 h-3 rounded-full bg-gray-200 ring-4 ring-white" />
          </div>
          <div className="mt-4 text-center">
            <p className="font-display text-lg text-[var(--color-text)]">订单处理中</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">预计在1-2个工作日内发货</p>
          </div>
        </div>

        {/* Order Info */}
        <div className="card-panel p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">订单信息</h2>
            <span className="text-xs text-[var(--color-muted)]">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div className="text-sm text-[var(--color-text)] mb-2">
            <span className="text-[var(--color-muted)] mr-2">订单号:</span>
            <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          {order.shipping_address && (
            <div className="text-sm text-[var(--color-text)] mt-4">
              <span className="block text-[var(--color-muted)] mb-1">配送地址:</span>
              <p className="leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">{order.shipping_address}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="card-panel p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4">商品 ({totalItems} 件)</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-4 border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
                 <div className="flex-1">
                   <h4 className="font-medium text-[var(--color-text)] text-sm mb-1">{item.product?.name || "商品"}</h4>
                   <div className="text-xs text-[var(--color-muted)]">
                     {item.color && <span>颜色: {item.color.color}</span>}
                     {item.color && item.size && <span> | </span>}
                     {item.size && <span>尺码: {item.size.size}</span>}
                   </div>
                   <p className="text-xs text-[var(--color-text)] mt-2">数量: {item.amount || 0}</p>
                 </div>
                 <div className="text-right flex flex-col justify-end">
                   <p className="font-medium text-[var(--color-text)] text-sm">
                     {item.product?.price ? formatCurrency(item.product.price * (item.amount || 0)) : "RM 0.00"}
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
              <span>{typeof order.total_amount === "number" ? formatCurrency(order.total_amount) : "RM 0.00"}</span>
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
              <span>{typeof order.total_amount === "number" ? formatCurrency(order.total_amount) : "RM 0.00"}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailPage;