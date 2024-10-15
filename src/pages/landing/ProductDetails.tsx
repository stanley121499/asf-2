import React from "react";
import NavbarHome from "../../components/navbar-home";
import CheckoutButton from "../../components/stripe/CheckoutButton";
import {
  Product,
  useProductContext,
} from "../../context/product/ProductContext";
import {
  ProductMedia,
  useProductMediaContext,
} from "../../context/product/ProductMediaContext";
import { useParams } from "react-router-dom";

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { products } = useProductContext();
  const { productMedias } = useProductMediaContext();
  const product: Product | undefined = products.find(
    (prod) => prod.id === productId
  );

  // Find the product media by product
  const productMedia: ProductMedia[] = productMedias.filter(
    (media) => media.product_id === product?.id
  );
  if (!product || !productMedia)
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-gray-200 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    );

  return (
    <>
      <NavbarHome />
      <section className="py-8 bg-white md:py-16 dark:bg-gray-900 antialiased">
        <div className="max-w-screen-xl px-4 mx-auto 2xl:px-0 py-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
            {/* Product Image */}
            <div className="shrink-0 max-w-md lg:max-w-lg mx-auto">
              <img
                className="w-full rounded-lg"
                src={productMedia[0].media_url}
                alt={`product`}
              />
            </div>

            {/* Product Information */}
            <div className="mt-6 sm:mt-8 lg:mt-0">
              <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
                {product.name}
              </h1>

              {/* Price and Rating */}
              <div className="mt-4 sm:items-center sm:gap-4 sm:flex">
                <p className="text-2xl font-extrabold text-gray-900 sm:text-3xl dark:text-white">
                  ${product.price.toFixed(2)}
                </p>
              </div>

              <hr className="my-6 md:my-8 border-gray-200 dark:border-gray-800" />

              {/* Product Description */}
              <p className="mb-6 text-gray-500 dark:text-gray-400">
                {product.description}
              </p>

              {/* Action Buttons */}
              <div className="mt-6 sm:gap-4 sm:items-center sm:flex sm:mt-8">
                {/* <a
                  href="#"
                  title="Add to favorites"
                  className="flex items-center justify-center py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                  role="button">
                  Add to Cart
                </a> */}

                <CheckoutButton
                  items={[
                    {
                      name: product.name,
                      quantity: 1,
                      price: product.price * 100,
                    },
                  ]}
                  customerId={"customer-id"}
                  buttonTitle="Buy Now"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductDetails;
