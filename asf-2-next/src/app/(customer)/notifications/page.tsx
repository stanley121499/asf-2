"use client";

import React, { Suspense, useEffect } from "react";
import NavbarHome from "@/components/navbar-home";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineBell,
  HiOutlineExclamationCircle,
  HiOutlineQuestionMarkCircle,
  HiOutlineShoppingBag,
} from "react-icons/hi";
import BottomNavbar from "@/components/home/bottom-nav";
import { Spinner } from "flowbite-react";
import { useAuthContext } from "@/context/AuthContext";
import { useNotificationContext } from "@/context/NotificationContext";
import type { NotificationRow } from "@/context/NotificationContext";

/**
 * Formats an ISO timestamp as a short relative string (Chinese).
 */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) {
    return "刚刚";
  }
  if (diffMins < 60) {
    return `${diffMins}分钟前`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}天前`;
  }
  return new Date(iso).toLocaleDateString("zh-CN");
}

/**
 * Picks icon and colour classes for a notification `type` value.
 */
function notificationTypeIcon(type: string): { icon: React.ReactNode; className: string } {
  switch (type) {
    case "order_confirmed":
      return {
        icon: <HiOutlineShoppingBag className="h-5 w-5" aria-hidden />,
        className: "text-green-500",
      };
    case "payment_failed":
    case "order_fulfillment_error":
      return {
        icon: <HiOutlineExclamationCircle className="h-5 w-5" aria-hidden />,
        className: "text-red-500",
      };
    case "ticket_created":
      return {
        icon: <HiOutlineQuestionMarkCircle className="h-5 w-5" aria-hidden />,
        className: "text-blue-500",
      };
    default:
      return {
        icon: <HiOutlineBell className="h-5 w-5" aria-hidden />,
        className: "text-gray-400",
      };
  }
}

/**
 * Customer notifications list: Supabase-backed rows, mark read on row tap, mark all in header.
 */
function NotificationsPageInner(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";
  const { user, loading: authLoading } = useAuthContext();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotificationContext();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user === null) {
      router.replace("/authentication/sign-in?next=/notifications");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white pb-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white pb-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const showListSpinner = loading;

  return (
    <div className="min-h-screen bg-white pb-24">
      <NavbarHome />

      <div className="sticky top-0 z-40 flex h-[56px] items-center border-b border-[var(--color-border)] bg-white px-4">
        <button
          type="button"
          onClick={() => router.push(from)}
          className="flex shrink-0 items-center text-sm font-medium text-[var(--color-text)]"
        >
          <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
          返回
        </button>
        <h1 className="flex-1 text-center font-display text-lg tracking-wide">通知</h1>
        <div className="flex w-20 shrink-0 justify-end">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                void markAllAsRead();
              }}
              className="text-xs font-medium text-[var(--color-accent)]"
            >
              全部已读
            </button>
          ) : null}
        </div>
      </div>

      {showListSpinner ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex justify-center py-16 text-sm text-[var(--color-muted)]">暂无通知</div>
      ) : (
        <div className="space-y-0 px-4 py-4">
          {notifications.map((notification: NotificationRow) => {
            const unread = notification.read_at === null;
            const { icon, className: iconColor } = notificationTypeIcon(notification.type);
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => {
                  if (unread) {
                    void markAsRead(notification.id);
                  }
                }}
                className="relative flex w-full items-start border-b border-[var(--color-border)] py-4 text-left last:border-0"
              >
                <div className={`mr-3 shrink-0 pt-0.5 ${iconColor}`}>{icon}</div>
                <div className="min-w-0 flex-1 pr-2">
                  <div className="mb-1 flex items-center gap-2">
                    {unread ? (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-red-500"
                        aria-hidden
                      />
                    ) : null}
                    <h3 className="text-sm font-medium text-[var(--color-text)]">
                      {notification.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                    {notification.body}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {relativeTime(notification.created_at)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <BottomNavbar />
    </div>
  );
}

/**
 * Suspense boundary for `useSearchParams` (Next.js App Router).
 */
export default function NotificationsPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white pb-24">
          <Spinner size="lg" />
        </div>
      }
    >
      <NotificationsPageInner />
    </Suspense>
  );
}
