/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { useProductContext } from "../../context/product/ProductContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import PieChart from "../../components/analytics/PieChart";
import LineChart from "../../components/analytics/LineChart";
import BarChart from "../../components/analytics/BarChart";

const SupportAnalyticsPage: React.FC = function () {
  const { loading } = useProductContext();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
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
                  title="Ticket Priority"
                  dateRange="31 Nov - 31 Dec"
                  chartData={{
                    labels: ["Low", "Medium", "High", "Critical"],
                    series: [30, 40, 20, 10],
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
    </NavbarSidebarLayout>
  );
};

export default SupportAnalyticsPage; 