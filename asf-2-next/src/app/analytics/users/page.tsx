"use client";
import { AnalyticsContextBundle } from "@/context/RouteContextBundles";

/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import LineChart from "@/components/analytics/LineChart";
import PieChart from "@/components/analytics/PieChart";
import BarChart from "@/components/analytics/BarChart";
import { FiMessageCircle } from "react-icons/fi";
import { supabase } from "@/utils/supabaseClient";
import { getDateRange } from "@/utils/analyticsDateRange";
import {
  MOCK_NEW_USERS_CHART_DATA,
  MOCK_NEW_USERS_CATEGORIES,
  MOCK_TOTAL_USERS,
  MOCK_ACTIVE_USERS,
  MOCK_RACE_PIE,
  MOCK_AGE_PIE,
  MOCK_STATE_PIE,
  MOCK_CITY_PIE,
  MOCK_USER_LINE_CHART_DATA,
  MOCK_USER_LINE_TITLE_DATA,
  MOCK_USER_LINE_CATEGORIES,
  MOCK_USER_FUNNEL_TITLES,
  MOCK_USER_FUNNEL_DATA,
  MOCK_USER_FUNNEL_TOTAL,
} from "@/app/analytics/_lib/analyticsMock";

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

const UserAnalyticsPage: React.FC = function () {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("This Month");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chart and KPI state
  const [newUsersChartData, setNewUsersChartData] = useState<number[]>([]);
  const [newUsersCategories, setNewUsersCategories] = useState<string[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeUsers, setActiveUsers] = useState<number>(0);
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
   * Fetches user analytics data in parallel and updates state.
   * Re-runs whenever selectedTimeRange changes.
   */
  useEffect(() => {
    async function fetchUserAnalytics(): Promise<void> {
      setLoading(true);

      const { from, to } = getDateRange(selectedTimeRange);
      const fromIso = from.toISOString();
      const toIso = to.toISOString();

      const [newUsersResult, totalUsersResult, activeUsersResult] =
        await Promise.all([
          // New users registered in the selected period (requires created_at on user_details)
          supabase
            .from("user_details")
            .select("id, created_at")
            .gte("created_at", fromIso)
            .lte("created_at", toIso),

          // All-time total users (no date filter)
          supabase
            .from("user_details")
            .select("id", { count: "exact", head: true }),

          // Active users: distinct user_ids that placed at least one non-cancelled order in the period
          supabase
            .from("orders")
            .select("user_id")
            .neq("status", "cancelled")
            .gte("created_at", fromIso)
            .lte("created_at", toIso)
            .is("deleted_at", null),
        ]);

      // Group new users by date
      const countByDate = new Map<string, number>();
      for (const row of newUsersResult.data ?? []) {
        const dateKey = row.created_at.slice(0, 10);
        countByDate.set(dateKey, (countByDate.get(dateKey) ?? 0) + 1);
      }

      const sortedDates = Array.from(countByDate.keys()).sort();
      const chartData = sortedDates.map((d) => countByDate.get(d) ?? 0);
      setNewUsersChartData(chartData.length > 0 ? chartData : MOCK_NEW_USERS_CHART_DATA);
      setNewUsersCategories(sortedDates.length > 0 ? sortedDates : MOCK_NEW_USERS_CATEGORIES);

      // Total users
      const realTotalUsers = totalUsersResult.error ? 0 : (totalUsersResult.count ?? 0);
      setTotalUsers(realTotalUsers > 0 ? realTotalUsers : MOCK_TOTAL_USERS);

      // Active users: count distinct user_ids
      const activeUserIds = new Set<string>(
        (activeUsersResult.data ?? [])
          .map((row) => row.user_id)
          .filter((uid): uid is string => uid !== null)
      );
      setActiveUsers(activeUserIds.size > 0 ? activeUserIds.size : MOCK_ACTIVE_USERS);

      setLoading(false);
    }

    void fetchUserAnalytics();
  }, [selectedTimeRange]);

  /** Line chart node — mock VIP/Normal series when no real data, real new-user series otherwise. */
  const userLineIsMock = newUsersChartData === MOCK_NEW_USERS_CHART_DATA;
  const userLineChartNode = userLineIsMock ? (
    <LineChart
      dateRange={selectedTimeRange}
      titleData={MOCK_USER_LINE_TITLE_DATA}
      chartData={MOCK_USER_LINE_CHART_DATA}
      categories={MOCK_USER_LINE_CATEGORIES}
    />
  ) : (
    <LineChart
      dateRange={selectedTimeRange}
      titleData={[
        {
          title: "New Registrations",
          value: newUsersChartData.reduce((a, b) => a + b, 0),
          unit: "users",
        },
      ]}
      chartData={[{ name: "New Users", data: newUsersChartData }]}
      categories={newUsersCategories}
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
              <a href="/analytics/users" className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">Users</a>
              <a href="/analytics/products" className="text-sm text-grey-500 dark:text-grey-400 hover:underline">Products</a>
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
              <a href="/analytics/users" className="whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-500 hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-900">Users</a>
              <a href="/analytics/products" className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">Products</a>
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

              {/* Demographic PieCharts — Race & Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <PieChart
                  title="Customers by Ethnicity"
                  dateRange="All Time"
                  chartData={MOCK_RACE_PIE}
                />
                <PieChart
                  title="Customers by Age Group"
                  dateRange="All Time"
                  chartData={MOCK_AGE_PIE}
                />
              </div>

              {/* Geographic PieCharts — State & City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <PieChart
                  title="Orders by State"
                  dateRange={selectedTimeRange}
                  chartData={MOCK_STATE_PIE}
                />
                <PieChart
                  title="Orders by City"
                  dateRange={selectedTimeRange}
                  chartData={MOCK_CITY_PIE}
                />
              </div>

              {/* VIP vs Normal LineChart (real new-user data as fallback, mock VIP/Normal otherwise) */}
              <div className="mb-4">
                <h2 className="mb-2 text-xl font-bold leading-none text-gray-900 dark:text-white">
                  {userLineIsMock ? "VIP vs Normal Customers" : `New Users — ${selectedTimeRange}`}
                </h2>
                {loading ? (
                  <div className="h-64 flex items-center justify-center text-gray-400">Loading…</div>
                ) : userLineChartNode}
              </div>

              {/* Product View → Add to Cart → Payment funnel BarChart */}
              <div className="mb-4">
                <h2 className="mb-2 text-xl font-bold leading-none text-gray-900 dark:text-white">
                  Conversion Funnel (Last 7 Days)
                </h2>
                <BarChart
                  total={MOCK_USER_FUNNEL_TOTAL}
                  description="Product View → Add to Cart → Payment"
                  titles={MOCK_USER_FUNNEL_TITLES}
                  data={MOCK_USER_FUNNEL_DATA}
                />
              </div>

            </div>
          </div>
        </div>
      </div>

      <FloatingChatButton />
    </NavbarSidebarLayout>
  );
};

export default function WrappedUserAnalyticsPage() {
  return (
    <AnalyticsContextBundle>
      <UserAnalyticsPage />
    </AnalyticsContextBundle>
  );
}
