"use client";
import { AnalyticsContextBundle } from "@/context/RouteContextBundles";

/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import PieChart from "@/components/analytics/PieChart";
import LineChart from "@/components/analytics/LineChart";
import { FiMessageCircle } from "react-icons/fi";
import { supabase } from "@/utils/supabaseClient";
import { getDateRange } from "@/utils/analyticsDateRange";

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

const SupportAnalyticsPage: React.FC = function () {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("This Month");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("All Agents");
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const agentDropdownRef = useRef<HTMLDivElement>(null);

  // Chart / KPI state
  const [volumeChartData, setVolumeChartData] = useState<number[]>([]);
  const [volumeCategories, setVolumeCategories] = useState<string[]>([]);
  const [statusLabels, setStatusLabels] = useState<string[]>([]);
  const [statusSeries, setStatusSeries] = useState<number[]>([]);
  const [openCount, setOpenCount] = useState<number>(0);
  const [closedCount, setClosedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Agent list built from real data (populated on first load)
  const [agentList, setAgentList] = useState<string[]>(["All Agents"]);

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

  /** Handles agent selection and closes the dropdown. */
  const handleAgentSelect = (agent: string): void => {
    setSelectedAgent(agent);
    setIsAgentDropdownOpen(false);
  };

  /** Closes dropdowns when the user clicks outside them. */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        agentDropdownRef.current &&
        !agentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAgentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Fetches support analytics in parallel.
   * - Ticket volume over time is date-range filtered.
   * - Status breakdown shows the current live snapshot (no date filter).
   * Re-runs whenever selectedTimeRange or selectedAgent changes.
   */
  useEffect(() => {
    async function fetchSupportAnalytics(): Promise<void> {
      setLoading(true);

      const { from, to } = getDateRange(selectedTimeRange);
      const fromIso = from.toISOString();
      const toIso = to.toISOString();

      // Build agent filter — only apply when a specific agent is selected
      let volumeQuery = supabase
        .from("tickets")
        .select("id, created_at, assigned_agent_id")
        .gte("created_at", fromIso)
        .lte("created_at", toIso);

      if (selectedAgent !== "All Agents") {
        volumeQuery = volumeQuery.eq("assigned_agent_id", selectedAgent);
      }

      const [volumeResult, statusResult] = await Promise.all([
        volumeQuery,
        // Status snapshot: all tickets, no date filter
        supabase.from("tickets").select("id, status, assigned_agent_id"),
      ]);

      // ── Ticket volume over time ────────────────────────────────────────────
      const volumeByDate = new Map<string, number>();
      for (const ticket of volumeResult.data ?? []) {
        const dateKey = ticket.created_at.slice(0, 10);
        volumeByDate.set(dateKey, (volumeByDate.get(dateKey) ?? 0) + 1);
      }

      const sortedDates = Array.from(volumeByDate.keys()).sort();
      setVolumeChartData(sortedDates.map((d) => volumeByDate.get(d) ?? 0));
      setVolumeCategories(sortedDates);

      // ── Status breakdown (snapshot) ────────────────────────────────────────
      const allTickets = statusResult.data ?? [];

      // Collect unique agent IDs for the agent selector (on first load or refresh)
      const uniqueAgentIds = Array.from(
        new Set(
          allTickets
            .map((t) => t.assigned_agent_id)
            .filter((id): id is string => id !== null)
        )
      );
      setAgentList(["All Agents", ...uniqueAgentIds]);

      const statusCounts = new Map<string, number>();
      for (const ticket of allTickets) {
        const status = ticket.status ?? "unknown";
        statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
      }

      const sortedStatuses = Array.from(statusCounts.entries()).sort(
        ([, a], [, b]) => b - a
      );
      setStatusLabels(sortedStatuses.map(([s]) => s));
      setStatusSeries(sortedStatuses.map(([, c]) => c));

      // Open / closed KPIs from snapshot
      setOpenCount(statusCounts.get("open") ?? 0);
      setClosedCount(
        (statusCounts.get("resolved") ?? 0) + (statusCounts.get("closed") ?? 0)
      );

      setLoading(false);
    }

    void fetchSupportAnalytics();
  }, [selectedTimeRange, selectedAgent]);

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
              <a href="/analytics/categories" className="text-sm text-grey-500 dark:text-grey-400 hover:underline">Category</a>
              <a href="/analytics/support" className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">Support</a>
            </div>
            <div className="flex items-center gap-3">
              {/* Agent Selector */}
              <div className="relative" ref={agentDropdownRef}>
                <button
                  onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                  className="inline-flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 min-w-[150px]"
                  type="button"
                >
                  {selectedAgent}
                  <svg className={`w-4 h-4 ml-2 transition-transform ${isAgentDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isAgentDropdownOpen && (
                  <div className="absolute right-0 z-10 mt-1 w-56 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600 max-h-60 overflow-y-auto">
                    <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                      {agentList.map((agent) => (
                        <li key={agent}>
                          <button
                            onClick={() => handleAgentSelect(agent)}
                            className={`block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedAgent === agent ? "bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white" : ""}`}
                          >
                            {agent}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Time Range Selector */}
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
          </div>

          {/* Mobile */}
          <div className="block sm:hidden space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h1>
            </div>
            <div className="flex items-center gap-x-2 overflow-x-auto pb-2">
              <a href="/analytics/users" className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">Users</a>
              <a href="/analytics/products" className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">Products</a>
              <a href="/analytics/categories" className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">Category</a>
              <a href="/analytics/support" className="whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-500 hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-900">Support</a>
            </div>
            <div className="flex flex-col gap-2">
              {/* Agent - Mobile */}
              <div className="relative" ref={agentDropdownRef}>
                <button
                  onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                  className="w-full inline-flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  type="button"
                >
                  <span className="truncate">{selectedAgent}</span>
                  <svg className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${isAgentDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isAgentDropdownOpen && (
                  <div className="absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600 max-h-48 overflow-y-auto">
                    <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                      {agentList.map((agent) => (
                        <li key={agent}>
                          <button
                            onClick={() => handleAgentSelect(agent)}
                            className={`block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedAgent === agent ? "bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white" : ""}`}
                          >
                            {agent}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Time Range - Mobile */}
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
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col p-4">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Open Tickets</p>
                  <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                    {loading ? "—" : openCount.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Closed / Resolved Tickets</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {loading ? "—" : closedCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Ticket Volume Over Time */}
              <div className="mb-6">
                <h2 className="mb-2 text-xl font-bold leading-none text-gray-900 dark:text-white">
                  Ticket Volume — {selectedTimeRange}
                </h2>
                {loading ? (
                  <div className="h-64 flex items-center justify-center text-gray-400">Loading…</div>
                ) : volumeChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    No tickets created in this period.
                  </div>
                ) : (
                  <LineChart
                    dateRange={selectedTimeRange}
                    titleData={[
                      {
                        title: "Tickets Created",
                        value: volumeChartData.reduce((a, b) => a + b, 0),
                        unit: "tickets",
                      },
                    ]}
                    chartData={[{ name: "Tickets", data: volumeChartData }]}
                    categories={volumeCategories}
                  />
                )}
              </div>

              {/* Status Breakdown */}
              <div className="mb-6">
                <h2 className="mb-2 text-xl font-bold leading-none text-gray-900 dark:text-white">
                  Ticket Status Breakdown (Current Snapshot)
                </h2>
                {loading ? (
                  <div className="h-64 flex items-center justify-center text-gray-400">Loading…</div>
                ) : statusSeries.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    No ticket data available.
                  </div>
                ) : (
                  <PieChart
                    title="Ticket Status"
                    dateRange="Current"
                    chartData={{ series: statusSeries, labels: statusLabels }}
                  />
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

export default function WrappedSupportAnalyticsPage() {
  return (
    <AnalyticsContextBundle>
      <SupportAnalyticsPage />
    </AnalyticsContextBundle>
  );
}
