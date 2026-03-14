"use client";
import React from "react";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import type { Tables } from "@/database.types";

/**
 * Stub OrdersList — shows user's orders in the settings page.
 * Full admin-order-list logic is in /app/orders/page.tsx.
 */
const OrdersList: React.FC = () => {
  const { user } = useAuthContext();

  if (!user) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>请先登录以查看您的订单。</p>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-gray-600 dark:text-gray-300 mb-4">查看您的完整订单历史。</p>
      <Link
        href="/order-details"
        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        查看所有订单
      </Link>
    </div>
  );
};

export default OrdersList;
