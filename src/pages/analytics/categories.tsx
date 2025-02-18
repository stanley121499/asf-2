/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { useProductContext } from "../../context/product/ProductContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import LineChart from "../../components/analytics/LineChart";

const CategoriesAnalyticsPage: React.FC = function () {
  const { products, loading } = useProductContext();

  if (loading) {
    return <LoadingPage />;
  }

  console.log(products);

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
