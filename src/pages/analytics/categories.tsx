/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { useProductContext } from "../../context/product/ProductContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import LineChart from "../../components/analytics/LineChart";

const CategoriesAnalyticsPage: React.FC = function () {
  const { products, loading } = useProductContext();
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

  console.log(products);

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
                className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">
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
                className="whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-500 hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-900">
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
              {/* Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                <div>
                  <h2 className="mb-1 text-2xl font-bold leading-none text-gray-900 dark:text-white">
                    Department
                  </h2>
                  <LineChart
                    titleData={[
                      { title: "Sold", value: 9210, unit: "pcs" },
                      { title: "Sales", value: 124567, unit: "MYR" },
                    ]}
                    chartData={[
                      {
                        name: "Men",
                        data: [320, 432, 501, 534, 390, 730, 810],
                      },
                      {
                        name: "Women",
                        data: [520, 682, 791, 934, 1090, 1230, 1410],
                      },
                    ]}
                    dateRange="31 Nov - 31 Dec"
                  />
                </div>

                {/* Brand */}
                <div>
                  <h2 className="mb-1 text-2xl font-bold leading-none text-gray-900 dark:text-white">
                    Brand
                  </h2>
                  <LineChart
                    titleData={[
                      { title: "Sold", value: 17845, unit: "pcs" },
                      { title: "Sales", value: 267980, unit: "MYR" },
                    ]}
                    chartData={[
                      {
                        name: "Adidas",
                        data: [420, 532, 601, 734, 690, 830, 910],
                      },
                      {
                        name: "Nike",
                        data: [620, 782, 891, 1034, 1190, 1330, 1510],
                      },
                      {
                        name: "Puma",
                        data: [320, 412, 501, 654, 790, 820, 900],
                      },
                      {
                        name: "Reebok",
                        data: [180, 232, 310, 390, 410, 560, 680],
                      },
                      {
                        name: "Under Armour",
                        data: [290, 354, 400, 534, 600, 780, 890],
                      },
                    ]}
                    dateRange="31 Nov - 31 Dec"
                  />
                </div>
              </div>

              {/* Seasonal Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                <div>
                  <h2 className="mb-1 text-2xl font-bold leading-none text-gray-900 dark:text-white">
                    Seasonal Sales
                  </h2>
                  <LineChart
                    titleData={[
                      { title: "Sold", value: 15234, unit: "pcs" },
                      { title: "Sales", value: 212345, unit: "MYR" },
                    ]}
                    chartData={[
                      {
                        name: "Spring",
                        data: [320, 450, 520, 610, 730, 850, 910],
                      },
                      {
                        name: "Summer",
                        data: [540, 680, 750, 820, 940, 1120, 1230],
                      },
                      {
                        name: "Fall",
                        data: [290, 350, 430, 540, 680, 750, 830],
                      },
                      {
                        name: "Winter",
                        data: [380, 460, 550, 630, 720, 890, 950],
                      },
                      {
                        name: "Holiday",
                        data: [620, 730, 890, 1020, 1180, 1350, 1490],
                      },
                    ]}
                    dateRange="31 Nov - 31 Dec"
                  />
                </div>

                {/* Categories */}
                <div>
                  <h2 className="mb-1 text-2xl font-bold leading-none text-gray-900 dark:text-white">
                    Product Category
                  </h2>
                  <LineChart
                    titleData={[
                      { title: "Sold", value: 13450, unit: "pcs" },
                      { title: "Sales", value: 187950, unit: "MYR" },
                    ]}
                    chartData={[
                      {
                        name: "Shoes",
                        data: [560, 680, 790, 850, 920, 1100, 1250],
                      },
                      {
                        name: "Accessories",
                        data: [320, 410, 500, 620, 730, 850, 920],
                      },
                      {
                        name: "Clothing",
                        data: [480, 540, 650, 730, 850, 970, 1080],
                      },
                      {
                        name: "Sportswear",
                        data: [390, 480, 580, 670, 790, 890, 970],
                      },
                    ]}
                    dateRange="31 Nov - 31 Dec"
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                <div>
                  <h2 className="mb-1 text-2xl font-bold leading-none text-gray-900 dark:text-white">
                    Popular Colors
                  </h2>
                  <LineChart
                    titleData={[
                      { title: "Sold", value: 11230, unit: "pcs" },
                      { title: "Sales", value: 167845, unit: "MYR" },
                    ]}
                    chartData={[
                      {
                        name: "Black",
                        data: [680, 750, 820, 910, 1030, 1120, 1250],
                      },
                      {
                        name: "White",
                        data: [540, 610, 700, 820, 910, 1030, 1120],
                      },
                      {
                        name: "Red",
                        data: [320, 400, 450, 520, 630, 750, 820],
                      },
                      {
                        name: "Blue",
                        data: [290, 350, 430, 520, 610, 720, 810],
                      },
                    ]}
                    dateRange="31 Nov - 31 Dec"
                  />
                </div>
                <div>
                  <h2 className="mb-1 text-2xl font-bold leading-none text-gray-900 dark:text-white">
                    Sizes
                  </h2>
                  <LineChart
                    titleData={[
                      { title: "Sold", value: 10456, unit: "pcs" },
                      { title: "Sales", value: 187560, unit: "MYR" },
                    ]}
                    chartData={[
                      { name: "XS", data: [120, 150, 180, 210, 250, 290, 320] },
                      { name: "S", data: [220, 270, 300, 350, 420, 490, 550] },
                      { name: "M", data: [310, 380, 420, 460, 510, 580, 620] },
                      { name: "L", data: [400, 460, 520, 580, 640, 710, 780] },
                      { name: "XL", data: [350, 410, 470, 520, 580, 650, 720] },
                      {
                        name: "XXL",
                        data: [200, 250, 300, 350, 400, 460, 510],
                      },
                    ]}
                    dateRange="31 Nov - 31 Dec"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default CategoriesAnalyticsPage;
