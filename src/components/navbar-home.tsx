"use client";
import React, { useState, useEffect } from "react";
import { Navbar } from "flowbite-react";
import { Link } from "react-router-dom";
import BottomNavbar from "./home/bottom-nav";
import CategoryPreviewSidebar from "./product/CategoryPreviewSidebar";
import { useCategoryContext, Category } from "../context/product/CategoryContext";
import { useDepartmentContext } from "../context/product/DepartmentContext";
import { useRangeContext } from "../context/product/RangeContext";
import { useBrandContext } from "../context/product/BrandContext";
import { HiOutlineMenuAlt3 } from "react-icons/hi";

const NavbarHome: React.FC = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const { categories, loading } = useCategoryContext();
  const { departments } = useDepartmentContext();
  const { ranges } = useRangeContext();
  const { brands } = useBrandContext();
  const [resultingCategories, setResultingCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Build hierarchy from flat categories array
useEffect(() => {
    if (!loading && categories.length > 0) {
      // Helper function to build the hierarchy
      const buildHierarchy = (parentCategory: Category) => {
        const children = categories
          .filter((child) => child.parent === parentCategory.id)
          .sort((a, b) => {
            // if null put at the back
            if (a.arrangement === null) return 1;
            if (b.arrangement === null) return -1;
            return a.arrangement - b.arrangement;
          });
        parentCategory.children = children;
        children.forEach(buildHierarchy);
      };

      // Get top level categories (no parent)
      const hierarchy = categories.filter((category) => !category.parent);
      hierarchy.forEach((category) => {
        buildHierarchy(category);
      });

      setResultingCategories([...hierarchy]);
    }
  }, [categories, loading]);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <>
      <Navbar
        fluid
        rounded
        className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-none border-b dark:border-gray-700 transition-colors duration-200 p-4">
        <div className="flex w-full items-center justify-between">
          {/* Logo */}
          <Navbar.Brand as={Link} href="https://flowbite-react.com">
            <img alt="Logo" src="../../images/logo.svg" className="mr-3 h-10" />
            <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
              ASF
            </span>
          </Navbar.Brand>
          
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleSidebar}
            type="button"
            className="flex items-center justify-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-label="Open categories menu"
          >
            <HiOutlineMenuAlt3 className="w-7 h-7" />
            <span className="sr-only">Open categories</span>
          </button>
        </div>
      </Navbar>

      {/* Category Sidebar */}
      {!loading && (
        <CategoryPreviewSidebar
          departments={departments}
          ranges={ranges}
          brands={brands}
          categories={resultingCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
          }}
          isVisible={isSidebarVisible}
          onClose={() => setIsSidebarVisible(false)}
          isMobile={true}
          shouldRedirect={true}
          redirectUrlFormatter={(tab, item) => {
            if (tab === "department") return `/product-section?department=${item.id}`;
            if (tab === "range") return `/product-section?range=${item.id}`;
            if (tab === "brand") return `/product-section?brand=${item.id}`;
            return `/product-section/${(item as Category).id}`;
          }}
          slideFromLeft={true}
          fullWidth={true}
        />
      )}

      <BottomNavbar />
    </>
  );
};

export default NavbarHome;
