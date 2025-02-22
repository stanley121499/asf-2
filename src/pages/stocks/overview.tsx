/* eslint-disable jsx-a11y/anchor-is-valid */
import { Badge, Button } from "flowbite-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useProductEventContext } from "../../context/product/ProductEventContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import { useProductPurchaseOrderContext } from "../../context/product/ProductPurchaseOrderContext";
import { useProductReportContext } from "../../context/product/ProductReportContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";

const StockOverviewPage: React.FC = () => {
  const { productEvents } = useProductEventContext();
  const { productMedias } = useProductMediaContext();
  const { product_purchase_orders } = useProductPurchaseOrderContext();
  const { product_reports } = useProductReportContext();
  const navigate = useNavigate();

  if (!productEvents || productEvents.length === 0) {
    return <LoadingPage />;
  }

  /** 🔹 Reusable Stock Section Component */
  const StockSection = ({ title, type }: { title: string; type: string }) => (
    <div className="col-span-2">
      <div className="overflow-auto scrollbar-hide">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-lg mb-2">
          {title}
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1 max-h-[calc(50vh-108px)] overflow-y-auto hide-scrollbar">
          {productEvents
            .filter((productEvent) => productEvent.type === type)
            .flatMap((productEvent) =>
              Array(10)
                .fill(null)
                .map((_, index) => (
                  <div
                    key={`${productEvent.id}-${index}`}
                    style={{ height: `calc((100vh - 167px) / 8)` }}
                    onClick={() =>
                      navigate(`/products/stock/${productEvent.product.id}`)
                    }
                    className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          productMedias.find(
                            (media) =>
                              media.product_id === productEvent.product.id
                          )?.media_url
                        }
                        alt={productEvent.product.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                          {productEvent.product.name}
                        </h2>
                        {productEvent.product.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {productEvent.product.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {!productEvent.purchase_order_id &&
                      !productEvent.report_id ? (
                        <>
                          <Button
                            color="info"
                            className="w-40"
                            href={`/stocks/purchase-orders/create/${productEvent.product.id}/${productEvent.id}`}>
                            Create PO
                          </Button>
                          <Button
                            className="w-40"
                            color="red"
                            href={`/stocks/report/create/${productEvent.product.id}/${productEvent.id}`}>
                            Create Report
                          </Button>
                        </>
                      ) : (
                        <>
                          {productEvent.purchase_order_id && (
                            <div className="flex items-center gap-2">
                              {/* Show badge of the status of the purchase order */}
                              {getBadge(
                                product_purchase_orders.find(
                                  (po) =>
                                    po.id === productEvent.purchase_order_id
                                )?.status!
                              )}
                              <Button
                                color="success"
                                href={`/stocks/purchase-orders/${productEvent.purchase_order_id}`}>
                                View PO
                              </Button>
                            </div>
                          )}
                          {productEvent.report_id && (
                            <div className="flex items-center gap-2">
                              {/* Show badge of the status of the report */}
                              {getBadge(
                                product_reports.find(
                                  (report) =>
                                    report.id === productEvent.report_id
                                )?.status!
                              )}
                              <Button
                                color="success"
                                href={`/stocks/report/${productEvent.report_id}`}>
                                View Report
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
            )}
        </div>
      </div>
    </div>
  );

  return (
    <NavbarSidebarLayout>
      {/* 🔹 Top Navigation Links */}
      <div className="block border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center gap-x-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Stock Overview
            </h1>
            {["Overview", "All Products", "Reports"].map((label, i) => (
              <a
                key={i}
                href={`/stocks/${label.toLowerCase().replace(" ", "-")}`}
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 🔹 Stock Overview Sections */}
      <div className="flex flex-col p-4">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-4 gap-4">
            <StockSection title="Stock Running Low" type="Low" />
            <StockSection title="Stock Hold For Too Long" type="Keep Stock" />
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-4 gap-4">
            <StockSection title="Fast Moving Stock" type="Fast" />
            <StockSection title="Normal Stock" type="Normal" />
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

const getBadge = (status: string) => {
  // STATUS: "PENDING", "APPROVED", "REJECTED"
  switch (status) {
    case "PENDING":
      return <Badge color="warning">Pending</Badge>;
    case "APPROVED":
      return <Badge color="success">Approved</Badge>;
    case "REJECTED":
      return <Badge color="danger">Rejected</Badge>;
    default:
      return <Badge color="info">Unknown</Badge>;
  }
};
export default StockOverviewPage;
