import { useCategoryContext } from "../../../context/product/CategoryContext";
import { useProductCategoryContext } from "../../../context/product/ProductCategoryContext";
import { useProductContext } from "../../../context/product/ProductContext";
import React from "react";
import { useProductMediaContext } from "../../../context/product/ProductMediaContext";

interface HomePageCategoryComponentProps {
  targetId: string;
  amount?: number | null;
  contentType?: string | null;
}

const HomePageCategoryComponent: React.FC<HomePageCategoryComponentProps> = ({
  targetId,
  amount,
  contentType,
}) => {
  const { categories } = useCategoryContext();
  const { products } = useProductContext();
  const { productCategories } = useProductCategoryContext();
  const { productMedias } = useProductMediaContext();

  // Find the category by targetId
  const category = categories.find((cat) => cat.id === targetId);

  // Find the product by category
  const productIds = productCategories.filter(
    (pc) => pc.category_id === category?.id
  );

  // Find the products by productIds
  const productsByCategory = products.filter((prod) =>
    productIds.some((pc) => pc.product_id === prod.id)
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3  rounded-lg shadow-lg my-4 max-w-7xl mx-auto">
      {productsByCategory.map((product) => (
        <div
          key={product.id}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg ">
          {/* Image Section */}
          <div
            className="relative mb-4 overflow-hidden rounded-lg h-40">
            <img
              src={productMedias.find((media) => media.product_id === product.id)?.media_url || "/default-image.jpg"} // Fallback image
              alt={product?.name}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: "block" }} // Ensure block display for proper object-fit
            />
          </div>

          {/* Info Section */}
          <div className="flex items-center justify-between p-4">
            {/* Left Side: Name and Description */}
            <div className="w-2/3 pr-4 text-left">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
                {product?.name || "Product Name"}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {product?.description || "No description available."}
              </p>
            </div>

            {/* Right Side: Price */}
            <div className="w-1/3 flex flex-col items-end">
              <span className="text-lg font-bold text-indigo-600">
                RM {product?.price?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomePageCategoryComponent;
