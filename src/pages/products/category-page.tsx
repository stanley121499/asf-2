/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, FileInput, Label, TextInput } from "flowbite-react";
import React from "react";
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

    await updateCategory(category);
    setSelectedCategory(null);
    setFile(null);
    showAlert("Category updated successfully", "success");
  };

  const handleChangeArrangement = async (
    categoryId: string,
    direction: "up" | "down"
  ) => {
    const category = categories.find((category) => category.id === categoryId);
    if (!category) return;
    const index = categories.indexOf(category);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const targetCategory = categories[targetIndex];

    if (!targetCategory) {
      return;
    }

    const tempArrangement = category.arrangement;
    category.arrangement = targetCategory.arrangement;
    targetCategory.arrangement = tempArrangement;

    await updateCategory(category);
    await updateCategory(targetCategory);
    showAlert("Category arrangement updated successfully", "success");
  };

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
              {categories.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1">
                  {categories
                    .filter((category) =>
                      category.name
                        .toLowerCase()
                        .includes(searchValue.toLowerCase())
                    )
                    .map((category) => (
                      <div
                        key={category.id}
                        className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent rounded-lg">
                        <div className="flex items-center gap-4">
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
                            className="w-40"
                            color={"info"}
                            onClick={() => setSelectedCategory(category)}>
                            Edit
                          </Button>
                          <Button
                            className="w-40"
                            color={"red"}
                            onClick={() => {
                              deleteCategory(category.id);
                              showAlert(
                                "Category deleted successfully",
                                "success"
                              );
                            }}>
                            Delete
                          </Button>
                          <Button
                            className="w-40"
                            color={"warning"}
                            onClick={() =>
                              handleChangeArrangement(category.id, "up")
                            }>
                            Up
                          </Button>
                          <Button
                            className="w-40"
                            color={"purple"}
                            onClick={() =>
                              handleChangeArrangement(category.id, "down")
                            }>
                            Down
                          </Button>
                        </div>
                      </div>
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
                {categories.map((category) => (
                  <div
                    className={`relative w-full h-16 rounded-lg overflow-hidden mb-2 ${
                      category.id === selectedCategory?.id
                        ? "border-4 border-red-500"
                        : ""
                    }`}
                    key={category.id}
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
