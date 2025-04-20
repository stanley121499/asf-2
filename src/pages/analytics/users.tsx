/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { useProductContext } from "../../context/product/ProductContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import PieChart from "../../components/analytics/PieChart";
import LineChart from "../../components/analytics/LineChart";
import BarChart from "../../components/analytics/BarChart";

const UserAnalyticsPage: React.FC = function () {
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
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Support
              </a>
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
