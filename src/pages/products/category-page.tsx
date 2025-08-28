import { Button, FileInput, Label, TextInput } from "flowbite-react";
import React, { useCallback, useEffect } from "react";
import {
  Category,
  CategoryUpdate,
  useCategoryContext,
} from "../../context/product/CategoryContext";
import { useBrandContext, Brand, BrandInsert, BrandUpdate } from "../../context/product/BrandContext";
import { useDepartmentContext, Department, DepartmentInsert, DepartmentUpdate } from "../../context/product/DepartmentContext";
import { useRangeContext, Range, RangeInsert, RangeUpdate } from "../../context/product/RangeContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { IoIosSearch } from "react-icons/io";
import { useAlertContext } from "../../context/AlertContext";
import { supabase } from "../../utils/supabaseClient";
import AddSetModal from "./create-set-modal";
// Preview removed

const CategoryListPage: React.FC = function () {
  const { categories, loading, updateCategory, deleteCategory } =
    useCategoryContext();
  const { brands, loading: brandsLoading, createBrand, updateBrand, deleteBrand } = useBrandContext();
  const { departments, loading: departmentsLoading, createDepartment, updateDepartment, deleteDepartment } = useDepartmentContext();
  const { ranges, loading: rangesLoading, createRange, updateRange, deleteRange } = useRangeContext();
  const [selectedCategory, setSelectedCategory] =
    React.useState<Category | null>(null);
  const [selectedBrand, setSelectedBrand] = React.useState<Brand | null>(null);
  const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);
  const [selectedRange, setSelectedRange] = React.useState<Range | null>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [brandSearch, setBrandSearch] = React.useState("");
  const [departmentSearch, setDepartmentSearch] = React.useState("");
  const [rangeSearch, setRangeSearch] = React.useState("");
  const { showAlert } = useAlertContext();
  const [file, setFile] = React.useState<File | null>(null);
  const [deptFile, setDeptFile] = React.useState<File | null>(null);
  const [rangeFile, setRangeFile] = React.useState<File | null>(null);
  const [brandFile, setBrandFile] = React.useState<File | null>(null);
  const [resultingCategories, setResultingCategories] = React.useState<
    Category[]
  >([]);
  // creation moved to modals; keep state minimal here
  const [activeSet, setActiveSet] = React.useState<
    "categories" | "departments" | "ranges" | "brands"
  >("categories");

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

  if (loading || brandsLoading || departmentsLoading || rangesLoading) {
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

  // Removed arrangement/parent change handlers. Category order is now static.

  /* Helper function to render categories recursively with indentation */
  const renderCategoryWithIndentation = (category: Category, level: number) => (
    <React.Fragment key={category.id}>
      <div
        className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent rounded-lg"
        style={{
          marginLeft: `${level * 20}px`,
          width: `calc(100% - ${level * 20}px)`,
        }}
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
            color={"info"}
            onClick={() => setSelectedCategory(category)}
          >
            Edit
          </Button>
          <Button
            className="w-20"
            color={"red"}
            onClick={() => {
              deleteCategory(category.id);
              showAlert("Category deleted", "success");
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {category.children &&
        category.children.map((child: Category) =>
          renderCategoryWithIndentation(child, level + 1)
        )}
    </React.Fragment>
  );

  // Handlers for new sets
  // Creation moved to modal; handler removed

  type BrandUpdatePayload = BrandUpdate & { id: string; media_url?: string | null };
  const handleSaveBrand = async (brand: Brand | null): Promise<void> => {
    if (!brand) return;
    const payload: BrandUpdatePayload = {
      id: brand.id,
      name: brand.name,
      active: brand.active,
    };
    if (brandFile) {
      const randomId = Math.random().toString(36).substring(2);
      const { data, error } = await supabase.storage
        .from("product_medias")
        .upload(`${randomId}`, brandFile, { cacheControl: "3600", upsert: false });
      if (error) {
        console.error(error);
        showAlert("Failed to upload file", "error");
        return;
      }
      payload.media_url = `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/${data.path}`;
    }
    await updateBrand(payload);
    setSelectedBrand(null);
    setBrandFile(null);
    showAlert("Brand updated", "success");
  };

  const handleToggleBrandActive = async (brand: Brand): Promise<void> => {
    const payload: BrandUpdate & { id: string } = {
      id: brand.id,
      active: !brand.active,
    };
    await updateBrand(payload);
  };

  // Creation moved to modal; handler removed

  type DepartmentUpdatePayload = DepartmentUpdate & { id: string; media_url?: string | null };
  const handleSaveDepartment = async (
    department: Department | null
  ): Promise<void> => {
    if (!department) return;
    const payload: DepartmentUpdatePayload = {
      id: department.id,
      name: department.name,
      active: department.active,
    };
    if (deptFile) {
      const randomId = Math.random().toString(36).substring(2);
      const { data, error } = await supabase.storage
        .from("product_medias")
        .upload(`${randomId}`, deptFile, { cacheControl: "3600", upsert: false });
      if (error) {
        console.error(error);
        showAlert("Failed to upload file", "error");
        return;
      }
      payload.media_url = `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/${data.path}`;
    }
    await updateDepartment(payload);
    setSelectedDepartment(null);
    setDeptFile(null);
    showAlert("Department updated", "success");
  };

  const handleToggleDepartmentActive = async (
    department: Department
  ): Promise<void> => {
    const payload: DepartmentUpdate & { id: string } = {
      id: department.id,
      active: !department.active,
    };
    await updateDepartment(payload);
  };

  // Creation moved to modal; handler removed

  type RangeUpdatePayload = RangeUpdate & { id: string; media_url?: string | null };
  const handleSaveRange = async (range: Range | null): Promise<void> => {
    if (!range) return;
    const payload: RangeUpdatePayload = {
      id: range.id,
      name: range.name,
      active: range.active,
    };
    if (rangeFile) {
      const randomId = Math.random().toString(36).substring(2);
      const { data, error } = await supabase.storage
        .from("product_medias")
        .upload(`${randomId}`, rangeFile, { cacheControl: "3600", upsert: false });
      if (error) {
        console.error(error);
        showAlert("Failed to upload file", "error");
        return;
      }
      payload.media_url = `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/${data.path}`;
    }
    await updateRange(payload);
    setSelectedRange(null);
    setRangeFile(null);
    showAlert("Range updated", "success");
  };

  const handleToggleRangeActive = async (range: Range): Promise<void> => {
    const payload: RangeUpdate & { id: string } = {
      id: range.id,
      active: !range.active,
    };
    await updateRange(payload);
  };

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Products</h1>
              <a href="/products/list" className="text-sm text-grey-500 dark:text-grey-400 hover:underline">All Products</a>
              <a href="/products/categories" className="text-sm text-grey-500 dark:text-grey-400 hover:underline">Category</a>
              
              <a href="/products/schedule" className="text-sm text-grey-500 dark:text-grey-400 hover:underline">Schedule</a>
            </div>
            <AddSetModal activeSet={activeSet} />
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4 ">
        <div className="flex gap-2 mb-4">
          <Button color={activeSet === "categories" ? "info" : "gray"} onClick={() => setActiveSet("categories")}>Categories</Button>
          <Button color={activeSet === "departments" ? "info" : "gray"} onClick={() => setActiveSet("departments")}>Departments</Button>
          <Button color={activeSet === "ranges" ? "info" : "gray"} onClick={() => setActiveSet("ranges")}>Ranges</Button>
          <Button color={activeSet === "brands" ? "info" : "gray"} onClick={() => setActiveSet("brands")}>Brands</Button>
        </div>

        <div className="overflow-x-auto">
          {activeSet === "categories" && (
            <div className="grid grid-cols-3">
              <div className={`p-4 ${selectedCategory ? "col-span-2" : "col-span-3"}`}>
                <form className="lg:pr-3">
                  <Label htmlFor="categories-search" className="sr-only">Search</Label>
                  <div className="relative mt-1">
                    <TextInput id="categories-search" name="categories-search" placeholder="Search for Categories" className="w-full mb-4" style={{ background: "transparent" }} value={searchValue} icon={IoIosSearch} onChange={(e) => setSearchValue(e.target.value)} />
                  </div>
                </form>
                {resultingCategories.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1">
                    {resultingCategories
                      .filter((category) => category.name.toLowerCase().includes(searchValue.toLowerCase()))
                      .map((category) => (
                        <React.Fragment key={category.id}>{renderCategoryWithIndentation(category, 0)}</React.Fragment>
                      ))}
                  </div>
                ) : (
                  <>
                    <img src="/images/illustrations/404.svg" alt="No categories found" className="mx-auto" />
                    <div className="p-4 text-center">No categories found</div>
                  </>
                )}
              </div>

              {selectedCategory && (
                <div className="col-span-1 border-l border-gray-200 dark:border-gray-500 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Edit Category</h1>
                    <Button color={"red"} onClick={() => setSelectedCategory(null)}>Close</Button>
                  </div>
                  <div>
                    <Label htmlFor="media">Image</Label>
                    <div className="mt-1">
                      <FileInput id="media" name="media" accept="image/*" onChange={(e) => { if (e.target.files) { setFile(e.target.files[0]); } }} />
                    </div>
                    {file && (
                      <div className="mt-2">
                        <img src={URL.createObjectURL(file)} alt="Category Preview" className="object-cover rounded-sm w-full max-h-64 rounded-md" />
                      </div>
                    )}
                    {selectedCategory.media_url && !file && (
                      <div className="mt-2">
                        <img src={selectedCategory.media_url} alt="Category Preview" className="object-cover rounded-sm w-full max-h-64 rounded-md" />
                      </div>
                    )}
                  </div>
                  <Label htmlFor="name">Name</Label>
                  <div className="mt-1">
                    <TextInput id="name" name="name" placeholder="Fruits & Vegetables" value={selectedCategory?.name} onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })} />
                  </div>
                  <Button color={"info"} onClick={() => handleUpdateCategory(selectedCategory!)} className="mt-4 w-full">Save</Button>
                </div>
              )}

              {/* Preview removed */}
            </div>
          )}

          {activeSet === "departments" && (
            <div className="grid grid-cols-3">
              <div className={`p-4 ${selectedDepartment ? "col-span-2" : "col-span-3"}`}>
                <form className="lg:pr-3">
                  <Label htmlFor="departments-search" className="sr-only">Search</Label>
                  <div className="relative mt-1">
                    <TextInput id="departments-search" name="departments-search" placeholder="Search Departments" className="w-full mb-4" style={{ background: "transparent" }} value={departmentSearch} icon={IoIosSearch} onChange={(e) => setDepartmentSearch(e.target.value)} />
                  </div>
                </form>
                {/* Create Department via a modal (added separately) */}
                <div className="grid grid-cols-1 gap-2">
                  {departments
                    .filter((d) => (d.name || "").toLowerCase().includes(departmentSearch.toLowerCase()))
                    .map((d) => (
                      <div key={d.id} className="rounded-lg shadow p-3 flex items-center justify-between border border-gray-200 dark:border-gray-500 bg-transparent">
                        <div className="flex items-center gap-4">
                          {d.media_url && (
                            <img src={d.media_url} alt={d.name || "Department"} className="w-16 h-16 object-cover rounded-md" />
                          )}
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">{d.name || "Untitled Department"}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button color="info" onClick={() => setSelectedDepartment(d)}>Edit</Button>
                          <Button color="red" onClick={() => deleteDepartment(d.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              {selectedDepartment && (
                <div className="col-span-1 border-l border-gray-200 dark:border-gray-500 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Edit Department</h1>
                    <Button color={"red"} onClick={() => setSelectedDepartment(null)}>Close</Button>
                  </div>
                  <div>
                    <Label htmlFor="dept-media">Image</Label>
                    <div className="mt-1">
                      <FileInput id="dept-media" name="dept-media" accept="image/*" onChange={(e) => { if (e.target.files) { setDeptFile(e.target.files[0]); } }} />
                    </div>
                    {deptFile && (
                      <div className="mt-2">
                        <img src={URL.createObjectURL(deptFile)} alt="Department Preview" className="object-cover rounded-sm w-full max-h-64 rounded-md" />
                      </div>
                    )}
                    {selectedDepartment.media_url && !deptFile && (
                      <div className="mt-2">
                        <img src={selectedDepartment.media_url || ""} alt="Department Preview" className="object-cover rounded-sm w-full max-h-64 rounded-md" />
                      </div>
                    )}
                  </div>
                  <Label htmlFor="dept-name">Name</Label>
                  <div className="mt-1">
                    <TextInput id="dept-name" name="dept-name" placeholder="Department Name" value={selectedDepartment.name || ""} onChange={(e) => setSelectedDepartment({ ...selectedDepartment, name: e.target.value })} />
                  </div>
                  <Button color={"info"} onClick={() => handleSaveDepartment(selectedDepartment)} className="mt-4 w-full">Save</Button>
                </div>
              )}
            </div>
          )}

          {activeSet === "ranges" && (
            <div className="grid grid-cols-3">
              <div className={`p-4 ${selectedRange ? "col-span-2" : "col-span-3"}`}>
                <form className="lg:pr-3">
                  <Label htmlFor="ranges-search" className="sr-only">Search</Label>
                  <div className="relative mt-1">
                    <TextInput id="ranges-search" name="ranges-search" placeholder="Search Ranges" className="w-full mb-4" style={{ background: "transparent" }} value={rangeSearch} icon={IoIosSearch} onChange={(e) => setRangeSearch(e.target.value)} />
                  </div>
                </form>
                {/* Create Range via a modal (added separately) */}
                <div className="grid grid-cols-1 gap-2">
                  {ranges
                    .filter((r) => (r.name || "").toLowerCase().includes(rangeSearch.toLowerCase()))
                    .map((r) => (
                      <div key={r.id} className="rounded-lg shadow p-3 flex items-center justify-between border border-gray-200 dark:border-gray-500 bg-transparent">
                        <div className="flex items-center gap-4">
                          {r.media_url && (
                            <img src={r.media_url} alt={r.name || "Range"} className="w-16 h-16 object-cover rounded-md" />
                          )}
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">{r.name || "Untitled Range"}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button color="info" onClick={() => setSelectedRange(r)}>Edit</Button>
                          <Button color="red" onClick={() => deleteRange(r.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              {selectedRange && (
                <div className="col-span-1 border-l border-gray-200 dark:border-gray-500 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Edit Range</h1>
                    <Button color={"red"} onClick={() => setSelectedRange(null)}>Close</Button>
                  </div>
                  <div>
                    <Label htmlFor="range-media">Image</Label>
                    <div className="mt-1">
                      <FileInput id="range-media" name="range-media" accept="image/*" onChange={(e) => { if (e.target.files) { setRangeFile(e.target.files[0]); } }} />
                    </div>
                    {rangeFile && (
                      <div className="mt-2">
                        <img src={URL.createObjectURL(rangeFile)} alt="Range Preview" className="object-cover rounded-sm w-full max-h-64 rounded-md" />
                      </div>
                    )}
                    {selectedRange.media_url && !rangeFile && (
                      <div className="mt-2">
                        <img src={selectedRange.media_url || ""} alt="Range Preview" className="object-cover rounded-sm w-full max-h-64 rounded-md" />
                      </div>
                    )}
                  </div>
                  <Label htmlFor="range-name">Name</Label>
                  <div className="mt-1">
                    <TextInput id="range-name" name="range-name" placeholder="Range Name" value={selectedRange.name || ""} onChange={(e) => setSelectedRange({ ...selectedRange, name: e.target.value })} />
                  </div>
                  <Button color={"info"} onClick={() => handleSaveRange(selectedRange)} className="mt-4 w-full">Save</Button>
                </div>
              )}
            </div>
          )}

          {activeSet === "brands" && (
            <div className="grid grid-cols-3">
              <div className={`p-4 ${selectedBrand ? "col-span-2" : "col-span-3"}`}>
                <form className="lg:pr-3">
                  <Label htmlFor="brands-search" className="sr-only">Search</Label>
                  <div className="relative mt-1">
                    <TextInput id="brands-search" name="brands-search" placeholder="Search Brands" className="w-full mb-4" style={{ background: "transparent" }} value={brandSearch} icon={IoIosSearch} onChange={(e) => setBrandSearch(e.target.value)} />
                  </div>
                </form>
                {/* Create Brand via a modal (added separately) */}
                <div className="grid grid-cols-1 gap-2">
                  {brands
                    .filter((b) => (b.name || "").toLowerCase().includes(brandSearch.toLowerCase()))
                    .map((b) => (
                      <div key={b.id} className="rounded-lg shadow p-3 flex items-center justify-between border border-gray-200 dark:border-gray-500 bg-transparent">
                        <div className="flex items-center gap-4">
                          {b.media_url && (
                            <img src={b.media_url} alt={b.name || "Brand"} className="w-16 h-16 object-cover rounded-md" />
                          )}
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">{b.name || "Untitled Brand"}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button color="info" onClick={() => setSelectedBrand(b)}>Edit</Button>
                          <Button color="red" onClick={() => deleteBrand(b.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              {selectedBrand && (
                <div className="col-span-1 border-l border-gray-200 dark:border-gray-500 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Edit Brand</h1>
                    <Button color={"red"} onClick={() => setSelectedBrand(null)}>Close</Button>
                  </div>
                  <div>
                    <Label htmlFor="brand-media">Image</Label>
                    <div className="mt-1">
                      <FileInput id="brand-media" name="brand-media" accept="image/*" onChange={(e) => { if (e.target.files) { setBrandFile(e.target.files[0]); } }} />
                    </div>
                    {brandFile && (
                      <div className="mt-2">
                        <img src={URL.createObjectURL(brandFile)} alt="Brand Preview" className="object-cover rounded-sm w-full max-h-64 rounded-md" />
                      </div>
                    )}
                    {selectedBrand.media_url && !brandFile && (
                      <div className="mt-2">
                        <img src={selectedBrand.media_url || ""} alt="Brand Preview" className="object-cover rounded-sm w-full max-h-64 rounded-md" />
                      </div>
                    )}
                  </div>
                  <Label htmlFor="brand-name">Name</Label>
                  <div className="mt-1">
                    <TextInput id="brand-name" name="brand-name" placeholder="Brand Name" value={selectedBrand.name || ""} onChange={(e) => setSelectedBrand({ ...selectedBrand, name: e.target.value })} />
                  </div>
                  <Button color={"info"} onClick={() => handleSaveBrand(selectedBrand)} className="mt-4 w-full">Save</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

export default CategoryListPage;
