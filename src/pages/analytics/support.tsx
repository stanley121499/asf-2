/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProductContext } from "../../context/product/ProductContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import PieChart from "../../components/analytics/PieChart";
import LineChart from "../../components/analytics/LineChart";
import BarChart from "../../components/analytics/BarChart";
import { FiMessageCircle } from "react-icons/fi";

/**
 * Floating Chat Button component specifically for analytics pages
 * Positioned to avoid conflict with mobile sidebar menu button
 */
const FloatingChatButton: React.FC = function () {
  const navigate = useNavigate();

  const handleChatClick = () => {
    navigate("/internal-chat");
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
  const { loading } = useProductContext();
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("This Month");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("All Agents");
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const agentDropdownRef = useRef<HTMLDivElement>(null);

  const timeRangeOptions = [
    "Today",
    "Yesterday", 
    "This Week",
    "Last Week",
    "This Month",
    "Last Month",
    "This Quarter",
    "Last Quarter",
    "This Year",
    "Last Year"
  ];

  const supportAgents = [
    "All Agents",
    "Sarah Johnson",
    "Michael Chen",
    "Emily Rodriguez",
    "David Thompson",
    "Jessica Wang",
    "Ryan O'Connor",
    "Amanda Singh",
    "Marcus Brown"
  ];

  /**
   * Handle time range selection from dropdown
   * @param timeRange - Selected time range option
   */
  const handleTimeRangeSelect = (timeRange: string): void => {
    setSelectedTimeRange(timeRange);
    setIsDropdownOpen(false);
  };

  /**
   * Handle support agent selection from dropdown
   * @param agent - Selected support agent
   */
  const handleAgentSelect = (agent: string): void => {
    setSelectedAgent(agent);
    setIsAgentDropdownOpen(false);
  };

  /**
   * Close dropdowns when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target as Node)) {
        setIsAgentDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <NavbarSidebarLayout>
      <div className="block border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="w-full">
          {/* Desktop Layout - Hidden on mobile */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Analytics
              </h1>
              <a
                href="/analytics/users"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Users
              </a>
              <a
                href="/analytics/products"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Products
              </a>
              <a
                href="/analytics/categories"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Category
              </a>
              <a
                href="/analytics/support"
                className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">
                Support
              </a>
            </div>
            
            {/* Desktop Time Range and Agent Selectors */}
            <div className="flex items-center gap-3">
              {/* Support Agent Selector */}
              <div className="relative" ref={agentDropdownRef}>
                <button
                  onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                  className="inline-flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 min-w-[150px]"
                  type="button"
                >
                  {selectedAgent}
                  <svg
                    className={`w-4 h-4 ml-2 transition-transform ${isAgentDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isAgentDropdownOpen && (
                  <div className="absolute right-0 z-10 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600">
                    <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                      {supportAgents.map((agent) => (
                        <li key={agent}>
                          <button
                            onClick={() => handleAgentSelect(agent)}
                            className={`block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${
                              selectedAgent === agent 
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white" 
                                : ""
                            }`}
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
                  className="inline-flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 min-w-[120px]"
                  type="button"
                >
                  {selectedTimeRange}
                  <svg
                    className={`w-4 h-4 ml-2 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
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
                            className={`block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${
                              selectedTimeRange === option 
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white" 
                                : ""
                            }`}
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

          {/* Mobile Layout - Visible only on mobile */}
          <div className="block sm:hidden space-y-3">
            {/* Mobile Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Analytics
              </h1>
            </div>

            {/* Mobile Navigation */}
            <div className="flex items-center gap-x-2 overflow-x-auto pb-2">
              <a
                href="/analytics/users"
                className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">
                Users
              </a>
              <a
                href="/analytics/products"
                className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">
                Products
              </a>
              <a
                href="/analytics/categories"
                className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">
                Category
              </a>
              <a
                href="/analytics/support"
                className="whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-500 hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-900">
                Support
              </a>
            </div>

            {/* Mobile Filters */}
            <div className="flex flex-col gap-2">
              {/* Support Agent Selector - Mobile */}
              <div className="relative" ref={agentDropdownRef}>
                <button
                  onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                  className="w-full inline-flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  type="button"
                >
                  <span className="truncate">{selectedAgent}</span>
                  <svg
                    className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${isAgentDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isAgentDropdownOpen && (
                  <div className="absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600">
                    <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                      {supportAgents.map((agent) => (
                        <li key={agent}>
                          <button
                            onClick={() => handleAgentSelect(agent)}
                            className={`block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${
                              selectedAgent === agent 
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white" 
                                : ""
                            }`}
                          >
                            {agent}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Time Range Selector - Mobile */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full inline-flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  type="button"
                >
                  <span className="truncate">{selectedTimeRange}</span>
                  <svg
                    className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
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
                            className={`block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${
                              selectedTimeRange === option 
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white" 
                                : ""
                            }`}
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

      <div className="flex flex-col p-4">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                <PieChart
                  title="Ticket Types"
                  dateRange="31 Nov - 31 Dec"
                  chartData={{
                    series: [45, 25, 15, 15],
                    labels: ["Technical", "Billing", "Product", "Account"],
                  }}
                />
                <PieChart
                  title="Tickets by State"
                  dateRange="31 Nov - 31 Dec"
                  chartData={{
                    labels: [
                      "Selangor",
                      "Kuala Lumpur",
                      "Johor",
                      "Sarawak",
                      "Sabah",
                      "Perak",
                      "Pahang",
                      "Penang",
                      "Kedah",
                      "Kelantan",
                      "Terengganu",
                      "Melaka",
                      "Negeri Sembilan",
                      "Perlis"
                    ],
                    series: [28, 15, 12, 8, 7, 6, 5, 4, 3, 3, 2, 2, 1, 1],
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                <PieChart
                  title="Ticket Status"
                  dateRange="31 Nov - 31 Dec"
                  chartData={{
                    labels: ["Open", "In Progress", "Resolved", "Closed"],
                    series: [15, 25, 30, 30],
                  }}
                />
                <PieChart
                  title="Customer Satisfaction"
                  dateRange="31 Nov - 31 Dec"
                  chartData={{
                    labels: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
                    series: [35, 30, 20, 10, 5],
                  }}
                />
              </div>
              <div>
                <LineChart
                  dateRange="31 Nov - 31 Dec"
                  titleData={[
                    { title: "Average Response Time (hrs)", value: 2.5 },
                    { title: "Average Resolution Time (hrs)", value: 8.3 },
                  ]}
                  chartData={[
                    {
                      name: "Avg Response Time",
                      data: [3.2, 2.8, 2.6, 2.5, 2.4, 2.3, 2.5],
                    },
                    {
                      name: "Avg Resolution Time",
                      data: [9.5, 9.2, 8.8, 8.5, 8.3, 8.2, 8.0],
                    },
                  ]}
                  categories={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                />
              </div>
              <div>
                <BarChart
                  total={245}
                  description="Total Active Tickets"
                  percentageIncrease={-5.3}
                  titles={["New Tickets", "In Progress", "Resolved"]}
                  data={[
                    [
                      { x: "01 Feb", y: 28 },
                      { x: "02 Feb", y: 32 },
                      { x: "03 Feb", y: 25 },
                      { x: "04 Feb", y: 30 },
                      { x: "05 Feb", y: 22 },
                      { x: "06 Feb", y: 18 },
                      { x: "07 Feb", y: 15 },
                    ],
                    [
                      { x: "01 Feb", y: 45 },
                      { x: "02 Feb", y: 50 },
                      { x: "03 Feb", y: 55 },
                      { x: "04 Feb", y: 60 },
                      { x: "05 Feb", y: 58 },
                      { x: "06 Feb", y: 52 },
                      { x: "07 Feb", y: 48 },
                    ],
                    [
                      { x: "01 Feb", y: 35 },
                      { x: "02 Feb", y: 38 },
                      { x: "03 Feb", y: 42 },
                      { x: "04 Feb", y: 45 },
                      { x: "05 Feb", y: 50 },
                      { x: "06 Feb", y: 55 },
                      { x: "07 Feb", y: 60 },
                    ],
                  ]}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-4 mt-4">
                <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">2.5 hrs</h3>
                  <p className="text-gray-500 dark:text-gray-400">Average Response Time</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">8.3 hrs</h3>
                  <p className="text-gray-500 dark:text-gray-400">Average Resolution Time</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">85%</h3>
                  <p className="text-gray-500 dark:text-gray-400">First Contact Resolution Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingChatButton />
    </NavbarSidebarLayout>
  );
};

export default SupportAnalyticsPage; 