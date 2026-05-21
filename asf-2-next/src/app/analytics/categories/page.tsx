"use client";
import { AnalyticsContextBundle } from "@/context/RouteContextBundles";

/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import LineChart from "@/components/analytics/LineChart";
import { FiMessageCircle } from "react-icons/fi";
import { supabase } from "@/utils/supabaseClient";
import { getDateRange } from "@/utils/analyticsDateRange";
import {
  MOCK_CATEGORY_STATS,
  MOCK_CAT_DEPARTMENT_CHART,
  MOCK_CAT_DEPARTMENT_TITLE,
  MOCK_CAT_DATES,
  MOCK_CAT_BRAND_CHART,
  MOCK_CAT_BRAND_TITLE,
  MOCK_CAT_SEASONAL_CHART,
  MOCK_CAT_SEASONAL_TITLE,
  MOCK_CAT_CATEGORY_CHART,
  MOCK_CAT_CATEGORY_TITLE,
  MOCK_CAT_FLAVOUR_CHART,
  MOCK_CAT_FLAVOUR_TITLE,
  MOCK_CAT_PACK_CHART,
  MOCK_CAT_PACK_TITLE,
} from "@/app/analytics/_lib/analyticsMock";

/** Aggregated per-category analytics. */
interface CategoryStats {
  name: string;
  revenue: number;
  unitsSold: number;
}

/**
 * Floating Chat Button — navigates to internal chat.
 * Positioned to avoid conflict with the mobile sidebar menu button.
 */
const FloatingChatButton: React.FC = function () {
  const router = useRouter();

  const handleChatClick = (): void => {
    router.push("/internal-chat");
  };

  return (
    <button
      type="button"
      onClick={handleChatClick}
      className="fixed bottom-20 right-6 lg:bottom-6 z-40 p-4 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-110"
      aria-label="Open team chat"
      title="Team Chat"
    >
      <FiMessageCircle className="w-6 h-6" />
    </button>
  );
};

const CategoriesAnalyticsPage: React.FC = function () {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("This Month");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chart data state
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const timeRangeOptions: string[] = [
    "Today",
    "Yesterday",
    "This Week",
    "Last Week",
    "This Month",
    "Last Month",
    "This Quarter",
    "Last Quarter",
    "This Year",
    "Last Year",
  ];

  /** Handles time range selection and closes the dropdown. */
  const handleTimeRangeSelect = (timeRange: string): void => {
    setSelectedTimeRange(timeRange);
    setIsDropdownOpen(false);
  };

  /** Closes the dropdown when the user clicks outside it. */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Fetches and aggregates order_items joined through products → product_categories → categories.
   * Revenue is approximated as units_sold × product.price since order_items only stores quantity.
   * Re-runs whenever selectedTimeRange changes.
   */
  useEffect(() => {
    async function fetchCategoryAnalytics(): Promise<void> {
      setLoading(true);

      const { from, to } = getDateRange(selectedTimeRange);
      const fromIso = from.toISOString();
      const toIso = to.toISOString();

      // Fetch order_items joined to orders (date/status filter), products (price),
      // product_categories, and categories (name).
      // Using !inner on orders ensures we only get items from qualifying orders.
      const { data: itemsData } = await supabase
        .from("order_items")
        .select(
          `amount,
           products!inner(
             price,
             product_categories(
               categories(name)
             )
           ),
           orders!inner(created_at, status, deleted_at)`
        )
        .gte("orders.created_at", fromIso)
        .lte("orders.created_at", toIso)
        .neq("orders.status", "cancelled")
        .is("orders.deleted_at", null)
        .is("deleted_at", null);

      // Aggregate revenue and units per category
      const statsMap = new Map<string, CategoryStats>();

      for (const item of itemsData ?? []) {
        const units = item.amount ?? 0;

        // item.products may be a single object or array depending on the query shape
        const product = Array.isArray(item.products)
          ? item.products[0]
          : item.products;

        if (!product) continue;

        const price: number = (product as { price: number }).price ?? 0;

        // product_categories is an array of join rows
        const productCategories = Array.isArray(
          (product as { product_categories?: unknown }).product_categories
        )
          ? (
              (product as { product_categories: { categories: { name: string } | { name: string }[] | null }[] })
                .product_categories
            )
          : [];

        for (const pc of productCategories) {
          // categories is a single object from the FK join
          const catObj = pc.categories;
          if (!catObj) continue;
          const catName: string = Array.isArray(catObj)
            ? (catObj[0]?.name ?? "Unknown")
            : ((catObj as { name: string }).name ?? "Unknown");

          const existing = statsMap.get(catName);
          if (existing) {
            existing.unitsSold += units;
            existing.revenue += units * price;
          } else {
            statsMap.set(catName, {
              name: catName,
              unitsSold: units,
              revenue: units * price,
            });
          }
        }
      }

      const stats = Array.from(statsMap.values()).sort(
        (a, b) => b.revenue - a.revenue
      );

      setCategoryStats(stats.length > 0 ? stats : MOCK_CATEGORY_STATS);
      setLoading(false);
    }

    void fetchCategoryAnalytics();
  }, [selectedTimeRange]);

  /** Builds LineChart chartData from real categoryStats when available, else use mock. */
  const categoryLineData = categoryStats.length > 0
    ? [{ name: "Revenue (RM)", data: categoryStats.map((s) => Math.round(s.revenue)) }]
    : MOCK_CAT_CATEGORY_CHART;
  const categoryLineTitleData = categoryStats.length > 0
    ? [{ title: "Total Revenue", value: Math.round(categoryStats.reduce((a, s) => a + s.revenue, 0)), unit: "MYR" }]
    : MOCK_CAT_CATEGORY_TITLE;
  const categoryLineCategories = categoryStats.length > 0
    ? categoryStats.map((s) => s.name)
    : MOCK_CAT_DATES;

  return (
    <NavbarSidebarLayout>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="block border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="w-full">
          {/* Desktop */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Analytics
              </h1>
              <a href="/analytics/users" className="text-sm text-grey-500 dark:text-grey-400 hover:underline">Users</a>
              <a href="/analytics/products" className="text-sm text-grey-500 dark:text-grey-400 hover:underline">Products</a>
              <a href="/analytics/categories" className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">Category</a>
              <a href="/analytics/support" className="text-sm text-grey-500 dark:text-grey-400 hover:underline">Support</a>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 min-w-[120px]"
                type="button"
              >
                {selectedTimeRange}
                <svg className={`w-4 h-4 ml-2 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 z-10 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600">
                  <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                    {timeRangeOptions.map((option) => (
                      <li key={option}>
                        <button
                          onClick={() => handleTimeRangeSelect(option)}
                          className={`block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedTimeRange === option ? "bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white" : ""}`}
                        >
                          {option}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Mobile */}
          <div className="block sm:hidden space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h1>
            </div>
            <div className="flex items-center gap-x-2 overflow-x-auto pb-2">
              <a href="/analytics/users" className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">Users</a>
              <a href="/analytics/products" className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">Products</a>
              <a href="/analytics/categories" className="whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-500 hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-900">Category</a>
              <a href="/analytics/support" className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">Support</a>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full inline-flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                type="button"
              >
                <span className="truncate">{selectedTimeRange}</span>
                <svg className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600">
                  <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                    {timeRangeOptions.map((option) => (
                      <li key={option}>
                        <button
                          onClick={() => handleTimeRangeSelect(option)}
                          className={`block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedTimeRange === option ? "bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white" : ""}`}
                        >
                          {option}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col p-4">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">

              {loading ? (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Loading category analytics…
                </div>
              ) : (
                <>
                  {/* Row 1: Department & Brand */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h2 className="mb-2 text-xl font-bold leading-none text-gray-900 dark:text-white">
                        Department
                      </h2>
                      <LineChart
                        dateRange={selectedTimeRange}
                        titleData={MOCK_CAT_DEPARTMENT_TITLE}
                        chartData={MOCK_CAT_DEPARTMENT_CHART}
                        categories={MOCK_CAT_DATES}
                        redirectText="Department Trends"
                      />
                    </div>
                    <div>
                      <h2 className="mb-2 text-xl font-bold leading-none text-gray-900 dark:text-white">
                        Brand
                      </h2>
                      <LineChart
                        dateRange={selectedTimeRange}
                        titleData={MOCK_CAT_BRAND_TITLE}
                        chartData={MOCK_CAT_BRAND_CHART}
                        categories={MOCK_CAT_DATES}
                        redirectText="Brand Trends"
                      />
                    </div>
                  </div>

                  {/* Row 2: Seasonal Sales & Product Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h2 className="mb-2 text-xl font-bold leading-none text-gray-900 dark:text-white">
                        Seasonal Sales
                      </h2>
                      <LineChart
                        dateRange={selectedTimeRange}
                        titleData={MOCK_CAT_SEASONAL_TITLE}
                        chartData={MOCK_CAT_SEASONAL_CHART}
                        categories={MOCK_CAT_DATES}
                        redirectText="Seasonal Trends"
                      />
                    </div>
                    <div>
                      <h2 className="mb-2 text-xl font-bold leading-none text-gray-900 dark:text-white">
                        Product Category
                      </h2>
                      {/* Uses real DB data when available, mock otherwise */}
                      <LineChart
                        dateRange={selectedTimeRange}
                        titleData={categoryLineTitleData}
                        chartData={categoryLineData}
                        categories={categoryLineCategories}
                        redirectText="Category Trends"
                      />
                    </div>
                  </div>

                  {/* Row 3: Popular Flavours & Pack Sizes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h2 className="mb-2 text-xl font-bold leading-none text-gray-900 dark:text-white">
                        Popular Flavours / Variants
                      </h2>
                      <LineChart
                        dateRange={selectedTimeRange}
                        titleData={MOCK_CAT_FLAVOUR_TITLE}
                        chartData={MOCK_CAT_FLAVOUR_CHART}
                        categories={MOCK_CAT_DATES}
                        redirectText="Flavour Trends"
                      />
                    </div>
                    <div>
                      <h2 className="mb-2 text-xl font-bold leading-none text-gray-900 dark:text-white">
                        Sizes / Pack Sizes
                      </h2>
                      <LineChart
                        dateRange={selectedTimeRange}
                        titleData={MOCK_CAT_PACK_TITLE}
                        chartData={MOCK_CAT_PACK_CHART}
                        categories={MOCK_CAT_DATES}
                        redirectText="Pack Size Trends"
                      />
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>

      <FloatingChatButton />
    </NavbarSidebarLayout>
  );
};

export default function WrappedCategoriesAnalyticsPage() {
  return (
    <AnalyticsContextBundle>
      <CategoriesAnalyticsPage />
    </AnalyticsContextBundle>
  );
}
