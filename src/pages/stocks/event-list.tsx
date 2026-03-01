/* eslint-disable jsx-a11y/anchor-is-valid */
import { Badge, Button, Label, Datepicker, Select } from "flowbite-react";
import React from "react";
import {
  ProductEvent,
  useProductEventContext,
} from "../../context/product/ProductEventContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useNavigate } from "react-router-dom";

const StockAllProductEventPage: React.FC = function () {
  const { productEvents, loading } = useProductEventContext();
  const [startDate, setStartDate] = React.useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = React.useState(new Date());
  const [type, setType] = React.useState("all");

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
                All Product Event
              </h1>
              <a
                href="/stocks/overview"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Overview
              </a>
              <a
                href="/stocks/all"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                All Product
              </a>
              {/* Schedule */}
              <a
                href="/stocks/reports"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Reports
              </a>
              {/* Product Events */}
              <a
                href="/stocks/events"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Product Events
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              <div className="flex items-center p-4 gap-4">
                <div>
                  <Label>Start Date</Label>
                  {/* Start Date */}
                  <Datepicker
                    onSelectedDateChanged={(date) => setStartDate(date)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  {/* End Date */}
                  <Datepicker
                    onSelectedDateChanged={(date) => setEndDate(date)}
                  />
                </div>
                <div>
                  {/* Select Type */}
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value)}>
                    <option value="all">All</option>
                    <option value="Low">Low</option>
                    <option value="Fast">Fast</option>
                    <option value="Normal">Normal</option>
                    <option value="Keep Stock">Keep Stock</option>
                    <option value="Hold">Hold</option>
                  </Select>
                </div>
              </div>
              {productEvents.length > 0 ? (
                <ProductEventsTable
                  productEvents={productEvents.filter((productEvent) => {
                    const eventDate = new Date(productEvent.created_at);
                    return (
                      eventDate >= startDate &&
                      eventDate <= endDate &&
                      (type === "all" || productEvent.type === type)
                    );
                  })}
                />
              ) : (
                <>
                  <img
                    src="/images/illustrations/404.svg"
                    alt="No productEvents found"
                    className="mx-auto"
                  />
                  <div className="p-4 text-center">No Product Events found</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

interface ProductEventsTableProps {
  productEvents: ProductEvent[];
}

const ProductEventsTable: React.FC<ProductEventsTableProps> = function ({
  productEvents,
}) {
  const { productMedias } = useProductMediaContext();
  const navigate = useNavigate();

  const productMediaMap = React.useMemo<Map<string, string>>(
    () => new Map(productMedias.map((m) => [m.product_id, m.media_url ?? ""])),
    [productMedias]
  );

  return (
    <div>
      {productEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1 max-h-[calc(100vh-167px)] overflow-y-auto hide-scrollbar">
          {productEvents.map((productEvent) => (
            <div
              key={productEvent.id}
              style={{ height: `calc((100vh - 167px) / 8)` }}
              onClick={() => {
                // Navigate to ProductStockDetails page
                navigate(`/products/stock/${productEvent.product.id}`);
              }}
              className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
              <div className="flex items-center gap-4">
                <img
                  src={productMediaMap.get(productEvent.product.id) ?? ""}
                  alt={productEvent.product.name}
                  className="w-16 h-16 object-cover rounded-md"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex flex-col">
                  <div className="flex gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                      {productEvent.product.name}
                    </h2>
                    <Badge color={getBadgeColor(productEvent.type)}>
                      {productEvent.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(productEvent.created_at).toDateString()}
                  </p>
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
                      <Button
                        color="success"
                        href={`/stocks/purchase-orders/${productEvent.purchase_order_id}`}>
                        View PO
                      </Button>
                    )}
                    {productEvent.report_id && (
                      <Button
                        color="success"
                        href={`/stocks/report/${productEvent.report_id}`}>
                        View Report
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <img
            src="/images/illustrations/404.svg"
            alt="No productEvents found"
            className="mx-auto"
          />
          <div className="p-4 text-center">No productEvents found</div>
        </>
      )}
    </div>
  );
};

const getBadgeColor = (status: string) => {
  // Low | Fast | Normal | Keep Stock | Hold
  switch (status) {
    case "Low":
      return "red";
    case "Fast":
      return "yellow";
    case "Normal":
      return "green";
    case "Keep Stock":
      return "blue";
    case "Hold":
      return "gray";
    default:
      return "gray";
  }
};

export default StockAllProductEventPage;
