import React, { useState } from "react";
import { useParams } from "react-router-dom";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { IoChevronBack } from "react-icons/io5";
import { useProductContext } from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import { Badge, Label, Select, Table } from "flowbite-react";
import { useProductStockLogContext } from "../../context/product/ProductStockLogContext";
import AddStockModal from "./add-stock-modal";
import AddReturnModal from "./add-return-modal";

const ProductStockDetails: React.FC = () => {
  const { productId } = useParams();
  const { products } = useProductContext();
  const { productMedias } = useProductMediaContext();
  const { productStockLogs } = useProductStockLogContext();
  const product = products.find((product) => product.id === productId);
  const productFirstImage = productMedias.find(
    (media) => media.product_id === productId
  );
  const [selectedColors, setSelectedColors] = useState<any>([]);
  const [selectedSizes, setSelectedSizes] = useState<any>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  if (!product || !productFirstImage) {
    return (
      <NavbarSidebarLayout>
        <div className="h-screen flex justify-center items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Product not found
          </h1>
        </div>
      </NavbarSidebarLayout>
    );
  }

  // Process logs to add running balance for the appropriate size and also add a balance that keeps track of the total stock
  const processedLogs = productStockLogs
    .filter((log) => log.product_stock.product_id === productId)
    .map((log, index) => {
      const previousLogs = productStockLogs
        .filter(
          (previousLog) =>
            previousLog.product_stock_id === log.product_stock_id &&
            new Date(previousLog.created_at) < new Date(log.created_at)
        )
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const previousBalance = previousLogs.reduce((prev, current) => {
        if (current.type === "Opening") {
          return current.amount;
        }
        if (current.type === "In Stock") {
          return prev + current.amount;
        }
        if (current.type === "Return") {
          return prev - current.amount;
        }
        return prev;
      }, 0);
      const balance = log.type === "In Stock" ? previousBalance + log.amount : previousBalance - log.amount;
      return { ...log, balance };
    });

  return (
    <NavbarSidebarLayout>
      <div className="h-screen grid grid-col-1 sm:grid-cols-4 gap-4">
        <div className="p-4 border-r border-gray-200 dark:border-gray-700 col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 flex-col w-full">
              <IoChevronBack
                onClick={() => window.history.back()}
                className="text-2xl text-gray-900 dark:text-white cursor-pointer"
              />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Product Details
              </h1>
              <img
                src={productFirstImage?.media_url}
                alt={product?.name}
                className="w-full h-64 object-cover rounded"
              />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                {product?.name}
              </h3>
              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300">
                {product?.description}
              </p>
              {/* Color */}
              <div className="flex gap-2 items-center">
                <Label color="info">Color: </Label>
                {product?.product_colors.map((color) => (
                  <Badge
                    key={color.id}
                    color="info"
                    className="mr-2 mb-1 flex items-center">
                    {color.color}
                  </Badge>
                ))}
              </div>
              {/* Size */}
              <div className="flex gap-2 items-center">
                <Label color="info">Size: </Label>
                {product?.product_sizes.map((size) => (
                  <Badge
                    key={size.id}
                    color="info"
                    className="mr-2 mb-1 flex items-center">
                    {size.size}
                  </Badge>
                ))}
              </div>
              {/* Category */}
              <div className="flex gap-2 items-center">
                <Label color="info">Category: </Label>
                {product?.product_categories.map((category) => (
                  <Badge
                    key={category.id}
                    color="info"
                    className="mr-2 mb-1 flex items-center">
                    {/* {category.name} */}
                  </Badge>
                ))}
              </div>
              {/* Price */}
              <div className="flex gap-2 items-center">
                <Label color="info">Price: </Label> RM{" "}
                {product?.price.toFixed(2)}
              </div>
              {/* Article Number */}
              <div className="flex gap-2 items-center">
                <Label color="info">Article Number: </Label>{" "}
                {product?.article_number}
              </div>
              {/* Stock Code */}
              <div className="flex gap-2 items-center">
                <Label color="info">Stock Code: </Label> {product?.stock_code}
              </div>
              {/* Stock Place */}
              <div className="flex gap-2 items-center">
                <Label color="info">Stock Place: </Label> {product?.stock_place}
              </div>
              {/* Season */}
              <div className="flex gap-2 items-center">
                <Label color="info">Season: </Label> {product?.season}
              </div>
              {/* Festival */}
              <div className="flex gap-2 items-center">
                <Label color="info">Festival: </Label> {product?.festival}
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-3 p-4">
          <div className="flex flex-col">
            <div className="flex justify-between w-full gap-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Product Stock
              </h1>
              <div className="flex gap-2 items-center">
                {/* Add Return Button */}
                <AddReturnModal product={product} />
                <AddStockModal product={product} />
              </div>
            </div>

            <div className="flex gap-4">
              {/* Filter areas */}
              {/* By Color: use badge to create pills that user can click to select */}
              <div className="flex gap-2 items-center">
                <Label color="info">Color: </Label>
                {product?.product_colors.map((color) => (
                  <Badge
                    key={color.id}
                    color={selectedColors.includes(color) ? "info" : "gray"}
                    className="mr-2 mb-1 flex items-center cursor-pointer"
                    onClick={() =>
                      selectedColors.includes(color)
                        ? setSelectedColors(
                            selectedColors.filter((c: any) => c.id !== color.id)
                          )
                        : setSelectedColors([...selectedColors, color])
                    }>
                    {color.color}
                  </Badge>
                ))}
              </div>

              {/* By Size: use badge to create pills that user can click to select */}
              <div className="flex gap-2 items-center">
                <Label color="info">Size: </Label>
                {product?.product_sizes.map((size) => (
                  <Badge
                    key={size.id}
                    color={selectedSizes.includes(size) ? "info" : "gray"}
                    className="mr-2 mb-1 flex items-center cursor-pointer"
                    onClick={() =>
                      selectedSizes.includes(size)
                        ? setSelectedSizes(
                            selectedSizes.filter((s: any) => s.id !== size.id)
                          )
                        : setSelectedSizes([...selectedSizes, size])
                    }>
                    {size.size}
                  </Badge>
                ))}

                {/* By Month: use dropdown to select */}
                <Label color="info">Month: </Label>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">All</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </Select>

                {/* By Year: use dropdown to select */}
                <Label color="info">Year: </Label>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}>
                  <option value="">All</option>
                  <option value="2021">2021</option>
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </Select>
              </div>
            </div>

            {/* Product Stock Logs */}
            <div className="flex flex-col p-4 ">
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden shadow">
                    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <Table.Head className="bg-gray-100 dark:bg-gray-700">
                        <Table.HeadCell>Date</Table.HeadCell>
                        <Table.HeadCell>Type</Table.HeadCell>
                        <Table.HeadCell>Color</Table.HeadCell>
                        <Table.HeadCell>Price</Table.HeadCell>
                        <Table.HeadCell>Opening</Table.HeadCell>
                        <Table.HeadCell>In Stock</Table.HeadCell>
                        <Table.HeadCell>Return</Table.HeadCell>
                        {product?.product_sizes.map((size) => (
                          <Table.HeadCell key={size.id}>
                            {size.size}
                          </Table.HeadCell>
                        ))}
                        <Table.HeadCell>Balance</Table.HeadCell>
                      </Table.Head>
                      <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {processedLogs
                          .filter((log) => {
                            // Check for Colors, Sizes, Month and Year
                            let isColor = true;
                            let isSize = true;
                            let isMonth = true;
                            let isYear = true;
                            if (selectedColors.length > 0) {
                              isColor = selectedColors.some(
                                (color: any) =>
                                  color.id === log.product_stock.color_id
                              );
                            }
                            if (selectedSizes.length > 0) {
                              isSize = selectedSizes.some(
                                (size: any) =>
                                  size.id === log.product_stock.size_id
                              );
                            }
                            if (selectedMonth !== "") {
                              isMonth =
                                new Date(log.created_at).getMonth() + 1 ===
                                parseInt(selectedMonth);
                            }
                            if (selectedYear !== "") {
                              isYear =
                                new Date(log.created_at).getFullYear() ===
                                parseInt(selectedYear);
                            }
                            return isColor && isSize && isMonth && isYear;
                          })
                          .map((log) => (
                            <Table.Row
                              key={log.id}
                              className="hover:bg-gray-100 dark:hover:bg-gray-700">
                              <Table.Cell>
                                {new Date(log.created_at).toDateString()}
                              </Table.Cell>
                              <Table.Cell>{log.type}</Table.Cell>
                              <Table.Cell>
                                {
                                  product?.product_colors.find(
                                    (color) =>
                                      color.id === log.product_stock.color_id
                                  )?.color
                                }
                              </Table.Cell>
                              <Table.Cell>
                                RM {product?.price.toFixed(2)}
                              </Table.Cell>
                              <Table.Cell>
                                {log.type === "Opening" ? log.amount : 0}
                              </Table.Cell>
                              <Table.Cell>
                                {log.type === "In Stock" ? log.amount : 0}
                              </Table.Cell>
                              <Table.Cell>
                                {log.type === "Return" ? log.amount : 0}
                              </Table.Cell>
                              {product?.product_sizes.map((size) => (
                                <Table.Cell key={size.id}>
                                  {log.product_stock.size_id === size.id
                                    ? log.amount
                                    : 0}
                                </Table.Cell>
                              ))}
                              <Table.Cell>{log.balance}</Table.Cell>
                            </Table.Row>
                          ))}
                      </Table.Body>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default ProductStockDetails;
