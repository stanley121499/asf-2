import React, { useEffect } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import {
  useProductContext,
  Product,
} from "../../context/product/ProductContext";
import { useParams } from "react-router-dom";
import {
  useProductPurchaseOrderContext,
  ProductPurchaseOrderInsert,
} from "../../context/product/ProductPurchaseOrderContext";
import {
  Button,
  Datepicker,
  Label,
  Select,
  Table,
  TextInput,
  Textarea,
} from "flowbite-react";
import { useProductEventContext } from "../../context/product/ProductEventContext";

const CreatePurchaseOrderPage: React.FC = function () {
  const { products, loading } = useProductContext();
  const { createProductPurchaseOrder } = useProductPurchaseOrderContext();
  const { productId, productEventId } = useParams();
  const { updateProductEvent } = useProductEventContext();
  const [formData, setFormData] = React.useState<ProductPurchaseOrderInsert>({
    product_id: productId || "",
    product_event: productEventId || "",
  });
  const [productData, setProductData] = React.useState<Product | undefined>(
    undefined
  );
  const [productOrderEntries, setProductOrderEntries] = React.useState<any[]>(
    []
  );

  console.log(productId, productEventId);

  useEffect(() => {
    if (products) {
      const product = products.find((product) => product.id === productId);
      setProductData(product);
    }
  }, [productId, products]);

  if (loading || !productData) {
    return <LoadingPage />;
  }

  const savePurchaseOrder = async () => {
    const purchaseOrderData = {
      ...formData,
    };
    await createProductPurchaseOrder(
      purchaseOrderData,
      productOrderEntries
    ).then((data) => {
      if (data) {
        updateProductEvent({
          id: formData.product_event || "",
          purchase_order_id: data.id,
        }).then(() => {
          // Redirect to the user back to the previous page
          window.history.back();
        });
      }
    });
  };

  const addRow = () => {
    const newRow = {
      supplier_article: "",
      article_no: productData?.article_number || "",
      color_id: productData?.product_colors[0].id,
      sizes: [
        productData?.product_sizes.map((size: any) => ({
          size: size.id,
          quantity: 0,
        })),
      ],
      set: "",
      unit_price: "",
    };

    setProductOrderEntries([...productOrderEntries, newRow]);
  };

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Create PurchaseOrder
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

      <div className="flex flex-col p-4 h-[calc(100vh-6rem)]">
        <div className="overflow-x-auto h-full"> 
          <div className="inline-block min-w-full align-middle gap-4 h-full">
            <div className="overflow-auto scrollbar-hide w-full h-full">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-lg mb-2">
                Create Purchase Order
              </h1>
              <div
                className="overflow-auto hide-scrollbar"
                style={{ maxHeight: "calc(100vh - 4rem)" }}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="col-span-1">

                    {/* Brand */}
                    <div>
                      <Label className="mt-4">Brand</Label>
                      <TextInput
                        value={formData.brand || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            brand: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Order No */}
                    <div>
                      <Label className="mt-4">Order No</Label>
                      <TextInput
                        value={formData.order_no || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            order_no: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Salesman No */}
                    <div>
                      <Label className="mt-4">Salesman No</Label>
                      <TextInput
                        value={formData.salesman_no || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salesman_no: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Terms */}
                    <div>
                      <Label className="mt-4">Terms</Label>
                      <TextInput
                        value={formData.terms || ""}
                        type="number"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            terms: e.target.value as any,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-span-1">
                    {/* Delivery Address */}
                    <div>
                      <Label className="mt-4">Delivery Address</Label>
                      <Textarea
                        value={formData.delivery_address || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            delivery_address: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-span-1">
                    {/* Purchase Order No */}
                    <div>
                      <Label className="mt-4">Purchase Order No</Label>
                      <TextInput
                        value={formData.purchase_order_no || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchase_order_no: e.target.value,
                          })
                        }
                      />
                    </div>
                    {/* Order Date */}
                    <div>
                      <Label className="mt-4">Order Date</Label>
                      <Datepicker
                        onSelectedDateChanged={(e) => {
                          setFormData({
                            ...formData,
                            order_date: e.toISOString(),
                          });
                        }}
                      />
                    </div>

                    {/* Delivery Date */}
                    <div>
                      <Label className="mt-4">Delivery Date</Label>
                      <Datepicker
                        onSelectedDateChanged={(e) => {
                          setFormData({
                            ...formData,
                            delivery_date: e.toISOString(),
                          });
                        }}
                      />
                    </div>

                    {/* Shipping Date */}
                    <div>
                      <Label className="mt-4">Shipping Date</Label>
                      <Datepicker
                        onSelectedDateChanged={(e) => {
                          setFormData({
                            ...formData,
                            shipping_date: e.toISOString(),
                          });
                        }}
                      />
                    </div>

                    {/* Cancel Date */}
                    <div>
                      <Label className="mt-4">Cancel Date</Label>
                      <Datepicker
                        onSelectedDateChanged={(e) => {
                          setFormData({
                            ...formData,
                            cancel_date: e.toISOString(),
                          });
                        }}
                      />
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
                      {productData?.product_sizes.map((size: any) => (
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
                      {productOrderEntries.map((entry, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>
                            <TextInput
                              value={entry.supplier_article || ""}
                              onChange={(e) => {
                                const newEntries = [...productOrderEntries];
                                newEntries[index].supplier_article =
                                  e.target.value;
                                setProductOrderEntries(newEntries);
                              }}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <p className="text-sm">{entry.article_no}</p>
                          </Table.Cell>
                          <Table.Cell>
                            <Select
                              value={entry.color_id}
                              onChange={(e) => {
                                const newEntries = [...productOrderEntries];
                                newEntries[index].color = e.target.value;
                                setProductOrderEntries(newEntries);
                              }}>
                              {productData?.product_colors.map((color: any) => (
                                <option key={color.id} value={color.id}>
                                  {color.color}
                                </option>
                              ))}
                            </Select>
                          </Table.Cell>
                          {productData?.product_sizes.map(
                            (size: any, sizeIndex) => (
                              <Table.Cell key={size.id}>
                                <TextInput
                                  value={entry.sizes[sizeIndex].quantity || ""}
                                  onChange={(e) => {
                                    const newEntries = [...productOrderEntries];
                                    const newSize = {
                                      size: size.id,
                                      quantity: e.target.value,
                                    };
                                    newEntries[index].sizes[sizeIndex] =
                                      newSize;
                                    setProductOrderEntries(newEntries);
                                  }}
                                />
                              </Table.Cell>
                            )
                          )}
                          <Table.Cell>
                            <p className="text-sm">
                              {entry.sizes
                                .reduce(
                                  (acc: number, size: any) =>
                                    acc + size.quantity,
                                  0
                                )
                                .toString()}
                            </p>
                          </Table.Cell>
                          <Table.Cell>
                            <TextInput
                              value={entry.set || ""}
                              onChange={(e) => {
                                const newEntries = [...productOrderEntries];
                                newEntries[index].set = e.target.value as any;
                                setProductOrderEntries(newEntries);
                              }}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <TextInput
                              value={entry.unit_price || ""}
                              onChange={(e) => {
                                const newEntries = [...productOrderEntries];
                                newEntries[index].unit_price = e.target
                                  .value as any;
                                setProductOrderEntries(newEntries);
                              }}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            {/* Set x Total */}
                            <p className="text-sm">
                              {entry.set
                                ? entry.sizes.reduce(
                                    (acc: number, size: any) =>
                                      acc + size.quantity,
                                    0
                                  ) * entry.set
                                : ""}
                            </p>
                          </Table.Cell>
                          <Table.Cell>
                            {/* Unit Price x (total quantity) */}
                            <p className="text-sm">
                              {entry.unit_price
                                ? entry.sizes.reduce(
                                    (acc: number, size: any) =>
                                      acc + size.quantity * entry.set,
                                    0
                                  ) * entry.unit_price
                                : ""}
                            </p>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
                <div className="flex gap-4">
                  <Button className="mt-4" onClick={addRow} color="primary">
                    Add Row
                  </Button>
                  <Button
                    className="mt-4"
                    onClick={savePurchaseOrder}
                    color="primary">
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default CreatePurchaseOrderPage;
