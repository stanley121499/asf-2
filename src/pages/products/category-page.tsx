import { Button, FileInput, Label, TextInput } from "flowbite-react";
import React, { useCallback, useEffect } from "react";
import {
  Category,
  CategoryUpdate,
  useCategoryContext,
} from "../../context/product/CategoryContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { IoIosSearch } from "react-icons/io";
import { useAlertContext } from "../../context/AlertContext";
import { supabase } from "../../utils/supabaseClient";
import AddCategoryModal from "./create-category-modal";

const CategoryListPage: React.FC = function () {
  const { categories, loading, updateCategory, deleteCategory } =
    useCategoryContext();
  const [selectedCategory, setSelectedCategory] =
    React.useState<Category | null>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const { showAlert } = useAlertContext();
  const [file, setFile] = React.useState<File | null>(null);
  const [resultingCategories, setResultingCategories] = React.useState<
    Category[]
  >([]);

  const buildHierarchy = useCallback(
    (parentCategory: Category) => {
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
    },
    [categories]
  );

  useEffect(() => {
    // Rebuild the categories array into hierarchy by checking if the category has a parent
    const hierarchy = categories.filter((category) => !category.parent);
    hierarchy.forEach((category) => {
      buildHierarchy(category);
    });

    setResultingCategories([...hierarchy]);
  }, [buildHierarchy, categories]);

  if (loading) {
    return <LoadingPage />;
  }

  const handleUpdateCategory = async (category: CategoryUpdate) => {
    if (file) {
      const randomId = Math.random().toString(36).substring(2);

      const { data, error } = await supabase.storage
        .from("product_medias")
        .upload(`${randomId}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error(error);
        showAlert("Failed to upload file", "error");
        return;
      }

      const media_url =
        "https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/" +
        data.path;

      category.media_url = media_url;
    }

    // Remove children property before updating
    const tempCategory = { ...category } as CategoryUpdate & { children?: any };

    delete tempCategory.children;

    await updateCategory(tempCategory);
    setSelectedCategory(null);
    setFile(null);
    showAlert("Category updated successfully", "success");
  };

  const handleChangeArrangement = async (
    categoryId: string,
    direction: "up" | "down" | "left" | "right"
  ) => {
    // Use Resulting Categories to find the category and its parent and its children
    // note: resultingCategories is a hierarchy of categories with multiple levels
    const { category, parent } = findCategory(categoryId, resultingCategories)!;

    // Up and down changes the arrangement of the category (by changing category.arrangement)
    if (direction === "up" || direction === "down") {
      if (parent) {
        const index = parent.children!.findIndex(
          (child) => child.id === category.id
        );
        const sibling = parent.children![index + (direction === "up" ? -1 : 1)];
        if (sibling) {
          sibling.arrangement = index;
          category.arrangement = index + (direction === "up" ? -1 : 1);
          // Destructuring and excluding 'children' property
          const { children, ...categoryWithoutChildren } = category;
          const { children: siblingChildren, ...siblingWithoutChildren } =
            sibling;

          // Update category without 'children' property
          await updateCategory({ ...categoryWithoutChildren });
          await updateCategory({ ...siblingWithoutChildren });
        }
      } else {
        const index = resultingCategories.findIndex(
          (child) => child.id === category.id
        );
        const sibling =
          resultingCategories[index + (direction === "up" ? -1 : 1)];
        if (sibling) {
          sibling.arrangement = index;
          category.arrangement = index + (direction === "up" ? -1 : 1);
          // Destructuring and excluding 'children' property
          const { children, ...categoryWithoutChildren } = category;
          const { children: siblingChildren, ...siblingWithoutChildren } =
            sibling;

          // Update category without 'children' property
          await updateCategory({ ...categoryWithoutChildren });
          await updateCategory({ ...siblingWithoutChildren });
        }
      }

      // Temp: Force Refresh
      window.location.reload();
    }

    // Left and right changes the parent of the category (by changing category.parent)
    if (direction === "left" || direction === "right") {
      if (direction === "left") {
        if (parent) {
          category.parent = parent.parent;
          // Destructuring and excluding 'children' property
          const { children, ...categoryWithoutChildren } = category;
          await updateCategory({ ...categoryWithoutChildren });
        }
      }

      if (direction === "right") {
        if (parent) {
          const index = parent.children!.findIndex(
            (child) => child.id === category.id
          );

          if (index > 0) {
            const newParent = parent.children![index - 1];
            category.parent = newParent.id;
            // Destructuring and excluding 'children' property
            const { children, ...categoryWithoutChildren } = category;
            await updateCategory({ ...categoryWithoutChildren });
          }
        } else {
          const index = resultingCategories.findIndex(
            (child) => child.id === category.id
          );

          if (index > 0) {
            const newParent = resultingCategories[index - 1];
            category.parent = newParent.id;
            // Destructuring and excluding 'children' property
            const { children, ...categoryWithoutChildren } = category;
            await updateCategory({ ...categoryWithoutChildren });
          }
        }
      }
    }
  };

  const findCategory = (
    categoryId: string,
    categories: Category[],
    parent: Category | null = null
  ): { category: Category; parent: Category | null } | undefined => {
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];

      if (category.id === categoryId) {
        return { category, parent: parent ? parent : null };
      }

      if (category.children) {
        const children = category.children!;
        const foundCategory = findCategory(categoryId, children, category); // Pass the current category's ID as the parentId
        if (foundCategory) {
          return foundCategory;
        }
      }
    }

    return undefined; // Return undefined if the category is not found
  };

  /* Helper function to render categories recursively with indentation */
  const renderCategoryWithIndentation = (category: Category, level: number) => (
    <React.Fragment key={category.id}>
      <div
        className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent rounded-lg"
        style={{
          marginLeft: `${level * 20}px`,
          width: `calc(100% - ${level * 20}px)`,
        }} // Indent based on hierarchy level
      >
        <div className="flex space-between items-center gap-4">
          <img
            src={category.media_url}
            alt={category.name}
            className="w-16 h-16 object-cover rounded-md"
          />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
            {category.name}
          </h2>
        </div>
        <div className="flex items-center gap-4">
        <Button
            className="w-20"
            color={"warning"}
            onClick={() => handleChangeArrangement(category.id, "up")}>
            Up
          </Button>
          <Button
            className="w-20"
            color={"purple"}
            onClick={() => handleChangeArrangement(category.id, "down")}>
            Down
          </Button>
          <Button
            className="w-20"
            color={"yellow"}
            onClick={() => handleChangeArrangement(category.id, "left")}>
            Left
          </Button>
          <Button
            className="w-20"
            color={"blue"}
            onClick={() => handleChangeArrangement(category.id, "right")}>
            Right
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button
            className="w-20"
            color={"info"}
            onClick={() => setSelectedCategory(category)}>
            Edit
          </Button>
          <Button
            className="w-20"
            color={"red"}
            onClick={() => {
              deleteCategory(category.id);
              showAlert("Category deleted successfully", "success");
            }}>
            Delete
          </Button>
          
        </div>
      </div>

      {/* Recursively render children categories with increased indentation */}
      {category.children &&
        category.children.map((child: Category) =>
          renderCategoryWithIndentation(child, level + 1)
        )}
    </React.Fragment>
  );
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
            <AddCategoryModal />
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-4">
            <div
              className={`p-4 ${
                selectedCategory ? "col-span-2" : "col-span-3"
              }`}>
              <form className="lg:pr-3">
                <Label htmlFor="categories-search" className="sr-only">
                  Search
                </Label>
                <div className="relative mt-1">
                  <TextInput
                    id="categories-search"
                    name="categories-search"
                    placeholder="Search for Categories"
                    className="w-full mb-4"
                    style={{ background: "transparent" }}
                    value={searchValue}
                    icon={IoIosSearch}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
              </form>
              {resultingCategories.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1">
                  {resultingCategories
                    .filter((category) =>
                      category.name
                        .toLowerCase()
                        .includes(searchValue.toLowerCase())
                    )
                    .map((category) => (
                      <React.Fragment key={category.id}>
                        {/* Render each category with indentation based on its hierarchy level */}
                        {renderCategoryWithIndentation(category, 0)}
                      </React.Fragment>
                    ))}
                </div>
              ) : (
                <>
                  <img
                    src="/images/illustrations/404.svg"
                    alt="No categories found"
                    className="mx-auto"
                  />
                  <div className="p-4 text-center">No categories found</div>
                </>
              )}
            </div>

            {selectedCategory && (
              <div className="col-span-1 border-l border-gray-200 dark:border-gray-500 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Edit Category
                  </h1>
                  <Button
                    color={"red"}
                    onClick={() => setSelectedCategory(null)}>
                    Close
                  </Button>
                </div>
                <div>
                  <Label htmlFor="media">Image</Label>
                  <div className="mt-1">
                    <FileInput
                      id="media"
                      name="media"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          setFile(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                  {/* Image Preview */}
                  {file && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Category Preview"
                        className="object-cover rounded-sm w-full max-h-64 rounded-md"
                      />
                    </div>
                  )}

                  {/* Check if the current selected category has media if so display it  */}
                  {selectedCategory.media_url && !file && (
                    <div className="mt-2">
                      <img
                        src={selectedCategory.media_url}
                        alt="Category Preview"
                        className="object-cover rounded-sm w-full max-h-64 rounded-md"
                      />
                    </div>
                  )}
                </div>

                <Label htmlFor="name">Name</Label>
                <div className="mt-1">
                  <TextInput
                    id="name"
                    name="name"
                    placeholder="Fruits & Vegetables"
                    value={selectedCategory?.name}
                    onChange={(e) =>
                      setSelectedCategory({
                        ...selectedCategory,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <Button
                  color={"info"}
                  onClick={() => handleUpdateCategory(selectedCategory)}
                  className="mt-4 w-full">
                  Save
                </Button>
              </div>
            )}

            {/* Preview */}
            <div className="col-span-1 border-l border-gray-200 dark:border-gray-500 p-2 h-[calc(100vh-7rem)] flex items-center justify-center">
              {/* Create a div with contrasting white background and rounded corners */}
              <div className="rounded-lg bg-white p-4 h-[calc(100vh-9rem)] w-full overflow-y-auto">
                {/* Create a row where the name of the category sits on top with the media as the background with slight dark overlay */}
                {resultingCategories.map((category) => (
                  <React.Fragment key={category.id}>
                    <div
                      className={`relative w-full h-16 rounded-lg overflow-hidden mb-2 ${
                        category.id === selectedCategory?.id
                          ? "border-4 border-red-500"
                          : ""
                      }`}
                      style={{ paddingLeft: `0px` }} // Root level categories
                      onClick={() => setSelectedCategory(category)}>
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
                      category.children.map((child) => (
                        <React.Fragment key={child.id}>
                          <div
                            className={`relative w-full h-16 rounded-lg overflow-hidden mb-2 ${
                              child.id === selectedCategory?.id
                                ? "border-4 border-red-500"
                                : ""
                            }`}
                            style={{
                              marginLeft: `20px`,
                              width: `calc(100% - 20px)`,
                            }} // Indent children categories
                            onClick={() => setSelectedCategory(child)}>
                            <img
                              src={child.media_url}
                              alt={child.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center p-4">
                              <h2 className="text-white text-2xl font-semibold">
                                {child.name}
                              </h2>
                            </div>
                          </div>

                          {/* Render sub-children recursively */}
                          {child.children &&
                            child.children.map((subChild) => (
                              <React.Fragment key={subChild.id}>
                                <div
                                  className={`relative w-full h-16 rounded-lg overflow-hidden mb-2 ${
                                    subChild.id === selectedCategory?.id
                                      ? "border-4 border-red-500"
                                      : ""
                                  }`}
                                  style={{
                                    marginLeft: `40px`,
                                    width: `calc(100% - 40px)`,
                                  }} // Further indent sub-children categories
                                  onClick={() => setSelectedCategory(subChild)}>
                                  <img
                                    src={subChild.media_url}
                                    alt={subChild.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center p-4">
                                    <h2 className="text-white text-2xl font-semibold">
                                      {subChild.name}
                                    </h2>
                                  </div>
                                </div>
                                {/* Continue this pattern for deeper levels if needed */}
                              </React.Fragment>
                            ))}
                        </React.Fragment>
                      ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

export default CategoryListPage;
