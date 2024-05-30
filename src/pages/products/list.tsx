/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Badge,
  Button,
  Card,
  Label,
  Table,
  TextInput
} from "flowbite-react";
import React from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useProductContext, Products } from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import { IoIosSearch } from "react-icons/io";
import { HiPlus } from "react-icons/hi";

const ProductListPage: React.FC = function () {
  const { products, loading } = useProductContext();

  const [searchValue, setSearchValue] = React.useState("");

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
                Products
              </h1>
              <a href="/products/list" className="text-sm text-grey-500 dark:text-grey-400 hover:underline">All Products</a>
              <a href="/products/categories" className="text-sm text-grey-500 dark:text-grey-400 hover:underline">Category</a>
            </div>
            <Button href="/products/create" className="btn btn-primary">
              <HiPlus className="text-xl" />
              Add Product
            </Button>
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
                    className="w-full mb-4 background-transparent"
                    value={searchValue}
                    icon={IoIosSearch}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>

              </form>
              {products.length > 0 ? (
                <ProductsTable products={products.filter((product) => product.name.toLowerCase().includes(searchValue.toLowerCase()))} />

              ) : (
                <>
                  <img src="/images/illustrations/404.svg" alt="No products found" className="mx-auto" />
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

const ProductsTable: React.FC<Products> = function ({ products }) {
  const { productMedias } = useProductMediaContext();
  const { deleteProduct } = useProductContext();
  return (
    // Create a grid of 3 columns and use card to display the product
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card
          key={product.id}
          className="bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          imgSrc={productMedias.filter((media) => media.product_id === product.id)[0]?.media_url}
        >
          <div className="flex justify-between flex-col gap-4">
            <div className="flex items-center gap-x-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                {product.name}
              </h2>
              <Badge color={getBadgeColor(product.status)}>{product.status.toLowerCase()}</Badge>
            </div>
            {/* Description */}
            <p className="text-sm text-gray-900 w-full pb-0 dark:text-gray-400">{product.description}</p>

            {/* Price */}
            {/* Show in two decimal place */}
            <p className="text-sm text-gray-900 w-full dark:text-gray-400">RM{product.price.toFixed(2)}</p>

            <div className="flex gap-2 flex-wrap">
              <Button href={`/products/create/${product.product_folder_id}/${product.id}`} className="btn btn-primary">
                Edit
              </Button>
              <Button
                onClick={() => {
                  deleteProduct(product.id);
                }}
                color={"red"}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const getBadgeColor = (status: string) => {
  // UNPUBLISHED | PUBLISH | DRAFT
  switch (status) {
    case "UNPUBLISHED":
      return "red";
    case "PUBLISH":
      return "green";
    case "DRAFT":
      return "gray";
    default:
      return "gray";
  }
}

export default ProductListPage;
