import React, { useEffect } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { Button, Card, Label } from "flowbite-react";
import { useProductFolderContext, ProductFolder, ProductFolderInsert } from "../../context/product/ProductFolderContext";
import { useProductContext, Product } from "../../context/product/ProductContext";
import { useProductFolderMediaContext, ProductFolderMediaInsert } from "../../context/product/ProductFolderMediaContext";
import { useAlertContext } from "../../context/AlertContext";
import { supabase } from "../../utils/supabaseClient";
import ReactDropzone from "react-dropzone";
import ProductEditor from "./product-editor";
import { useParams } from "react-router-dom";

const CreateProductPage: React.FC = () => {
  const { productFolders, createProductFolder } = useProductFolderContext();
  const { products } = useProductContext();
  const { showAlert } = useAlertContext();
  const { createProductFolderMedia } = useProductFolderMediaContext();
  const [selectedFolder, setSelectedFolder] = React.useState<ProductFolder | null>(null);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { folderId, productId } = useParams();

  useEffect(() => {
    if (folderId) {
      setSelectedFolder(productFolders.find((folder) => folder.id === folderId) || null);
    }

    if (productId) {
      setSelectedProduct(products.find((product) => product.id === productId) || null);
    }
  }, [folderId, productFolders, productId, products]);

  // Function to handle changes when files are selected
  const handleUpload = (acceptedFiles: File[], folderName: string) => {
    // Create a new Product Folder
    const newProductFolder: ProductFolderInsert = {
      name: folderName,
      image_count: acceptedFiles.filter((file) => file.type.includes("png") || file.type.includes("jpg") || file.type.includes("jpeg") || file.type.includes("gif")).length,
      video_count: acceptedFiles.filter((file) => file.type.includes("mp4") || file.type.includes("mov") || file.type.includes("avi")).length
    };

    createProductFolder(newProductFolder).then((productFolder) => {
      if (productFolder) {
        acceptedFiles.forEach(async (file) => {
          // Generate Random Unique ID for the media
          const randomId = Math.random().toString(36).substring(2);

          const { data, error } = await supabase
            .storage
            .from("product_medias")
            .upload(`${randomId}`, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error(error);
            showAlert("Failed to upload file", "error");
            return;
          }

          const newProductFolderMedia: ProductFolderMediaInsert = {
            product_folder_id: productFolder.id,
            media_url: "https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/" + data.path,
          };

          createProductFolderMedia(newProductFolderMedia).then(() => {
            showAlert("Files uploaded successfully", "success");
          }).catch((error) => {
            showAlert(error.message, "error");
            console.error(error);
          });
        });
      }
    });
  }

  return (
    <NavbarSidebarLayout>
      <div className="grid grid-cols-1 px-4 pt-6 xl:grid-cols-6 xl:gap-4 h-[100vh] overflow-y-auto hide-scrollbar">
        <div className="col-span-1 border-r border-gray-200 dark:border-gray-700 p-2 h-full overflow-y-auto hide-scrollbar">
          <h5 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Folders</h5>
          <ReactDropzone
            onDrop={(acceptedFiles) => {
              // Get Folder Name using split, could be first or second index, could be /  or \\
              let folderName =
                (acceptedFiles[0] as any).path.split(/[/\\]/)[1] || (acceptedFiles[0] as any).path.split(/\/|\\/)[0];

              handleUpload(acceptedFiles, folderName);
            }}>
            {({ getRootProps, getInputProps }) => (
              <div className="flex w-full items-center justify-center" {...getRootProps()}>
                <Label
                  htmlFor="dropzone-file"
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                >
                  <div className="flex flex-col items-center justify-center pb-6 pt-5">
                    <svg
                      className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
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
            className="mt-4 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer dark:bg-gray-900"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-lg m-0">
                {folder.name}
              </h2>
              {/* Display image count, video count and date created as paragraph */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Photos: {folder.image_count} <br/> Videos: {folder.video_count} <br/> Created: {folder.created_at.split("T")[0]}
              </p>
            </Card>
          ))}
        </div>
        <div className="col-span-4">
          <ProductEditor selectedFolder={selectedFolder} setSelectedFolder={setSelectedFolder} setSelectedProduct={setSelectedProduct} selectedProduct={selectedProduct} />
        </div>
        <div className="col-span-1 border-l border-gray-200 dark:border-gray-700 p-2 h-full overflow-y-auto hide-scrollbar">
          <Button className="btn btn-primary w-full mb-4" onClick={() => { setSelectedProduct(null); }}>New Product</Button>
          <h5 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Products</h5>        
          {products.filter((product) => product.product_folder_id === selectedFolder?.id).map((product) => (
            <Card key={product.id} onClick={() => setSelectedProduct(product)} className="mt-4 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                  {product.name}
                </h2>
              </div>
              {/* Display image, video, audio and date created as paragraph */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created: {product.created_at.split("T")[0]} {product.created_at.split("T")[1].split(".")[0]}
              </p>
            </Card>
          ))}

        </div>
      </div>
    </NavbarSidebarLayout>
  );
}

export default CreateProductPage;