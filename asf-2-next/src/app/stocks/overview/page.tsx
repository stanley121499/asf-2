"use client";
import { ProductContextBundle } from "@/context/RouteContextBundles";

/* eslint-disable jsx-a11y/anchor-is-valid */
import { Badge, Button } from "flowbite-react";
import React from "react";
import { useRouter } from "next/navigation";
import { useProductEventContext } from "@/context/product/ProductEventContext";
import { useProductMediaContext } from "@/context/product/ProductMediaContext";
import { useProductPurchaseOrderContext } from "@/context/product/ProductPurchaseOrderContext";
import { useProductReportContext } from "@/context/product/ProductReportContext";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import LoadingPage from "@/app/loading";
import {
  MOCK_PRODUCT_EVENTS,
  MOCK_PURCHASE_ORDERS,
  MOCK_PRODUCT_REPORTS,
} from "@/app/stocks/_lib/stocksMock";

const StockOverviewPage: React.FC = () => {
  const { productEvents: rawProductEvents, loading: eventsLoading } = useProductEventContext();
  const { productMedias } = useProductMediaContext();
  const { product_purchase_orders: rawPurchaseOrders } = useProductPurchaseOrderContext();
  const { product_reports: rawReports } = useProductReportContext();
  const router = useRouter();

  /**
   * Fall back to mock data when DB returns nothing useful.
   * We check not just emptiness but also whether any real events have the four
   * type values this page actually renders — if the DB has events with unknown
   * types, all four sections would still show "No items", so we fall back.
   * PO sources must stay consistent with the event source so ID lookups work.
   */
  const OVERVIEW_TYPES = new Set(["Low", "Keep Stock", "Fast", "Normal"]);
  const hasMatchingRealEvents = rawProductEvents.some(
    (e) => OVERVIEW_TYPES.has(e.type ?? "")
  );
  const usingMockEvents = !hasMatchingRealEvents;
  const productEvents = usingMockEvents ? MOCK_PRODUCT_EVENTS : rawProductEvents;
  const usingMockPOs = rawPurchaseOrders.length === 0;
  const product_purchase_orders = usingMockPOs ? MOCK_PURCHASE_ORDERS : rawPurchaseOrders;
  const product_reports = rawReports.length > 0 ? rawReports : MOCK_PRODUCT_REPORTS;

  const productMediaMap = React.useMemo<Map<string, string>>(
    () => new Map(productMedias.map((m) => [m.product_id, m.media_url ?? ""])),
    [productMedias]
  );

  if (eventsLoading) {
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
          {productEvents.filter((productEvent) => productEvent.type === type).length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">No items.</p>
          )}
          {productEvents
            .filter((productEvent) => productEvent.type === type)
            .map((productEvent) => (
              <div
                key={productEvent.id}
                style={{ height: `calc((100vh - 167px) / 8)` }}
                onClick={() =>
                  router.push(`/products/stock/${productEvent.product.id}`)
                }
                className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <div className="flex items-center gap-4">
                  {productMediaMap.get(productEvent.product.id) ? (
                    <img
                      src={productMediaMap.get(productEvent.product.id)}
                      alt={productEvent.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-gray-400 dark:text-gray-500 select-none">
                        {productEvent.product.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
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
            ))}
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
            {(
              [
                { label: "Overview", href: "/stocks/overview" },
                { label: "All Products", href: "/stocks/all" },
                { label: "Reports", href: "/stocks/reports" },
              ] as const
            ).map(({ label, href }) => (
              <a
                key={href}
                href={href}
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

export default function WrappedStockOverviewPage(props: any) {
  return (
    <ProductContextBundle>
      <StockOverviewPage {...props} />
    </ProductContextBundle>
  );
}

