import React from "react";
import { useParams } from "react-router-dom";
import { useProductPurchaseOrderContext } from "../../context/product/ProductPurchaseOrderContext";
import LoadingPage from "../pages/loading";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { Button, Table } from "flowbite-react";

const ViewPurchaseOrderPage: React.FC = function () {
  const { purchaseOrderId } = useParams();
  const { product_purchase_orders, loading } = useProductPurchaseOrderContext();
  const purchaseOrder = product_purchase_orders.find(
    (r) => r.id === purchaseOrderId
  );

  if (loading) {
    return <LoadingPage />;
  }

  if (!purchaseOrder) {
    return (
      <NavbarSidebarLayout>
        <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <h1 className="text-xl text-gray-900 dark:text-white sm:text-2xl">
                  Purchase Order Not Found
                </h1>
              </div>
            </div>
          </div>
        </div>
      </NavbarSidebarLayout>
    );
  }

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <h1 className="text-xl text-gray-900 dark:text-white sm:text-2xl">
                Purchase Order
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
      <div className="mx-auto mt-5 w-full p-4">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle gap-4">
            <div className="overflow-auto scrollbar-hide w-full">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-lg mb-2">
                Purchase Order Details
              </h1>
              <div
                className="overflow-auto hide-scrollbar"
                style={{ maxHeight: "calc(100vh - 4rem)" }}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="col-span-1">
                    {/* Brand */}
                    <div>
                      <p className="text-md text-gray-600 dark:text-gray-400">
                        <strong>Brand</strong> {purchaseOrder.brand}
                      </p>
                    </div>

                    {/* Order No */}
                    <div>
                      <p className="text-md text-gray-600 dark:text-gray-400">
                        <strong>Order No</strong> {purchaseOrder.order_no}
                      </p>
                    </div>

                    {/* Salesman No */}
                    <div>
                      <p className="text-md text-gray-600 dark:text-gray-400">
                        <strong>Salesman No</strong> {purchaseOrder.salesman_no}
                      </p>
                    </div>

                    {/* Terms */}
                    <div>
                      <p className="text-md text-gray-600 dark:text-gray-400">
                        <strong>Terms</strong> {purchaseOrder.terms}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-1">
                    {/* Delivery Address */}
                    <div>
                      <p className="text-md text-gray-600 dark:text-gray-400">
                        <strong>Delivery Address</strong>{" "}
                        {purchaseOrder.delivery_address}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-1">
                    {/* Purchase Order No */}
                    <div>
                      <p className="text-md text-gray-600 dark:text-gray-400">
                        <strong>Purchase Order No</strong>{" "}
                        {purchaseOrder.purchase_order_no}
                      </p>
                      {/* Order Date */}
                      <div>
                        <p className="text-md text-gray-600 dark:text-gray-400">
                          <strong>Order Date</strong>{" "}
                          {purchaseOrder.order_date
                            ? new Date(
                                purchaseOrder.order_date
                              ).toLocaleDateString()
                            : ""}
                        </p>
                      </div>

                      {/* Delivery Date */}
                      <div>
                        <p className="text-md text-gray-600 dark:text-gray-400">
                          <strong>Delivery Date</strong>{" "}
                          {purchaseOrder.delivery_date
                            ? new Date(
                                purchaseOrder.delivery_date
                              ).toLocaleDateString()
                            : ""}
                        </p>
                      </div>

                      {/* Shipping Date */}
                      <div>
                        <p className="text-md text-gray-600 dark:text-gray-400">
                          <strong>Shipping Date</strong>{" "}
                          {purchaseOrder.shipping_date
                            ? new Date(
                                purchaseOrder.shipping_date
                              ).toLocaleDateString()
                            : ""}
                        </p>
                      </div>

                      {/* Cancel Date */}
                      <div>
                        <p className="text-md text-gray-600 dark:text-gray-400">
                          <strong>Cancel Date</strong>{" "}
                          {purchaseOrder.cancel_date
                            ? new Date(
                                purchaseOrder.cancel_date
                              ).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generate A table for them to add each purchase order entries */}
                <div className="mt-4">
                  <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <Table.Head className="bg-gray-100 dark:bg-gray-700">
                      <Table.HeadCell>Supplier Article</Table.HeadCell>
                      <Table.HeadCell>Article No</Table.HeadCell>
                      <Table.HeadCell>Color</Table.HeadCell>
                      {purchaseOrder.items[0]?.sizes.map((size: any) => (
                        <Table.HeadCell key={size.id}>
                          {size.size}
                        </Table.HeadCell>
                      ))}
                      <Table.HeadCell>Total</Table.HeadCell>
                      <Table.HeadCell>Set</Table.HeadCell>
                      <Table.HeadCell>Unit Price</Table.HeadCell>
                      <Table.HeadCell>Total Qty</Table.HeadCell>
                      <Table.HeadCell>Amount</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                      {purchaseOrder.items.map((item: any) => (
                        <Table.Row key={item.id}>
                          <Table.Cell>{item.supplier_article}</Table.Cell>
                          <Table.Cell>{item.article_no}</Table.Cell>
                          <Table.Cell>{item.color[0].color}</Table.Cell>
                          {item.sizes.map((size: any, index:any) => (
                            <Table.Cell key={index}>
                              {size.quantity}
                            </Table.Cell>
                          ))}
                          <Table.Cell>{item.sizes.reduce((acc: any, size: any) => acc + size.quantity, 0)}</Table.Cell>
                          <Table.Cell>{item.set}</Table.Cell>
                          <Table.Cell>{item.unit_price}</Table.Cell>
                          <Table.Cell>{item.sizes.reduce((acc: any, size: any) => acc + size.quantity, 0) * item.set}</Table.Cell>
                          <Table.Cell>{item.amount}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              {/* <Button
                color={"primary"}
                className="mt-4 w-40"
                onClick={() => {
                  window.print();
                }}>
                Print
              </Button> */}

              <Button
                color={"red"}
                className="mt-4 w-40"
                onClick={() => {
                  window.history.back();
                }}>
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default ViewPurchaseOrderPage;
