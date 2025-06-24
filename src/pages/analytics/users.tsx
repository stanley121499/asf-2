/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { useProductContext } from "../../context/product/ProductContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import PieChart from "../../components/analytics/PieChart";
import LineChart from "../../components/analytics/LineChart";
import BarChart from "../../components/analytics/BarChart";

const UserAnalyticsPage: React.FC = function () {
  const { loading } = useProductContext();
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("This Month");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  /**
   * Handle time range selection from dropdown
   * @param timeRange - Selected time range option
   */
  const handleTimeRangeSelect = (timeRange: string): void => {
    setSelectedTimeRange(timeRange);
    setIsDropdownOpen(false);
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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
                className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">
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
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Support
              </a>
            </div>
            
            {/* Desktop Time Range Selector */}
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
                className="whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-500 hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-900">
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
                className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">
                Support
              </a>
            </div>

            {/* Mobile Time Range Selector */}
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

      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                <PieChart
                  title="Race"
                  dateRange="31 Nov - 31 Dec"
                  chartData={{
                    series: [15, 25, 60],
                    labels: ["Others", "Chinese", "Malay"],
                  }}
                />
                <PieChart
                  title="Age"
                  dateRange="31 Nov - 31 Dec"
                  chartData={{
                    labels: [
                      "18-24",
                      "25-34",
                      "35-44",
                      "45-54",
                      "55-64",
                      "65+",
                    ],
                    series: [20, 30, 25, 15, 10, 5],
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                <PieChart
                  title="State"
                  dateRange="31 Nov - 31 Dec"
                  chartData={{
                    labels: [
                      "Johor",
                      "Kedah",
                      "Kelantan",
                      "Melaka",
                      "Negeri Sembilan",
                      "Pahang",
                      "Perak",
                      "Perlis",
                      "Pulau Pinang",
                      "Sabah",
                      "Sarawak",
                      "Selangor",
                      "Terengganu",
                      "Wilayah Persekutuan",
                    ],
                    series: [10, 5, 3, 2, 1, 4, 6, 1, 3, 7, 8, 20, 2, 4],
                  }}
                />
                <PieChart
                  title="City"
                  dateRange="31 Nov - 31 Dec"
                  chartData={{
                    labels: [
                      "Kuala Lumpur",
                      "Petaling Jaya",
                      "Shah Alam",
                      "Klang",
                      "Subang Jaya",
                      "Kajang",
                      "Selayang",
                      "Rawang",
                      "Gombak",
                      "Seremban",
                      "Port Dickson",
                      "Kuala Terengganu",
                    ],
                    series: [10, 5, 3, 2, 1, 4, 6, 1, 3, 7, 8, 20, 2, 4],
                  }}
                />
              </div>
              <div>
                <LineChart
                  dateRange="31 Nov - 31 Dec"
                  titleData={[
                    { title: "VIP", value: 28000 },
                    { title: "Normal", value: 35000 },
                  ]}
                  chartData={[
                    {
                      name: "VIP",
                      data: [1000, 2000, 3000, 4000, 5000, 6000, 7000],
                    },
                    {
                      name: "Normal",
                      data: [2000, 3000, 4000, 5000, 6000, 7000, 8000],
                    },
                  ]}
                  categories={["1", "2", "3", "4", "5", "6", "7"]}
                />
              </div>
              <div>
                <BarChart
                  total={1000}
                  description="Active Users"
                  percentageIncrease={3.2}
                  titles={["Product View", "Add to Cart", "Payment"]}
                  data={[
                    [
                      { x: "01 Feb", y: 150 },
                      { x: "02 Feb", y: 200 },
                      { x: "03 Feb", y: 250 },
                      { x: "04 Feb", y: 300 },
                      { x: "05 Feb", y: 350 },
                      { x: "06 Feb", y: 400 },
                      { x: "07 Feb", y: 450 },
                    ],
                    [
                      { x: "01 Feb", y: 100 },
                      { x: "02 Feb", y: 150 },
                      { x: "03 Feb", y: 200 },
                      { x: "04 Feb", y: 250 },
                      { x: "05 Feb", y: 300 },
                      { x: "06 Feb", y: 350 },
                      { x: "07 Feb", y: 400 },
                    ],
                    [
                      { x: "01 Feb", y: 50 },
                      { x: "02 Feb", y: 100 },
                      { x: "03 Feb", y: 150 },
                      { x: "04 Feb", y: 200 },
                      { x: "05 Feb", y: 250 },
                      { x: "06 Feb", y: 300 },
                      { x: "07 Feb", y: 350 },
                    ],
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

export default UserAnalyticsPage;
