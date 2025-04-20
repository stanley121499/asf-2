/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
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
