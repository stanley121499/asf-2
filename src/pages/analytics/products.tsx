/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { useProductContext } from "../../context/product/ProductContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import PieChart from "../../components/analytics/PieChart";
import BarChart from "../../components/analytics/BarChart";
import ListWidget from "../../components/analytics/ListWidget";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";

const ProductAnalyticsPage: React.FC = function () {
  const { products, loading } = useProductContext();
  const { productMedias } = useProductMediaContext();
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
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Users
              </a>
              <a
                href="/analytics/products"
                className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">
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
                className="whitespace-nowrap text-xs text-grey-500 dark:text-grey-400 hover:underline px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">
                Users
              </a>
              <a
                href="/analytics/products"
                className="whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-500 hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-900">
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
                  title="Sale vs Stock"
                  dateRange="31 Nov - 31 Dec"
                  chartData={{
                    series: [158462, 189168],
                    labels: ["Stock", "Sale"],
                  }}
                />
                <PieChart
                  title="Price"
                  dateRange="31 Nov - 31 Dec"
                  chartData={{
                    labels: ["19.99", "29.99", "39.99", "49.99"],
                    series: [26, 33, 21, 15],
                  }}
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                  Monthly Sale vs Stock
                </h2>
                <BarChart
                  total={1000}
                  description="Active Users"
                  titles={["Add to Cart", "Checkout"]}
                  data={[
                    [
                      { x: "Jan", y: 30 },
                      { x: "Feb", y: 40 },
                      { x: "Mar", y: 35 },
                      { x: "Apr", y: 50 },
                      { x: "May", y: 40 },
                      { x: "Jun", y: 55 },
                      { x: "Jul", y: 60 },
                      { x: "Aug", y: 70 },
                      { x: "Sep", y: 80 },
                      { x: "Oct", y: 90 },
                      { x: "Nov", y: 100 },
                      { x: "Dec", y: 110 },
                    ],
                    [
                      { x: "Jan", y: 20 },
                      { x: "Feb", y: 30 },
                      { x: "Mar", y: 25 },
                      { x: "Apr", y: 40 },
                      { x: "May", y: 30 },
                      { x: "Jun", y: 45 },
                      { x: "Jul", y: 50 },
                      { x: "Aug", y: 60 },
                      { x: "Sep", y: 70 },
                      { x: "Oct", y: 80 },
                      { x: "Nov", y: 90 },
                      { x: "Dec", y: 100 },
                    ],
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                <ListWidget
                  title="Best Performing Products"
                  listData={[
                    ...products.flatMap((product) =>
                      Array(10)
                        .fill(null)
                        .map((_, index) => ({
                          ...product,
                          media_url: productMedias.find(
                            (media) => media.product_id === product.id
                          )?.media_url,
                          title: `${product.name}`,
                          amount: product.price,
                          unit: "units",
                        }))
                    ),
                  ]}
                  redirectUrl="/analytics/products-inner/123"
                />{" "}
                <ListWidget
                  title="Highest Unsellable Products"
                  listData={[
                    ...products.flatMap((product) =>
                      Array(10)
                        .fill(null)
                        .map((_, index) => ({
                          ...product,
                          media_url: productMedias.find(
                            (media) => media.product_id === product.id
                          )?.media_url,
                          title: `${product.name}`,
                          amount: product.price,
                          unit: "units",
                        }))
                    ),
                  ]}
                  redirectUrl="/analytics/products-inner/123"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                <ListWidget
                  title="Best State"
                  listData={[
                    {
                      title: "Johor",
                      amount: 5090,
                      unit: "MYR",
                    },
                    {
                      title: "Kedah",
                      amount: 4890,
                      unit: "MYR",
                    },
                    {
                      title: "Kelantan",
                      amount: 4590,
                      unit: "MYR",
                    },
                    {
                      title: "Kuala Lumpur",
                      amount: 4290,
                      unit: "MYR",
                    },
                    {
                      title: "Labuan",
                      amount: 4090,
                      unit: "MYR",
                    },
                  ]}
                />{" "}
                <ListWidget 
                title="Best City"
                listData={[
                  {
                    title: "Kuala Lumpur",
                    amount: 5090,
                    unit: "MYR",
                  },
                  {
                    title: "Petaling Jaya",
                    amount: 4890,
                    unit: "MYR",
                  },
                  {
                    title: "Shah Alam",
                    amount: 4590,
                    unit: "MYR",
                  },
                  {
                    title: "Klang",
                    amount: 4290,
                    unit: "MYR",
                  },
                  {
                    title: "Subang Jaya",
                    amount: 4090,
                    unit: "MYR",
                  }]}
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

export default ProductAnalyticsPage;
