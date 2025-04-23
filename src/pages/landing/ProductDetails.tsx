import React from "react";
import { useParams } from "react-router-dom";
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
import { useNavigate } from "react-router-dom";

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { products } = useProductContext();
  const { productMedias } = useProductMediaContext();
  const navigate = useNavigate();
  const product: Product | undefined = products.find(
    (prod) => prod.id === productId
  );

  // Find the product media by product
  const productMedia: ProductMedia[] = productMedias.filter(
    (media) => media.product_id === product?.id
  );

  if (!product) {
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
  }
    
  const tempAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const firstMedia = productMedia[0];
    
    cart.push({
      ...product,
      quantity: 1,
      media_url: firstMedia?.media_url || "/default-image.jpg",
      price: product.price * 100,
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    navigate("/cart");
  };

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
                src={productMedia[0]?.media_url || "/default-image.jpg"}
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
                <button
                  className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 sm:mt-0"
                  onClick={tempAddToCart}>
                  Add to Cart
                </button>
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
