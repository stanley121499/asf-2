"use client";
import { AnalyticsContextBundle } from "@/context/RouteContextBundles";

/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import BarChart from "@/components/analytics/BarChart";
import PieChart from "@/components/analytics/PieChart";
import ListWidget from "@/components/analytics/ListWidget";
import { FiMessageCircle } from "react-icons/fi";
import { supabase } from "@/utils/supabaseClient";
import { getDateRange } from "@/utils/analyticsDateRange";
import type { Json } from "@/database.types";
import {
  MOCK_REVENUE_BAR_DATA,
  MOCK_REVENUE_TOTAL,
  MOCK_BEST_PRODUCTS,
  MOCK_UNSELLABLE_PRODUCTS,
  MOCK_BEST_STATES,
  MOCK_BEST_CITIES,
  MOCK_SALE_VS_STOCK,
  MOCK_PRICE_DISTRIBUTION,
  MOCK_MONTHLY_BAR_TITLES,
  MOCK_MONTHLY_BAR_DATA,
  MOCK_MONTHLY_BAR_TOTAL,
} from "@/app/analytics/_lib/analyticsMock";

/** Shape of a structured shipping address stored as JSONB in orders. */
interface ShippingAddressJson {
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

/** Safely casts a Supabase JSON column value to ShippingAddressJson. */
function parseShippingAddress(raw: Json | null): ShippingAddressJson {
  if (
    raw !== null &&
    typeof raw === "object" &&
    !Array.isArray(raw)
  ) {
    return raw as ShippingAddressJson;
  }
  return {};
}

/** One entry for a ListWidget row. */
interface ListEntry {
  title: string;
  amount: number;
  unit: string;
  media_url?: string;
}

/** One data point for the revenue bar chart series. */
interface BarDataPoint {
  x: string;
  y: number;
}

/** Aggregated product sales data. */
interface ProductSalesEntry {
  product_id: string;
  product_name: string;
  units_sold: number;
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

const ProductAnalyticsPage: React.FC = function () {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("This Month");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chart / widget state
  const [revenueBarData, setRevenueBarData] = useState<BarDataPoint[]>([]);
  const [revenueTotal, setRevenueTotal] = useState<number>(0);
  const [bestProducts, setBestProducts] = useState<ListEntry[]>([]);
  const [unsellableProducts, setUnsellableProducts] = useState<ListEntry[]>([]);
  const [bestStates, setBestStates] = useState<ListEntry[]>([]);
  const [bestCities, setBestCities] = useState<ListEntry[]>([]);
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
   * Re-fetches all analytics data whenever the selected time range changes.
   * Queries run in parallel where possible.
   */
  useEffect(() => {
    async function fetchAnalytics(): Promise<void> {
      setLoading(true);

      const { from, to } = getDateRange(selectedTimeRange);
      const fromIso = from.toISOString();
      const toIso = to.toISOString();

      // ── 1. Revenue over time ────────────────────────────────────────────────
      const { data: ordersData } = await supabase
        .from("orders")
        .select("created_at, total_amount")
        .neq("status", "cancelled")
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .is("deleted_at", null);

      const revenueByDate = new Map<string, number>();
      let totalRevenue = 0;

      for (const order of ordersData ?? []) {
        const dateKey = order.created_at.slice(0, 10); // "YYYY-MM-DD"
        const amount = order.total_amount ?? 0;
        revenueByDate.set(dateKey, (revenueByDate.get(dateKey) ?? 0) + amount);
        totalRevenue += amount;
      }

      const sortedBarData: BarDataPoint[] = Array.from(revenueByDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ x: date, y: revenue }));

      setRevenueBarData(sortedBarData.length > 0 ? sortedBarData : MOCK_REVENUE_BAR_DATA);
      setRevenueTotal(sortedBarData.length > 0 ? totalRevenue : MOCK_REVENUE_TOTAL);

      // ── 2. Best performing products ────────────────────────────────────────
      // Fetch order_items joined to orders (for date/status filter) and products
      const { data: orderItemsData } = await supabase
        .from("order_items")
        .select(
          "amount, product_id, products(id, name), orders!inner(created_at, status, deleted_at)"
        )
        .gte("orders.created_at", fromIso)
        .lte("orders.created_at", toIso)
        .neq("orders.status", "cancelled")
        .is("orders.deleted_at", null)
        .is("deleted_at", null);

      // Aggregate units sold per product
      const salesMap = new Map<string, ProductSalesEntry>();
      for (const item of orderItemsData ?? []) {
        const productId = item.product_id;
        if (!productId) continue;
        // item.products may be an array (Supabase returns arrays for FK joins)
        const productName = Array.isArray(item.products)
          ? (item.products[0]?.name ?? productId)
          : ((item.products as { name?: string } | null)?.name ?? productId);
        const units = item.amount ?? 0;
        const existing = salesMap.get(productId);
        if (existing) {
          existing.units_sold += units;
        } else {
          salesMap.set(productId, {
            product_id: productId,
            product_name: productName,
            units_sold: units,
          });
        }
      }

      const topProducts: ListEntry[] = Array.from(salesMap.values())
        .sort((a, b) => b.units_sold - a.units_sold)
        .slice(0, 10)
        .map((p) => ({
          title: p.product_name,
          amount: p.units_sold,
          unit: "units",
        }));

      setBestProducts(topProducts.length > 0 ? topProducts : MOCK_BEST_PRODUCTS);

      // ── 3. Highest unsellable products ─────────────────────────────────────
      // Products that have stock (count > 0) but zero orders in the period
      const soldProductIds = new Set<string>(
        (orderItemsData ?? [])
          .map((item) => item.product_id)
          .filter((id): id is string => id !== null)
      );

      const { data: stockedProducts } = await supabase
        .from("product_stock")
        .select("product_id, count, products(id, name)")
        .gt("count", 0);

      // Collect products that appear in stock but not in soldProductIds
      const unsellableMap = new Map<string, { name: string; count: number }>();
      for (const stockRow of stockedProducts ?? []) {
        const productId = stockRow.product_id;
        if (!productId || soldProductIds.has(productId)) continue;
        const productName = Array.isArray(stockRow.products)
          ? (stockRow.products[0]?.name ?? productId)
          : ((stockRow.products as { name?: string } | null)?.name ?? productId);
        const existing = unsellableMap.get(productId);
        if (existing) {
          existing.count += stockRow.count;
        } else {
          unsellableMap.set(productId, {
            name: productName,
            count: stockRow.count,
          });
        }
      }

      const topUnsellable: ListEntry[] = Array.from(unsellableMap.entries())
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([id, val]) => ({
          title: val.name,
          amount: val.count,
          unit: "units in stock",
          // redirectUrl built dynamically per item below
        }));

      // We need the product ids separately for redirectUrls — keep a parallel array
      const topUnsellableIds: string[] = Array.from(unsellableMap.entries())
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([id]) => id);

      const mappedUnsellable = topUnsellable.map((entry, i) => ({
        ...entry,
        title: `${entry.title} (${topUnsellableIds[i] ? topUnsellableIds[i].slice(0, 6) : "?"})`,
      }));
      setUnsellableProducts(mappedUnsellable.length > 0 ? mappedUnsellable : MOCK_UNSELLABLE_PRODUCTS);

      // ── 4. Best State / Best City ───────────────────────────────────────────
      const { data: ordersWithAddress } = await supabase
        .from("orders")
        .select("shipping_address_structured, total_amount")
        .neq("status", "cancelled")
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .is("deleted_at", null);

      const stateMap = new Map<string, number>();
      const cityMap = new Map<string, number>();

      for (const order of ordersWithAddress ?? []) {
        const addr = parseShippingAddress(order.shipping_address_structured);
        const amount = order.total_amount ?? 0;

        if (addr.state) {
          stateMap.set(addr.state, (stateMap.get(addr.state) ?? 0) + amount);
        }
        if (addr.city) {
          cityMap.set(addr.city, (cityMap.get(addr.city) ?? 0) + amount);
        }
      }

      const topStates: ListEntry[] = Array.from(stateMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, revenue]) => ({ title: name, amount: revenue, unit: "MYR" }));

      const topCities: ListEntry[] = Array.from(cityMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, revenue]) => ({ title: name, amount: revenue, unit: "MYR" }));

      setBestStates(topStates.length > 0 ? topStates : MOCK_BEST_STATES);
      setBestCities(topCities.length > 0 ? topCities : MOCK_BEST_CITIES);

      setLoading(false);
    }

    void fetchAnalytics();
  }, [selectedTimeRange]);

  // Build the best-products redirect URLs separately (ListWidget needs per-item redirectUrl via the wrapper below)
  // Since ListWidget only supports a single redirectUrl prop, we'll pass the list with dynamic id embedded in title
  // and provide a static redirectUrl pointing to the products-inner base path.

  /** Revenue bar chart body — two-series mock when no real data, single-series otherwise. */
  const revenueIsMock = revenueBarData === MOCK_REVENUE_BAR_DATA;
  const revenueBarChartNode = revenueIsMock ? (
    <BarChart
      total={MOCK_MONTHLY_BAR_TOTAL}
      description="Monthly Add to Cart vs Checkout (Jan–Dec)"
      titles={MOCK_MONTHLY_BAR_TITLES}
      data={MOCK_MONTHLY_BAR_DATA}
    />
  ) : (
    <BarChart
      total={Math.round(revenueTotal)}
      description={`Revenue (RM) — ${selectedTimeRange}`}
      titles={["Revenue (RM)"]}
      data={[revenueBarData]}
    />
  );

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
              <a href="/analytics/products" className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">Products</a>
              <a href="/analytics/categories" className="text-sm text-grey-500 dark:text-grey-400 hover:underline">Category</a>
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
              <a href="/analytics/products" className="whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-500 hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-900">Products</a>
              <a href="/analytics/categories" className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">Category</a>
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

              {/* Sale vs Stock & Price Distribution PieCharts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <PieChart
                  title="Sale vs Stock"
                  dateRange={selectedTimeRange}
                  chartData={MOCK_SALE_VS_STOCK}
                />
                <PieChart
                  title="Price Distribution"
                  dateRange={selectedTimeRange}
                  chartData={MOCK_PRICE_DISTRIBUTION}
                />
              </div>

              {/* Revenue / Monthly Bar Chart */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl mb-2">
                  {revenueIsMock ? "Monthly Sale vs Stock" : `Revenue — ${selectedTimeRange}`}
                </h2>
                {loading ? (
                  <div className="h-40 flex items-center justify-center text-gray-400">Loading…</div>
                ) : revenueBarChartNode}
              </div>

              {/* Best Performing & Unsellable Products */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                {loading ? (
                  <>
                    <div className="h-40 flex items-center justify-center text-gray-400 rounded-lg bg-white dark:bg-gray-800 shadow-sm">Loading…</div>
                    <div className="h-40 flex items-center justify-center text-gray-400 rounded-lg bg-white dark:bg-gray-800 shadow-sm">Loading…</div>
                  </>
                ) : (
                  <>
                    <ListWidget
                      title="Best Performing Products"
                      listData={bestProducts}
                      redirectUrl="/analytics/products-inner"
                      redirectText="View All"
                    />
                    <ListWidget
                      title="Highest Unsellable Products"
                      listData={unsellableProducts}
                      redirectUrl="/analytics/products-inner"
                      redirectText="View All"
                    />
                  </>
                )}
              </div>

              {/* Best State & City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                {loading ? (
                  <>
                    <div className="h-40 flex items-center justify-center text-gray-400 rounded-lg bg-white dark:bg-gray-800 shadow-sm">Loading…</div>
                    <div className="h-40 flex items-center justify-center text-gray-400 rounded-lg bg-white dark:bg-gray-800 shadow-sm">Loading…</div>
                  </>
                ) : (
                  <>
                    <ListWidget
                      title="Best State"
                      listData={bestStates.length > 0 ? bestStates : []}
                    />
                    <ListWidget
                      title="Best City"
                      listData={bestCities.length > 0 ? bestCities : []}
                    />
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <FloatingChatButton />
    </NavbarSidebarLayout>
  );
};

export default function WrappedProductAnalyticsPage() {
  return (
    <AnalyticsContextBundle>
      <ProductAnalyticsPage />
    </AnalyticsContextBundle>
  );
}
