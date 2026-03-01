import { useProductContext } from "../../../context/product/ProductContext";
import { useProductMediaContext } from "../../../context/product/ProductMediaContext";
import React from "react";
import { useNavigate } from "react-router-dom";

interface HomePageProductComponentProps {
  targetId: string;
  amount?: number | null;
  contentType?: string | null;
}

const HomePageProductComponent: React.FC<HomePageProductComponentProps> = ({
  targetId,
  amount,
  contentType,
}) => {
  const { products } = useProductContext();
  const { productMedias } = useProductMediaContext();
  const navigate = useNavigate();

  // Find the product by targetId
  const product = products.find((prod) => prod.id === targetId);

  // Find the product media by product
  const productMedia = productMedias.filter(
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
    <div
      className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg my-4 max-w-7xl mx-auto"
      onClick={() => {
        navigate(`/product-details/${product.id}`);
      }}>
      {/* Image Section */}
      <div className="relative overflow-hidden rounded-lg h-96">
        <img
          src={productMedia[0]?.media_url || "/default-image.jpg"} // Fallback image
          alt={product?.name}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: "block" }} // Ensure block display for proper object-fit
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      {/* Info Section */}
      <div className="flex items-center justify-between p-4">
        {/* Left Side: Name and Description */}
        <div className="text-left">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
            {product?.name || "Product Name"}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {product?.description || "No description available."}
          </p>
          <span className="text-md font-bold text-indigo-600">
            RM {product?.price?.toFixed(2) || "0.00"}
          </span>
        </div>

        {/* Right Side: Price */}
        {/* <div className="w-1/3 flex flex-col items-end">
          <span className="text-md font-bold text-indigo-600">
            RM {product?.price?.toFixed(2) || "0.00"}
          </span>
        </div> */}
      </div>
    </div>
  );
};

export default HomePageProductComponent;
