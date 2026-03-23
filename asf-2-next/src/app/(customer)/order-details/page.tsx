"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { HiOutlineArrowLeft, HiOutlineChevronRight } from "react-icons/hi";
import NavbarHome from "@/components/navbar-home";
import BottomNavbar from "@/components/home/bottom-nav";

const mockOrders = [
  { id: "ORD-8821", date: "2026-03-18", status: "delivered", total: 89.97, items: 3 },
  { id: "ORD-8742", date: "2026-03-10", status: "shipped", total: 45.00, items: 1 },
  { id: "ORD-8633", date: "2026-02-28", status: "delivered", total: 124.50, items: 4 },
];

export default function OrderListPage() {
  const router = useRouter();
  const { user } = useAuthContext();

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-xl font-medium text-[var(--color-text)] mb-2">请先登录</h3>
        <button 
          onClick={() => router.push('/authentication/sign-in')}
          className="btn-primary rounded-xl px-8 py-3 max-w-[200px] w-full mt-4"
        >
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-panel)] pb-24 flex flex-col">
      <NavbarHome />

      <div className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] h-[56px] flex items-center px-4">
        <button onClick={() => router.push('/settings')} className="text-[var(--color-text)] text-sm font-medium flex items-center shrink-0">
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          返回
        </button>
        <h1 className="flex-1 text-center font-display text-lg tracking-wide pr-14">
          我的订单
        </h1>
      </div>

      <div className="px-4 py-6 flex-1">
        {mockOrders.length === 0 ? (
          <div className="text-center mt-20">
            <h2 className="font-display text-xl text-[var(--color-text)] mb-2">暂无订单记录</h2>
            <button 
              onClick={() => router.push('/product-section')}
              className="mt-6 text-[var(--color-accent)] font-medium bg-white border border-[var(--color-border)] rounded-full px-6 py-2"
            >
              去购物 →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {mockOrders.map(order => {
              let statusLabel = "";
              let statusColor = "";
              if (order.status === "delivered") {
                statusLabel = "已完成";
                statusColor = "text-green-600 bg-green-50 border-green-200";
              } else if (order.status === "shipped") {
                statusLabel = "已发货";
                statusColor = "text-[var(--color-accent)] bg-amber-50 border-amber-200";
              } else {
                statusLabel = "待处理";
                statusColor = "text-gray-600 bg-gray-50 border-gray-200";
              }

              return (
                <div 
                  key={order.id} 
                  onClick={() => router.push(`/order-details/${order.id}`)}
                  className="bg-white border border-[var(--color-border)] rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-[var(--color-text)]">{order.id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--color-muted)] mb-3">
                    {order.date} · 共 {order.items} 件商品
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="font-medium text-[var(--color-accent)]">RM {order.total.toFixed(2)}</span>
                    <HiOutlineChevronRight className="text-[var(--color-muted)]" />
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
