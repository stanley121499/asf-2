"use client";
import React from "react";
import NavbarHome from "@/components/navbar-home";
import { useRouter, useSearchParams } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi";
import BottomNavbar from "@/components/home/bottom-nav";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: "info" | "success" | "warning" | "error";
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "新品提醒",
    message: "快来查看我们最新的夏季系列",
    timestamp: "2小时前",
    isRead: false,
    type: "info"
  },
  {
    id: "2",
    title: "订单确认",
    message: "您的订单 #12345 已确认",
    timestamp: "1天前",
    isRead: false,
    type: "success"
  },
  {
    id: "3",
    title: "特别优惠",
    message: "所有运动器材享八折优惠",
    timestamp: "2天前",
    isRead: true,
    type: "warning"
  },
  {
    id: "4",
    title: "付款失败",
    message: "您最近的付款无法处理",
    timestamp: "3天前",
    isRead: true,
    type: "error"
  }
];

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/';

  return (
    <div className="min-h-screen bg-white pb-24">
      <NavbarHome />
      
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center px-4 border-b border-[var(--color-border)]">
        <button onClick={() => router.push(from)} className="text-[var(--color-text)] text-sm font-medium flex items-center shrink-0">
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          返回
        </button>
        <h1 className="flex-1 text-center font-display text-lg tracking-wide pr-16">
          通知
        </h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {mockNotifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-start justify-between py-4 border-b border-[var(--color-border)] last:border-0 relative"
          >
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                {!notification.isRead && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                )}
                <h3 className="font-medium text-sm text-[var(--color-text)]">{notification.title}</h3>
              </div>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-2">{notification.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default NotificationsPage;