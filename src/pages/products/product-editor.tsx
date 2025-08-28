import * as flowbiteReact from "flowbite-react";
import { Badge, Button, Label } from "flowbite-react";
import React, { useEffect, useState } from "react";
import ProductComponent from "../../components/product/product";
import { useAlertContext } from "../../context/AlertContext";
import {
  Category,
  useCategoryContext,
} from "../../context/product/CategoryContext";
import { useDepartmentContext } from "../../context/product/DepartmentContext";
import { useRangeContext } from "../../context/product/RangeContext";
import { useBrandContext } from "../../context/product/BrandContext";
import {
  Product,
  ProductInsert,
  useProductContext,
} from "../../context/product/ProductContext";
import { ProductFolder } from "../../context/product/ProductFolderContext";
import {
  ProductFolderMedia,
  useProductFolderMediaContext,
} from "../../context/product/ProductFolderMediaContext";
import {
  ProductMediaInsert,
  useProductMediaContext,
} from "../../context/product/ProductMediaContext";
import { FaChevronDown } from "react-icons/fa6";
import { supabase } from "../../utils/supabaseClient";

/**
 * Interface for category v2 items from localStorage
 */
// Deprecated Category V2 interface removed

interface ProductEditorProps {
  selectedFolder: ProductFolder | null;
  setSelectedFolder: React.Dispatch<React.SetStateAction<ProductFolder | null>>;
  selectedProduct: Product | null;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>;
}

const ProductEditor: React.FC<ProductEditorProps> = ({
  selectedFolder,
  setSelectedFolder,
  setSelectedProduct,
  selectedProduct,
}) => {
  const {
    createProductMedia,
    deleteAllProductMediaByProductId,
    productMedias,
  } = useProductMediaContext();
  const { createProduct, updateProduct } = useProductContext();
  const { showAlert } = useAlertContext();
  const { categories } = useCategoryContext();
  const { departments } = useDepartmentContext();
  const { ranges } = useRangeContext();
  const { brands } = useBrandContext();
  const { productFolderMedias } = useProductFolderMediaContext();
  const [productDetailToggle, setProductDetailToggle] = React.useState(false);
  const [selectedMedias, setSelectedMedias] = React.useState<
    ProductFolderMedia[]
  >([]);
  const [arrangedMedias, setArrangedMedias] = React.useState<
    ProductFolderMedia[]
  >([]);
  const [previewMedia, setPreviewMedia] = React.useState<string>("");
  const [selectedCategories, setSelectedCategories] = React.useState<
    Category[]
  >([]);
  // legacy inputs removed
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState<string>("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState<string>("");
  // legacy filtered categories removed
  
  // New category system
  const [categoryMode, setCategoryMode] = useState<"category" | "set">("category");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedRangeId, setSelectedRangeId] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  
  const [productData, setProductData] = React.useState<ProductInsert>({
    name: selectedProduct?.name || "",
    product_folder_id: selectedFolder?.id,
    article_number: "",
    price: 0,
    festival: "",
    season: "",
    stock_place: "",
    stock_code: "",
    description: "",
    warranty_period: "",
    warranty_description: "",
    status: "",
  });

  const handleSave = () => {
    // Check if all fields are filled
    if (!productData.name) {
      showAlert("Please fill all fields", "error");
      return;
    }

    const payload: ProductInsert = {
      ...productData,
      category_id: selectedCategoryId ? selectedCategoryId : null,
      department_id: selectedDepartmentId ? selectedDepartmentId : null,
      range_id: selectedRangeId ? selectedRangeId : null,
      brand_id: selectedBrandId ? selectedBrandId : null,
    };

    if (selectedProduct) {
      updateProduct(
        { ...payload, id: selectedProduct.id },
        selectedColors,
        selectedSizes,
        selectedCategories
      ).then(() => {
        deleteAllProductMediaByProductId(selectedProduct.id);

        arrangedMedias.forEach(async (media, index) => {
          const newProductMedia: ProductMediaInsert = {
            product_id: selectedProduct.id,
            media_url: media.media_url,
            arrangement: index,
          };

          createProductMedia(newProductMedia);
        });

        // setSelectedFolder(null);
        // setSelectedProduct(null);
        showAlert("Product updated successfully", "success");
      });
    } else {
      createProduct(
        payload,
        selectedColors,
        selectedSizes,
        selectedCategories
      ).then((product) => {
        if (product) {
          arrangedMedias.forEach((media, index) => {
            const newProductMedia: ProductMediaInsert = {
              product_id: product.id,
              media_url: media.media_url,
              arrangement: index,
            };

            createProductMedia(newProductMedia);
          });

          setSelectedFolder(null);
          setSelectedProduct(product);
          showAlert("Product created successfully", "success");
        }
      });
    }
  };

  // Initialize selection values based on selectedProduct
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.category_id) {
        setCategoryMode("category");
        setSelectedCategoryId(selectedProduct.category_id || "");
        setSelectedDepartmentId("");
        setSelectedRangeId("");
        setSelectedBrandId("");
      } else if (selectedProduct.department_id || selectedProduct.range_id || selectedProduct.brand_id) {
        setCategoryMode("set");
        setSelectedDepartmentId(selectedProduct.department_id || "");
        setSelectedRangeId(selectedProduct.range_id || "");
        setSelectedBrandId(selectedProduct.brand_id || "");
        setSelectedCategoryId("");
      }
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      // Ensure classification ids (category/department/range/brand) are loaded from base table
      (async () => {
        const { data } = await supabase
          .from("products")
          .select("category_id, department_id, range_id, brand_id")
          .eq("id", selectedProduct.id)
          .single();
        if (data) {
          setSelectedCategoryId(data.category_id || "");
          setSelectedDepartmentId(data.department_id || "");
          setSelectedRangeId(data.range_id || "");
          setSelectedBrandId(data.brand_id || "");
        }
      })();
      setProductData({
        name: selectedProduct.name,
        product_folder_id: selectedProduct.product_folder_id,
        article_number: selectedProduct.article_number,
        price: selectedProduct.price,
        festival: selectedProduct.festival,
        season: selectedProduct.season,
        stock_place: selectedProduct.stock_place,
        stock_code: selectedProduct.stock_code,
        description: selectedProduct.description,
        warranty_period: selectedProduct.warranty_period,
        warranty_description: selectedProduct.warranty_description,
        status: selectedProduct.status,
      });

      // setSelectedCategories(selectedProduct.product_categories || []);
      // For color and size only use those that are active
      setSelectedColors(
        selectedProduct.product_colors?.filter((color) => color.active)
          .map((color) => color.color) || []
      );
      setSelectedSizes(
        selectedProduct.product_sizes?.filter((size) => size.active)
          .map((size) => size.size) || []
      );
      
      // Ensure medias is initialized as an array
      if (!selectedProduct.medias) {
        selectedProduct.medias = [];
      }
      
      selectedProduct.medias = productMedias.filter(
        (media) => media.product_id === selectedProduct.id
      );

      // Compare media_url in selectedProduct.medias and productFolderMedias to generate an array of ProductFolderMedia
      const selectedProductMedias = selectedProduct.medias.map((media) => {
        return (
          productFolderMedias.find(
            (pfm) => pfm.media_url === media.media_url
          ) || null
        );
      });

      setArrangedMedias(
        selectedProductMedias.filter(
          (media) => media !== null
        ) as ProductFolderMedia[]
      );
    } else {
      setProductData({
        name: "",
        product_folder_id: selectedFolder?.id,
        article_number: "",
        price: 0,
        festival: "",
        season: "",
        stock_place: "",
        stock_code: "",
        description: "",
        warranty_period: "",
        warranty_description: "",
        status: "",
      });

      setArrangedMedias([]);
      setSelectedMedias([]);
      setSelectedCategories([]);
      setSelectedColors([]);
      setSelectedSizes([]);
      // Reset new selection fields when no product is selected
      setCategoryMode("category");
      setSelectedDepartmentId("");
      setSelectedRangeId("");
      setSelectedBrandId("");
      setSelectedCategoryId("");
    }
  }, [productFolderMedias, productMedias, selectedFolder?.id, selectedProduct]);

  // legacy handlers removed

  const handleColorInputChange = (e: { target: { value: any } }) => {
    const value = e.target.value;
    setColorInput(value);
  };

  const handleColorKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && colorInput.trim() !== "") {
      setSelectedColors((prev) => [...prev, colorInput]);
      setColorInput("");
    }
  };

  const handleSizeInputChange = (e: { target: { value: any } }) => {
    const value = e.target.value;
    setSizeInput(value);
  };

  const handleSizeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && sizeInput.trim() !== "") {
      setSelectedSizes((prev) => [...prev, sizeInput]);
      setSizeInput("");
    }
  };
  const removeColor = (color: string) => {
    setSelectedColors((prev) => prev.filter((c) => c !== color));
  };

  const removeSize = (size: string) => {
    setSelectedSizes((prev) => prev.filter((s) => s !== size));
  };

  return (
    <>
      {selectedFolder && (
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-4">
          <div className="col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                {productDetailToggle ? "Product Details" : "Medias"}
              </h2>
              <div className="flex items-center space-x-2">
                <Button
                  className="btn btn-primary"
                  onClick={() => {
                    setProductDetailToggle(!productDetailToggle);
                  }}>
                  {productDetailToggle ? "Medias" : "Product Details"}
                </Button>
                <Button className="btn btn-green" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
            {!productDetailToggle && (
              <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-4 mt-4 overflow-auto hide-scrollbar max-h-[calc(100vh-4rem)] relative">
                {selectedFolder.medias.length > 12 && (
                  <div className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-50">
                    <span className="text-white text-lg">
                      <FaChevronDown />
                    </span>
                  </div>
                )}
                {selectedFolder.medias.map((media) => (
                  // <Card key={media.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <div
                    className="relative group cursor-pointer"
                    key={media.id}
                    onClick={() => {
                      const isMediaSelected = selectedMedias.find(
                        (m) => m.id === media.id
                      );
                      if (isMediaSelected) {
                        setPreviewMedia(media.media_url);
                      } else {
                        setSelectedMedias((prev) => [...prev, media]);
                        setPreviewMedia(media.media_url);
                      }
                    }}>
                    <img
                      src={media.media_url}
                      alt="media"
                      className="w-full object-cover rounded"
                      style={{ height: `calc((100vh - 9rem) / 4)` }}
                    />
                    {/* Show a tick on top of the image if selected */}
                    {(selectedMedias.find((m) => m.id === media.id) ||
                      arrangedMedias.find((m) => m.id === media.id)) && (
                      <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 p-1 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {productDetailToggle && (
              // Overflow
              <div
                className="overflow-auto hide-scrollbar"
                style={{ maxHeight: "calc(100vh - 4rem)" }}>
                {/* Name */}
                <div className="mt-4">
                  <flowbiteReact.Label>Product Name</flowbiteReact.Label>
                  <flowbiteReact.TextInput
                    id="name"
                    name="name"
                    placeholder="Enter name"
                    // icon={HiMail}
                    value={productData?.name}
                    onChange={(e) =>
                      setProductData({ ...productData, name: e.target.value })
                    }
                  />
                </div>

                {/* Category selection (2x2 dropdowns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="category" className="text-sm">Category</Label>
                    <flowbiteReact.Select id="category" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} className="mt-1">
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </flowbiteReact.Select>
                  </div>
                  <div>
                    <Label htmlFor="department" className="text-sm">Department</Label>
                    <flowbiteReact.Select id="department" value={selectedDepartmentId} onChange={(e) => setSelectedDepartmentId(e.target.value)} className="mt-1">
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </flowbiteReact.Select>
                  </div>
                  <div>
                    <Label htmlFor="range" className="text-sm">Range</Label>
                    <flowbiteReact.Select id="range" value={selectedRangeId} onChange={(e) => setSelectedRangeId(e.target.value)} className="mt-1">
                      <option value="">Select Range</option>
                      {ranges.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </flowbiteReact.Select>
                  </div>
                  <div>
                    <Label htmlFor="brand" className="text-sm">Brand</Label>
                    <flowbiteReact.Select id="brand" value={selectedBrandId} onChange={(e) => setSelectedBrandId(e.target.value)} className="mt-1">
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </flowbiteReact.Select>
                  </div>
                </div>

                {/* Article Number */}
                <div className="mt-4">
                  <flowbiteReact.Label>Article Number</flowbiteReact.Label>
                  <flowbiteReact.TextInput
                    id="article_number"
                    name="article_number"
                    placeholder="Enter article number"
                    value={productData?.article_number || ""}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        article_number: e.target.value,
                      })
                    }
                  />
                </div>
                {/* Color */}
                <div className="mt-4">
                  <Label htmlFor="color">Color</Label>
                  <div className="relative">
                    <div className="custom-input flex items-center flex-wrap block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg">
                      {selectedColors.map((color, index) => (
                        <Badge
                          key={color + index}
                          color="info"
                          className="mr-2 mb-1 flex items-center">
                          {color}
                          <span
                            className="ml-1 cursor-pointer"
                            onClick={() => removeColor(color)}>
                            &times;
                          </span>
                        </Badge>
                      ))}
                      <input
                        id="color"
                        name="color"
                        placeholder="Enter color"
                        value={colorInput}
                        onChange={handleColorInputChange}
                        onKeyDown={handleColorKeyPress}
                        autoComplete="off"
                        className="flex-grow border-none focus:ring-0 focus:outline-none dark:bg-gray-700 bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4">
                  <flowbiteReact.Label>Price</flowbiteReact.Label>
                  <flowbiteReact.TextInput
                    id="price"
                    name="price"
                    placeholder="Enter price"
                    // Max two decimal places
                    type="number"
                    value={productData?.price}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        price: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                {/* Size */}
                <div className="mt-4">
                  <Label htmlFor="size">Size</Label>
                  <div className="relative">
                    <div className="custom-input flex items-center flex-wrap block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg">
                      {selectedSizes.map((size, index) => (
                        <Badge
                          key={size + index}
                          color="info"
                          className="mr-2 mb-1 flex items-center">
                          {size}
                          <span
                            className="ml-1 cursor-pointer"
                            onClick={() => removeSize(size)}>
                            &times;
                          </span>
                        </Badge>
                      ))}
                      <input
                        id="size"
                        name="size"
                        placeholder="Enter size"
                        value={sizeInput}
                        onChange={handleSizeInputChange}
                        onKeyDown={handleSizeKeyPress}
                        autoComplete="off"
                        className="flex-grow border-none focus:ring-0 focus:outline-none dark:bg-gray-700 bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Create a divider here */}
                <div className="border-t border-gray-200 dark:border-gray-800 my-4"></div>

                {/* Festival */}
                <div className="mt-4">
                  <flowbiteReact.Label>Festival</flowbiteReact.Label>
                  <flowbiteReact.TextInput
                    id="festival"
                    name="festival"
                    placeholder="Enter festival"
                    value={productData?.festival || ""}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        festival: e.target.value,
                      })
                    }
                  />
                </div>
                {/* Season */}
                <div className="mt-4">
                  <flowbiteReact.Label>Season</flowbiteReact.Label>
                  <flowbiteReact.TextInput
                    id="season"
                    name="season"
                    placeholder="Enter season"
                    value={productData?.season || ""}
                    onChange={(e) =>
                      setProductData({ ...productData, season: e.target.value })
                    }
                  />
                </div>
                {/* Stock Place */}
                <div className="mt-4">
                  <flowbiteReact.Label>Stock Place</flowbiteReact.Label>
                  <flowbiteReact.TextInput
                    id="stock_place"
                    name="stock_place"
                    placeholder="Enter stock place"
                    value={productData?.stock_place || ""}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        stock_place: e.target.value,
                      })
                    }
                  />
                </div>
                {/* Stock Code */}
                <div className="mt-4">
                  <flowbiteReact.Label>Stock Code</flowbiteReact.Label>
                  <flowbiteReact.TextInput
                    id="stock_code"
                    name="stock_code"
                    placeholder="Enter stock code"
                    value={productData?.stock_code || ""}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        stock_code: e.target.value,
                      })
                    }
                  />
                </div>
                {/* Product Description */}
                <div className="mt-4">
                  <flowbiteReact.Label>Product Description</flowbiteReact.Label>
                  <flowbiteReact.Textarea
                    id="description"
                    name="description"
                    placeholder="Enter product description"
                    value={productData?.description || ""}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                
                {/* Warranty Period */}
                <div className="mt-4">
                  <flowbiteReact.Label>Warranty Period</flowbiteReact.Label>
                  <flowbiteReact.TextInput
                    id="warranty_period"
                    name="warranty_period"
                    placeholder="Enter warranty period (e.g., 1 year, 6 months)"
                    value={productData?.warranty_period || ""}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        warranty_period: e.target.value,
                      })
                    }
                  />
                </div>
                
                {/* Warranty Description */}
                <div className="mt-4">
                  <flowbiteReact.Label>Warranty Description</flowbiteReact.Label>
                  <flowbiteReact.Textarea
                    id="warranty_description"
                    name="warranty_description"
                    placeholder="Enter warranty terms and conditions"
                    value={productData?.warranty_description || ""}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        warranty_description: e.target.value,
                      })
                    }
                  />
                </div>
                {/* Status */}
                {/* <div className="mt-4">
                  <flowbiteReact.Label>Status</flowbiteReact.Label>
                  <div className="relative">
                    <div className="flex items-center space-x-4">
                      <flowbiteReact.Button
                        color={`${
                          productData?.status === "DRAFT" ? "primary" : "gray"
                        }`}
                        onClick={() =>
                          setProductData({ ...productData, status: "DRAFT" })
                        }>
                        Draft
                      </flowbiteReact.Button>
                      <flowbiteReact.Button
                        color={`${
                          productData?.status === "UNPUBLISHED"
                            ? "yellow"
                            : "gray"
                        }`}
                        onClick={() =>
                          setProductData({
                            ...productData,
                            status: "UNPUBLISHED",
                          })
                        }>
                        Unpublished
                      </flowbiteReact.Button>
                      <flowbiteReact.Button
                        color={`${
                          productData?.status === "PUBLISH" ? "green" : "gray"
                        }`}
                        onClick={() =>
                          setProductData({ ...productData, status: "PUBLISH" })
                        }>
                        Publish
                      </flowbiteReact.Button>
                    </div>
                  </div>
                </div> */}

                {/* <CategoryInput /> */}
              </div>
            )}
          </div>
          <div className="col-span-1">
            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
              <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
              <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
              <div className="rounded-[2rem] overflow-auto w-[272px] h-[572px] bg-white hide-scrollbar">
                <div className="pt-5">
                  <ProductComponent
                    name={productData.name || "Product Name"}
                    price={productData.price || 100.0}
                    color={
                      selectedColors.length > 0
                        ? selectedColors
                        : ["red", "blue", "green", "yellow"]
                    }
                    size={
                      selectedSizes.length > 0
                        ? selectedSizes
                        : ["S", "M", "L", "XL"]
                    }
                    medias={arrangedMedias.map((media) => media.media_url)}
                    description={
                      productData.description ||
                      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla nec purus feugiat, molestie ipsum et, consequat nibh. Ut sit amet lacus ultrices, tincidunt metus in, maximus metus."
                    }
                    warranty_period={productData.warranty_period || "1 Year"}
                    warranty_description={productData.warranty_description || "Standard manufacturer warranty covering defects and malfunctions."}
                    previewMedia={previewMedia}
                  />
                </div>
              </div>
            </div>

            <h5 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
              Selected Medias
            </h5>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {arrangedMedias.map((media) => (
                <div
                  key={media.id}
                  className="relative group cursor-pointer"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setArrangedMedias((prev) =>
                      prev.filter((m) => m.id !== media.id)
                    );
                  }}>
                  <img
                    src={media.media_url}
                    alt="media"
                    className="w-16 h-16 object-cover rounded"
                  />
                  {/* Show the arrangement index on top of the image */}
                  <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 p-1 rounded-full">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {arrangedMedias.indexOf(media) + 1}
                    </p>
                  </div>
                </div>
              ))}

              {selectedMedias
                .filter(
                  (media) => !arrangedMedias.find((m) => m.id === media.id)
                )
                .map((media) => (
                  <div
                    key={media.id}
                    className="relative group cursor-pointer"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedMedias((prev) =>
                        prev.filter((m) => m.id !== media.id)
                      );
                    }}
                    onClick={() => {
                      setArrangedMedias((prev) => [...prev, media]);
                      setPreviewMedia("");
                    }}>
                    <img
                      src={media.media_url}
                      alt="media"
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      {!selectedFolder && (
        <div
          className="flex items-center justify-center"
          style={{ height: "calc(100vh - 4rem)" }}>
          <div className="text-center">
            <img
              alt=""
              src="/images/illustrations/sign-in.svg"
              className="lg:max-w-md"
            />
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Select a folder to start
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductEditor;
