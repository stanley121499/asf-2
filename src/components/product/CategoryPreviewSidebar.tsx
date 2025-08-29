import React, { useMemo, useState } from "react";
import { Category } from "../../context/product/CategoryContext";
import type { Department } from "../../context/product/DepartmentContext";
import type { Range } from "../../context/product/RangeContext";
import type { Brand } from "../../context/product/BrandContext";
import { useNavigate } from "react-router-dom";

/**
 * CategoryPreviewSidebar component displays a hierarchical list of categories
 * in a sidebar format, with indentation to show parent-child relationships.
 * 
 * @param categories - Array of top-level categories with their children
 * @param selectedCategory - Currently selected category (if any)
 * @param onSelectCategory - Callback function for when a category is selected
 * @param isVisible - Whether the sidebar should be visible
 * @param onClose - Callback function for when the sidebar is closed
 * @param isMobile - Whether the component is being displayed on a mobile device
 * @param shouldRedirect - Whether clicking a category should redirect to its page
 * @param redirectUrlFormatter - Optional function to format the redirect URL
 * @param slideFromLeft - Whether the sidebar should slide in from the left (default: false, slides from right)
 * @param fullWidth - Whether the sidebar should take up the full screen width in mobile mode
 */
type SidebarTab = "department" | "range" | "brand" | "category";

interface CategoryPreviewSidebarProps {
  departments: Department[];
  ranges: Range[];
  brands: Brand[];
  categories: Category[];
  selectedCategory?: Category | null;
  onSelectCategory: (category: Category) => void;
  isVisible?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  shouldRedirect?: boolean;
  redirectUrlFormatter?: (tab: SidebarTab, item: Department | Range | Brand | Category) => string;
  slideFromLeft?: boolean;
  fullWidth?: boolean;
}

const CategoryPreviewSidebar: React.FC<CategoryPreviewSidebarProps> = ({
  departments,
  ranges,
  brands,
  categories,
  selectedCategory,
  onSelectCategory,
  isVisible = true,
  onClose,
  isMobile = false,
  shouldRedirect = false,
  redirectUrlFormatter = (tab, item) => {
    if (tab === "department") return `/product-section?department=${item.id}`;
    if (tab === "range") return `/product-section?range=${item.id}`;
    if (tab === "brand") return `/product-section?brand=${item.id}`;
    return `/product-section/${(item as Category).id}`;
  },
  slideFromLeft = false,
  fullWidth = false,
}) => {
  const navigate = useNavigate();
  // Remove activeTab since we're showing all sections

  const sortedDepartments = useMemo(() => {
    return [...departments].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [departments]);
  const sortedRanges = useMemo(() => {
    return [...ranges].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [ranges]);
  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [brands]);
  const sortedCategories = useMemo(() => {
    return [...categories];
  }, [categories]);

  // Handle category selection with optional redirection
  const handleCategorySelect = (category: Category) => {
    onSelectCategory(category);
    
    if (shouldRedirect) {
      const redirectUrl = redirectUrlFormatter("category", category);
      navigate(redirectUrl);
      
      // Close the sidebar if it's mobile
      if (isMobile && onClose) {
        onClose();
      }
    }
  };

  const handleFlatSelect = (tab: SidebarTab, item: Department | Range | Brand) => {
    if (shouldRedirect) {
      const redirectUrl = redirectUrlFormatter(tab, item);
      navigate(redirectUrl);
      if (isMobile && onClose) {
        onClose();
      }
    }
  };

  // Recursive function to render category and its children
  const renderCategory = (category: Category, level: number) => {
    return (
      <React.Fragment key={category.id}>
        <div
          className={`relative w-full h-16 rounded-lg overflow-hidden mb-2 ${
            category.id === selectedCategory?.id
              ? "border-4 border-red-500"
              : ""
          }`}
          style={{
            marginLeft: `${level * 20}px`,
            width: `calc(100% - ${level * 20}px)`,
          }}
          onClick={() => handleCategorySelect(category)}
        >
          <img
            src={category.media_url}
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center p-4">
            <h2 className="text-white text-2xl font-semibold">
              {category.name}
            </h2>
          </div>
        </div>

        {/* Render children recursively */}
        {category.children &&
          category.children.map((child) => renderCategory(child, level + 1))}
      </React.Fragment>
    );
  };

  const renderFlatItem = (tab: SidebarTab, item: Department | Range | Brand) => {
    const label = item.name || "";
    const image = item.media_url || "";
    return (
      <div
        key={item.id}
        className="relative w-full h-16 rounded-lg overflow-hidden mb-2"
        onClick={() => handleFlatSelect(tab, item)}
      >
        {image && (
          <img src={image} alt={label} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center p-4">
          <h2 className="text-white text-2xl font-semibold">{label}</h2>
        </div>
      </div>
    );
  };

  const sidebarClasses = `
    ${isMobile 
      ? `fixed inset-y-0 ${slideFromLeft ? "left-0" : "right-0"} z-50 transform transition-transform duration-300 ease-in-out` 
      : "relative"}
    ${isVisible 
      ? "translate-x-0" 
      : slideFromLeft ? "-translate-x-full" : "translate-x-full"}
    ${isMobile 
      ? fullWidth ? "w-full" : slideFromLeft ? "w-80" : "w-72"
      : "w-full h-full"}
    bg-white dark:bg-gray-800 overflow-y-auto
  `;

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        ></div>
      )}

      <div className={sidebarClasses}>
        {isMobile && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Browse</h2>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        )}

        <div className={`${isMobile ? "p-4" : "p-2 h-[calc(100vh-7rem)] flex items-center justify-center"}`}>
          <div className={`rounded-lg bg-white dark:bg-gray-800 p-4 ${isMobile && !fullWidth ? "h-[calc(100vh-9rem)]" : ""} w-full overflow-y-auto`}>
            {/* Departments */}
            {sortedDepartments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Browse by Department</h3>
                {sortedDepartments.map((d) => renderFlatItem("department", d))}
              </div>
            )}

            {/* Ranges */}
            {sortedRanges.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Browse by Range</h3>
                {sortedRanges.map((r) => renderFlatItem("range", r))}
              </div>
            )}

            {/* Brands */}
            {sortedBrands.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Browse by Brand</h3>
                {sortedBrands.map((b) => renderFlatItem("brand", b))}
              </div>
            )}

            {/* Categories */}
            {sortedCategories.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Browse by Category</h3>
                {sortedCategories.map((category) => renderCategory(category, 0))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryPreviewSidebar; 