/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { useProductContext } from "../../context/product/ProductContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import ListPage from "../../components/analytics/ListPage";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";

const ProductInnerAnalyticsPage: React.FC = function () {
  const { products, loading } = useProductContext();
  const { productMedias } = useProductMediaContext();

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
                Analytics
              </h1>
              <a
                href="/analytics/users"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Users
              </a>
              <a
                href="/analytics/products"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Products
              </a>
              <a
                href="/analytics/categories"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Category
              </a>
              <a
                href="/analytics/support"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              <ListPage
                title="Best Performing Product"
                listData={[
                  ...products.flatMap((product) =>
                    Array(10)
                      .fill(null)
                      .map((_, index) => ({
                        ...product,
                        media_url: productMedias.find(
                          (media) => media.product_id === product.id
                        )?.media_url,
                        title: `${product.name}`,
                        amount: product.price,
                        unit: "units",
                      }))
                  ),
                ]}
              />
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

export default ProductInnerAnalyticsPage;
