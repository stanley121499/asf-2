/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { useProductContext } from "../../context/product/ProductContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import PieChart from "../../components/analytics/PieChart";
import BarChart from "../../components/analytics/BarChart";
import ListWidget from "../../components/analytics/ListWidget";
import LineChart from "../../components/analytics/LineChart";

const CategoriesInnerAnalyticsPage: React.FC = function () {
  const { products, loading } = useProductContext();

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
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              <LineChart
                dateRange="31 Nov - 31 Dec"
              />
              <LineChart
                dateRange="31 Nov - 31 Dec"
              />
              <LineChart
                dateRange="31 Nov - 31 Dec"
              />
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

export default CategoriesInnerAnalyticsPage;
