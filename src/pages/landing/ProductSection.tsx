import { Select } from "flowbite-react";
import React, { useEffect, useState } from "react";
import NavbarHome from "../../components/navbar-home";
import { useCategoryContext } from "../../context/product/CategoryContext";
import { useProductCategoryContext } from "../../context/product/ProductCategoryContext";
import { useProductContext } from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import { useParams, useNavigate } from "react-router-dom";

const ProductSection: React.FC = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { categories } = useCategoryContext();
  const { products } = useProductContext();
  const { productCategories } = useProductCategoryContext();
  const { productMedias } = useProductMediaContext();
  
  const [selectedCategory, setSelectedCategory] = useState(
    categories.find((category) => category.id === categoryId)
  );
  const [selectedSort, setSelectedSort] = useState("Newest First");
  const [selectedFilter, setSelectedFilter] = useState(
    selectedCategory?.name || "All"
  );

  // Update selectedCategory when URL changes
  useEffect(() => {
    const category = categories.find((category) => category.id === categoryId);
    setSelectedCategory(category);
    setSelectedFilter(category?.name || "All");
  }, [categories, categoryId]);

  // Handle filter changes
  const handleFilterChange = (filterName: string) => {
    setSelectedFilter(filterName);
    if (filterName === "All") {
      navigate("/product-section");
      setSelectedCategory(undefined);
    } else {
      const category = categories.find((cat) => cat.name === filterName);
      if (category) {
        navigate(`/product-section/${category.id}`);
        setSelectedCategory(category);
      }
    }
  };

  return (
    <>
      <NavbarHome />
      <section className="bg-gray-50 py-8 antialiased dark:bg-gray-900 md:py-12 ">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0 py-16">
          {/* Heading & Filters */}
          <div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-8">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                {/* Breadcrumb navigation */}
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                      <a
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white">
                        <svg
                          className="me-2.5 h-3 w-3"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                        </svg>
                        Home
                      </a>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-gray-400 rtl:rotate-180"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          viewBox="0 0 24 24">
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m9 5 7 7-7 7"
                          />
                        </svg>
                        <a
                          href="/product-section"
                          className="ms-1 text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white md:ms-2">
                          Products
                        </a>
                      </div>
                    </li>
                    {selectedCategory && (
                      <li aria-current="page">
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 text-gray-400 rtl:rotate-180"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24">
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="m9 5 7 7-7 7"
                            />
                          </svg>
                          <span className="ms-1 text-sm font-medium text-gray-500 dark:text-gray-400 md:ms-2">
                            {selectedCategory.name}
                          </span>
                        </div>
                      </li>
                    )}
                  </ol>
                </nav>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {/* Filters Button */}
              <Select
                value={selectedFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 sm:w-auto">
                <option value="All">All</option>
                {categories.map((filter) => (
                  <option key={filter.id} value={filter.name}>
                    {filter.name}
                  </option>
                ))}
              </Select>
              {/* Sort Button */}
              <Select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 sm:w-auto">
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
                <option value="Newest First">Newest First</option>
              </Select>
            </div>
          </div>

          {/* Product Cards */}
          <div className="mb-4 grid gap-4 grid-cols-2">
            {products
              .filter((product) => {
                if (selectedCategory) {
                  return productCategories.some(
                    (pc) =>
                      pc.product_id === product.id &&
                      pc.category_id === selectedCategory.id
                  );
                }
                return true;
              })
              .sort((a, b) => {
                if (selectedSort === "Price: Low to High") {
                  return a.price - b.price;
                } else if (selectedSort === "Price: High to Low") {
                  return b.price - a.price;
                } else {
                  return (
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                  );
                }
              })
              .map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="w-full">
                    <a href={`/product-details/${product.id}`}>
                      <img
                        className="mx-auto h-56 w-full object-cover rounded-t-lg"
                        src={
                          productMedias.find(
                            (media) => media.product_id === product.id
                          )?.media_url || "/default-image.jpg"
                        }
                        alt={"Product"}
                      />

                      <div className="p-4">
                        {/* Product Name */}
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                          {product.name}
                        </h3>

                        {/* Product Price */}
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-400">
                          RM {product.price}
                        </p>
                      </div>
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductSection;
