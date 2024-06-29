/* eslint-disable jsx-a11y/anchor-is-valid */
import { Badge, Button, Card, Label, TextInput } from "flowbite-react";
import React from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import {
  useProductContext,
  Products,
  Product,
} from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import { IoIosSearch } from "react-icons/io";
import { HiPlus } from "react-icons/hi";
import ProductComponent from "../../components/product/product";

const StockOverviewPage: React.FC = function () {
  const { products, loading } = useProductContext();
  const [searchValue, setSearchValue] = React.useState("");
  const [productData, setProductData] = React.useState<Product | null>(null);
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
                Stock Overview
              </h1>
              <a
                href="/stocks/overview"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Overview
              </a>
              <a
                href="/stocks/all"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                All Products
              </a>
              {/* Schedule */}
              <a
                href="/stocks/reports"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Reports
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <div className="overflow-auto scrollbar-hide">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-lg mb-2">
                  Stock Running Low
                </h1>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1 max-h-[calc(100vh-167px)] overflow-y-auto hide-scrollbar">
                  {products.flatMap((product) =>
                    Array(10)
                      .fill(null)
                      .map((_, index) => (
                        <div
                          key={`${product.id}-${index}`}
                          style={{ height: `calc((100vh - 167px) / 8)` }}
                          className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <img
                              src={
                                productMedias.find(
                                  (media) => media.product_id === product.id
                                )?.media_url
                              }
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                              {product.name}
                            </h2>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button
                              color={"info"}
                              className="w-40"
                              href={`/stocks/purchase-orders/create/${product.id}`}>
                              Create PO
                            </Button>
                            <Button
                              className="w-40"
                              color={"red"}
                              href={`/stocks/report/create/${product.id}`}>
                              Create Report
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-2">
              <div className="overflow-auto scrollbar-hide">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-lg mb-2">
                  Stock Hold For Too Long
                </h1>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1 max-h-[calc(100vh-167px)] overflow-y-auto hide-scrollbar">
                  {products.flatMap((product) =>
                    Array(10)
                      .fill(null)
                      .map((_, index) => (
                        <div
                          key={`${product.id}-${index}`}
                          style={{ height: `calc((100vh - 167px) / 8)` }}
                          className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <img
                              src={
                                productMedias.find(
                                  (media) => media.product_id === product.id
                                )?.media_url
                              }
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                            <div>
                              <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                                {product.name}
                              </h2>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate text-ellipsis whitespace-nowrap">
                                {product.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Total Stock: {product.stock_count}
                            </p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

export default StockOverviewPage;
