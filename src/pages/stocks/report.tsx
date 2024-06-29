/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Label, TextInput } from "flowbite-react";
import React from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useProductContext } from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import { IoIosSearch } from "react-icons/io";
import { useProductPurchaseOrderContext } from "../../context/product/ProductPurchaseOrderContext";
import { useProductReportContext } from "../../context/product/ProductReportContext";

const StockReportPage: React.FC = function () {
  const { products, loading } = useProductContext();
  const { productMedias } = useProductMediaContext();
  const [searchPurchaseOrder, setSearchPurchaseOrder] = React.useState("");
  const [searchReport, setSearchReport] = React.useState("");
  const { product_purchase_orders } = useProductPurchaseOrderContext();
  const { product_reports } = useProductReportContext();

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
            <div className="col-span-4">
              <div className="overflow-auto scrollbar-hide">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-lg mb-2">
                  Stock Selling Fast
                </h1>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1 max-h-[calc(50vh-137px)] overflow-y-auto hide-scrollbar">
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
                            <Button className="w-40" color={"red"}>
                              Create Report
                            </Button>
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
      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <div className="overflow-auto scrollbar-hide">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-lg mb-2">
                  Reports
                </h1>
                <form className="lg:pr-3">
                  <Label htmlFor="posts-search" className="sr-only">
                    Search
                  </Label>
                  <div className="relative mt-1">
                    <TextInput
                      id="posts-search"
                      name="posts-search"
                      placeholder="Search for Posts"
                      className="w-full mb-4"
                      style={{ background: "transparent" }}
                      value={searchReport}
                      icon={IoIosSearch}
                      onChange={(e) => setSearchReport(e.target.value)}
                    />
                  </div>
                </form>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1 max-h-[calc(50vh-137px)] overflow-y-auto hide-scrollbar">
                  {product_reports.flatMap((report) =>
                    Array(10)
                      .fill(null)
                      .map((_, index) => (
                        <div
                          key={`${report.id}-${index}`}
                          style={{ height: `calc((100vh - 167px) / 8)` }}
                          className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div>
                              <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                                {report.id}
                              </h2>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate text-ellipsis whitespace-nowrap">
                                {new Date(
                                  report.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button
                              color={"info"}
                              className="w-40"
                              href={`/stocks/report/${report.id}`}>
                              View
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
                  Purchase Order
                </h1>
                <form className="lg:pr-3">
                  <Label htmlFor="posts-search" className="sr-only">
                    Search
                  </Label>
                  <div className="relative mt-1">
                    <TextInput
                      id="posts-search"
                      name="posts-search"
                      placeholder="Search for Posts"
                      className="w-full mb-4"
                      style={{ background: "transparent" }}
                      value={searchPurchaseOrder}
                      icon={IoIosSearch}
                      onChange={(e) => setSearchPurchaseOrder(e.target.value)}
                    />
                  </div>
                </form>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1 max-h-[calc(50vh-137px)] overflow-y-auto hide-scrollbar">
                  {product_purchase_orders.flatMap((purchase_order) =>
                    Array(10)
                      .fill(null)
                      .map((_, index) => (
                        <div
                          key={`${purchase_order.id}-${index}`}
                          style={{ height: `calc((100vh - 167px) / 8)` }}
                          className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div>
                              <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                                {purchase_order.purchase_order_no}
                              </h2>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate text-ellipsis whitespace-nowrap">
                                {new Date(
                                  purchase_order.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button
                              color={"info"}
                              className="w-40"
                              href={`/stocks/purchase-orders/${purchase_order.id}`}>
                              View
                            </Button>
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

export default StockReportPage;
