"use client";
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from "react";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { Button } from "flowbite-react";
import { supabase } from "@/utils/supabaseClient";
import { getDateRange } from "@/utils/analyticsDateRange";

/** Shape of the four dashboard KPI values. */
interface DashboardKpis {
  todayRevenue: number | null;
  pendingOrders: number | null;
  lowStockVariants: number | null;
  newCustomersThisWeek: number | null;
}

/**
 * Formats a number as Malaysian Ringgit with two decimal places and thousands
 * separators, e.g. 1234.5 → "RM 1,234.50".
 */
function formatRm(value: number): string {
  return `RM ${value.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const DashboardPage: React.FC = function () {
  const [kpis, setKpis] = useState<DashboardKpis>({
    todayRevenue: null,
    pendingOrders: null,
    lowStockVariants: null,
    newCustomersThisWeek: null,
  });
  const [loadingKpis, setLoadingKpis] = useState<boolean>(true);

  useEffect(() => {
    /** Fetches all four KPI values in parallel. */
    async function fetchKpis(): Promise<void> {
      setLoadingKpis(true);

      const { from: todayStart } = getDateRange("Today");
      const { from: weekStart } = getDateRange("This Week");

      const [revenueResult, pendingResult, stockResult, customersResult] =
        await Promise.all([
          // Today's revenue: sum total_amount of non-cancelled orders created today
          supabase
            .from("orders")
            .select("total_amount")
            .neq("status", "cancelled")
            .gte("created_at", todayStart.toISOString())
            .is("deleted_at", null),

          // Pending orders count
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending")
            .is("deleted_at", null),

          // Low stock variants: product_stock rows with count < 10
          supabase
            .from("product_stock")
            .select("id", { count: "exact", head: true })
            .lt("count", 10),

          // New customers registered this week
          supabase
            .from("user_details")
            .select("id", { count: "exact", head: true })
            .gte("created_at", weekStart.toISOString()),
        ]);

      // Aggregate revenue client-side (Supabase JS has no SUM built-in)
      const todayRevenue =
        revenueResult.error || !revenueResult.data
          ? 0
          : revenueResult.data.reduce<number>(
              (acc, row) => acc + (row.total_amount ?? 0),
              0
            );

      setKpis({
        todayRevenue,
        pendingOrders: pendingResult.error ? 0 : (pendingResult.count ?? 0),
        lowStockVariants: stockResult.error ? 0 : (stockResult.count ?? 0),
        newCustomersThisWeek: customersResult.error
          ? 0
          : (customersResult.count ?? 0),
      });

      setLoadingKpis(false);
    }

    void fetchKpis();
  }, []);

  return (
    <NavbarSidebarLayout>
      <div className="p-4 md:p-6">
        {/* KPI Cards */}
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {/* Today's Revenue */}
          <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Today&apos;s Revenue
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {loadingKpis
                ? "—"
                : kpis.todayRevenue === null
                  ? "—"
                  : formatRm(kpis.todayRevenue)}
            </p>
          </div>

          {/* Pending Orders */}
          <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Pending Orders
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {loadingKpis
                ? "—"
                : (kpis.pendingOrders ?? 0).toLocaleString()}
            </p>
          </div>

          {/* Low Stock Variants */}
          <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Low Stock Variants
            </p>
            <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">
              {loadingKpis
                ? "—"
                : (kpis.lowStockVariants ?? 0).toLocaleString()}
            </p>
          </div>

          {/* New Customers This Week */}
          <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              New Customers This Week
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {loadingKpis
                ? "—"
                : (kpis.newCustomersThisWeek ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Navigation buttons — kept from original dashboard */}
        <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
          <img
            alt="ASF logo"
            src="../../images/logo.svg"
            className="h-10"
          />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Links
          </h2>
          <Button className="homepage-button w-full" href="/posts/list">
            Setting Posts
          </Button>
          <Button className="homepage-button w-full" href="/products/list">
            Setting Products
          </Button>
          <Button className="homepage-button w-full" href="/stocks/overview">
            Setting Stocks
          </Button>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default function WrappedDashboardPage() {
  return <DashboardPage />;
}
