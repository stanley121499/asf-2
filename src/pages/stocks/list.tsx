/* eslint-disable jsx-a11y/anchor-is-valid */
import { Badge, Label, TextInput } from "flowbite-react";
import React from "react";
import { IoIosSearch } from "react-icons/io";
import {
  useProductContext,
  Product,
} from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useNavigate } from "react-router-dom";

const StockAllProductPage: React.FC = function () {
  const { products, loading } = useProductContext();
  const [searchValue, setSearchValue] = React.useState("");

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
                All Product
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
              {/* <a
                href="/stocks/events"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Product Events
              </a> */}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              <form className="lg:pr-3">
                <Label htmlFor="products-search" className="sr-only">
                  Search
                </Label>
                <div className="relative mt-1">
                  <TextInput
                    id="products-search"
                    name="products-search"
                    placeholder="Search for Products"
                    className="w-full mb-4"
                    style={{ background: "transparent" }}
                    value={searchValue}
                    icon={IoIosSearch}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
              </form>
              {products.length > 0 ? (
                <ProductsTable
                  products={products.filter((product) =>
                    product.name
                      .toLowerCase()
                      .includes(searchValue.toLowerCase())
                  )}
                />
              ) : (
                <>
                  <img
                    src="/images/illustrations/404.svg"
                    alt="No products found"
                    className="mx-auto"
                  />
                  <div className="p-4 text-center">No products found</div>
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

interface ProductsTableProps {
  products: Product[];
}

const ProductsTable: React.FC<ProductsTableProps> = function ({ products }) {
  const { productMedias } = useProductMediaContext();
  const navigate = useNavigate();

  const productMediaMap = React.useMemo<Map<string, string>>(
    () => new Map(productMedias.map((m) => [m.product_id, m.media_url ?? ""])),
    [productMedias]
  );

  return (
    <div>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1 max-h-[calc(100vh-167px)] overflow-y-auto hide-scrollbar">
          {products.map((product) => (
            <div
              key={product.id}
              style={{ height: `calc((100vh - 167px) / 8)` }}
              onClick={() => {
                // Navigate to ProductStockDetails page
                navigate(`/products/stock/${product.id}`);
              }}
              className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
              <div className="flex items-center gap-4">
                <img
                  src={productMediaMap.get(product.id) ?? ""}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-md"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                    {product.name}
                  </h2>
                  {/* <p className="text-sm text-gray-500 dark:text-gray-400 truncate text-ellipsis whitespace-nowrap">
                        {product.description}
                      </p> */}
                </div>
                <Badge color={getBadgeColor(product.stock_status)}>
                  {getBadgeText(product.stock_status)}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate text-ellipsis whitespace-nowrap">
                  Stock: {product.stock_count}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <img
            src="/images/illustrations/404.svg"
            alt="No products found"
            className="mx-auto"
          />
          <div className="p-4 text-center">No products found</div>
        </>
      )}
    </div>
  );
};

const getBadgeColor = (status: string) => {
  // low | fast | normal |hold
  switch (status) {
    case "low":
      return "red";
    case "fast":
      return "yellow";
    case "normal":
      return "green";
    case "hold":
      return "gray";
    default:
      return "gray";
  }
};

const getBadgeText = (status: string) => {
  // low | fast | normal |hold
  switch (status) {
    case "low":
      return "Running Low";
    case "fast":
      return "Selling Fast";
    case "normal":
      return "Healthy";
    case "hold":
      return "Stock hold for too long";
    default:
      return "Hold";
  }
};

export default StockAllProductPage;
