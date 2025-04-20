/* eslint-disable jsx-a11y/anchor-is-valid */
import { Badge, Button, Card, Label, TextInput } from "flowbite-react";
import React from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import {
  useProductContext,
  Product,
} from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import { IoIosSearch } from "react-icons/io";
import { HiPlus } from "react-icons/hi";
import ProductComponent from "../../components/product/product";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

const ProductListPage: React.FC = function () {
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
                Products
              </h1>
              <a
                href="/products/list"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                All Products
              </a>
              <a
                href="/products/categories"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Category
              </a>
              {/* Schedule */}
              <a
                href="/products/schedule"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Schedule
              </a>
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
          <div className="inline-block min-w-full align-middle grid grid-cols-4">
            {productData && (
              <div className="overflow-hidden shadow col-span-1 flex justify-center items-center">
                <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                  <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                  <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                  <div className="rounded-[2rem] overflow-auto w-[272px] h-[572px] bg-white hide-scrollbar">
                    <div className="pt-5">
                      <ProductComponent
                        name={productData?.name || "Product Name"}
                        price={productData?.price || 100.0}
                        color={
                          productData?.product_colors
                            ? productData.product_colors.map(
                                (color) => color.color
                              )
                            : ["red", "blue", "green", "yellow"]
                        }
                        size={
                          productData?.product_sizes
                            ? productData.product_sizes.map((size) => size.size)
                            : ["S", "M", "L", "XL"]
                        }
                        medias={productMedias
                          .filter(
                            (media) => media.product_id === productData?.id
                          )
                          .map((media) => media.media_url)}
                        description={
                          productData?.description ||
                          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla nec purus feugiat, molestie ipsum et, consequat nibh. Ut sit amet lacus ultrices, tincidunt metus in, maximus metus."
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div
              className={`overflow-hidden shadow ${
                productData ? "col-span-3" : "col-span-4"
              }`}>
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
                  setProductData={setProductData}
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
  setProductData: React.Dispatch<React.SetStateAction<Product | null>>;
}

const ProductsTable: React.FC<ProductsTableProps> = function ({
  products,
  setProductData,
}) {
  const { productMedias } = useProductMediaContext();
  const { deleteProduct } = useProductContext();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  return (
    // Create a grid of 3 columns and use card to display the product
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 max-h-[calc(100vh-167px)] overflow-y-auto hide-scrollbar">
      {products.flatMap((product) =>
        Array(1)
          .fill(null)
          .map((_, index) => (
            <Card
              key={`${product.id}-${index}`}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              renderImage={() => (
                <div className="relative w-full h-48 p-4">
                  <img
                    src={
                      productMedias.find(
                        (media) => media.product_id === product.id
                      )?.media_url
                    }
                    alt={product.name}
                    className="object-cover w-full h-48 rounded-lg"
                  />
                </div>
              )}
              style={{
                height: `calc((100vh - 190px) / 2)`,
                backgroundColor: "transparent",
              }}
              onClick={() => {
                setProductData(product);
              }}>
              {/* Delete Confirmation Modal */}
              <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                  deleteProduct(product.id);
                  setIsDeleteModalOpen(false);
                }}
              />
              <div className="flex justify-between flex-col gap-2">
                <div className="flex items-center gap-x-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl truncate overflow-hidden">
                    {product.name}
                  </h2>
                  <Badge color={getBadgeColor(product.status)}>
                    {product.status.toLowerCase()}
                  </Badge>
                </div>
                {/* Description */}
                <p className="text-sm text-gray-900 w-full pb-0 dark:text-gray-400 line-clamp-2 overflow-hidden">
                  {product.description}
                </p>
                {/* Price */}
                {/* Show in two decimal place */}
                <p className="text-sm text-gray-900 w-full dark:text-gray-400">
                  RM{product.price.toFixed(2)}
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Button
                    className="w-full sm:w-auto px-4"
                    href={`/products/create/${product.product_folder_id}/${product.id}`}>
                    Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-4"
                    color={"red"}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
      )}
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
};

export default ProductListPage;
