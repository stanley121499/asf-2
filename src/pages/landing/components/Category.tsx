import React, { useRef, useEffect } from "react";
import { useCategoryContext } from "../../../context/product/CategoryContext";
import { useProductCategoryContext } from "../../../context/product/ProductCategoryContext";
import { useProductContext } from "../../../context/product/ProductContext";
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Infinite scroll effect
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (
        scrollContainer.scrollLeft + scrollContainer.clientWidth >=
        scrollContainer.scrollWidth
      ) {
        scrollContainer.scrollLeft = 0; // Reset scroll to the beginning
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);


  // Auto scroll effect
  return (
    <div
      className="relative overflow-hidden max-w-7xl mx-auto my-4"
      style={{ maxHeight: "320px" }} // Adjust maxHeight based on your design needs
    >
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto hide-scrollbar space-x-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {productsByCategory.flatMap((product) =>
          Array(10)
            .fill(null)
            .map((_, index) => (
              <div
                key={`${product.id}-${index}`}
                className="flex-shrink-0 w-40 p-4 rounded-lg shadow-lg"
                style={{ scrollSnapAlign: "start" }}
              >
                {/* Image Section */}
                <div className="relative mb-4 overflow-hidden rounded-lg h-40">
                  <img
                    src={
                      productMedias.find(
                        (media) => media.product_id === product.id
                      )?.media_url || "/default-image.jpg"
                    } // Fallback image
                    alt={product?.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ display: "block" }} // Ensure block display for proper object-fit
                  />
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default HomePageCategoryComponent;
