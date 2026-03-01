import React, { useEffect } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { Button, Card, Label } from "flowbite-react";
import {
  useProductFolderContext,
  ProductFolder,
  ProductFolderInsert,
} from "../../context/product/ProductFolderContext";
import {
  useProductContext,
  Product,
} from "../../context/product/ProductContext";
import {
  useProductFolderMediaContext,
  ProductFolderMediaInsert,
} from "../../context/product/ProductFolderMediaContext";
import { useAlertContext } from "../../context/AlertContext";
import { supabase } from "../../utils/supabaseClient";
import ReactDropzone from "react-dropzone";
import ProductEditor from "./product-editor";
import { useParams } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const CreateProductPage: React.FC = () => {
  const { productFolders, createProductFolder } = useProductFolderContext();
  const { products } = useProductContext();
  const { showAlert } = useAlertContext();
  const { createProductFolderMedia } = useProductFolderMediaContext();
  const [selectedFolder, setSelectedFolder] =
    React.useState<ProductFolder | null>(null);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  const { folderId, productId } = useParams();
  const navigate = useNavigate();

  // Track if we've already initialized from URL params to avoid resetting on context refetches
  const initializedRef = React.useRef({ folder: false, product: false });

  useEffect(() => {
    // Only set from URL params if not already initialized
    if (folderId && !initializedRef.current.folder) {
      const folder = productFolders.find((folder) => folder.id === folderId);
      if (folder) {
        setSelectedFolder(folder);
        initializedRef.current.folder = true;
      }
    }

    // Only set from URL params if not already initialized  
    if (productId && !initializedRef.current.product) {
      const product = products.find((product) => product.id === productId);
      if (product) {
        setSelectedProduct(product);
        initializedRef.current.product = true;
      }
    }
  }, [folderId, productFolders, productId, products]);

  // Function to handle changes when files are selected
  const handleUpload = (acceptedFiles: File[], folderName: string) => {
    // Create a new Product Folder
    const newProductFolder: ProductFolderInsert = {
      name: folderName,
      image_count: acceptedFiles.filter(
        (file) =>
          file.type.includes("png") ||
          file.type.includes("jpg") ||
          file.type.includes("jpeg") ||
          file.type.includes("gif")
      ).length,
      video_count: acceptedFiles.filter(
        (file) =>
          file.type.includes("mp4") ||
          file.type.includes("mov") ||
          file.type.includes("avi")
      ).length,
    };

    createProductFolder(newProductFolder).then(async (productFolder) => {
      if (productFolder) {
        await Promise.all(
          acceptedFiles.map(async (file) => {
            // Generate Random Unique ID for the media
            const randomId = Math.random().toString(36).substring(2);

            const { data, error } = await supabase.storage
              .from("product_medias")
              .upload(`${randomId}`, file, {
                cacheControl: "3600",
                upsert: false,
              });

            if (error || !data) {
              console.error(error);
              showAlert("Failed to upload file", "error");
              return;
            }

            const newProductFolderMedia: ProductFolderMediaInsert = {
              product_folder_id: productFolder.id,
              media_url:
                "https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/" +
                data.path,
            };

            try {
              await createProductFolderMedia(newProductFolderMedia);
              showAlert("Files uploaded successfully", "success");
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : "Error";
              showAlert(errorMessage, "error");
              console.error(err);
            }
          })
        );
      }
    });
  };

  return (
    <NavbarSidebarLayout>
      <div className="grid grid-cols-1 px-4 pt-6 xl:grid-cols-6 xl:gap-4 h-[100vh] overflow-y-auto hide-scrollbar">
        <div className="col-span-1 border-r border-gray-200 dark:border-gray-700 p-2 h-full overflow-y-auto hide-scrollbar max-h-[100vh]">
          <h5 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Folders
          </h5>
          <div className="grid grid-cols-1 gap-4 relative">
            {productFolders.length > 6 && (
              <div className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-50">
                <span className="text-white text-lg">
                  <FaChevronDown />
                </span>
              </div>
            )}
            <ReactDropzone
              onDrop={(acceptedFiles) => {
                // Get Folder Name using split, could be first or second index, could be /  or \\
                const rawPath = (acceptedFiles[0] as unknown as { path?: string }).path ?? "";
                let folderName = rawPath.split(/[/\\]/)[1] ?? rawPath.split(/[/\\]/)[0] ?? "New Folder";

                handleUpload(acceptedFiles, folderName);
              }}>
              {({ getRootProps, getInputProps }) => (
                <div
                  style={{ height: `calc((100vh - 10rem) / 6)` }}
                  className="flex w-full items-center justify-center"
                  {...getRootProps()}>
                  <Label
                    htmlFor="dropzone-file"
                    className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        SVG, PNG, JPG or GIF (MAX. 800x400px)
                      </p>
                    </div>
                    <input {...getInputProps({ webkitdirectory: "true" })} />
                  </Label>
                </div>
              )}
            </ReactDropzone>

            {productFolders.map((folder) => (
              <Card
                key={folder.id}
                onClick={() => {
                  setSelectedFolder(folder);
                  setSelectedProduct(null);
                }}
                style={{ height: `calc((100vh - 10rem) / 6)` }}
                className="bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer dark:bg-gray-900">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
                    {folder.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Photos: {folder.image_count} <br /> Videos:{" "}
                    {folder.video_count} <br /> Created:{" "}
                    {folder.created_at.split("T")[0]}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <div className="col-span-4">
          <ProductEditor
            selectedFolder={selectedFolder}
            setSelectedFolder={setSelectedFolder}
            setSelectedProduct={setSelectedProduct}
            selectedProduct={selectedProduct}
          />
        </div>
        <div className="col-span-1 border-l border-gray-200 dark:border-gray-700 p-2 h-full">
          <Button
            className="btn btn-primary w-full mb-4"
            onClick={() => {
              setSelectedProduct(null);
            }}>
            New Product
          </Button>
          <h5 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Products
          </h5>
          <div className="grid grid-cols-1 gap-4 relative max-h-[calc(100vh-9rem)] overflow-y-auto hide-scrollbar">
            {products.length > 6 && (
              <div className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-50">
                <span className="text-white text-lg">
                  <FaChevronDown />
                </span>
              </div>
            )}
            {products
              .filter(
                (product) => product.product_folder_id === selectedFolder?.id
              )
              .map((product) => (
                <Card
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  style={{ height: `calc((100vh - 9rem) / 6)` }}
                  className="bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer dark:bg-gray-900">
                  <div className="flex flex-col items-start justify-center h-full">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created: {product.created_at.split("T")[0]}{" "}
                      {product.created_at.split("T")[1].split(".")[0]}
                    </p>
                    {/* Schedule Button */}
                    <Button
                      className="btn btn-primary mt-2"
                      onClick={() => {
                        navigate(`/products/schedule/${product.id}`);
                      }}>
                      Schedule
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default CreateProductPage;
