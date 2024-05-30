/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Label,
  Modal,
  Select,
  TextInput,
  FileInput,
} from "flowbite-react";
import React, { useState } from "react";
import {
  HiMail,
  HiPlus,
} from "react-icons/hi";
import { PiPasswordBold } from "react-icons/pi";
import { useAlertContext } from "../../context/AlertContext";
import { Category, useCategoryContext } from "../../context/product/CategoryContext";
import { supabase } from "../../utils/supabaseClient";

const AddCategoryModal: React.FC = function () {
  const [isOpen, setOpen] = useState(false);
  const { createCategory } = useCategoryContext();
  const { showAlert } = useAlertContext();
  const [categoryData, setCategoryData] = useState({
    name: "",
    media_url: "",
    active: true,
  });

  const [file, setFile] = useState<File | null>(null);

  const handleAddCategory = async () => {
    if (!categoryData.name) {
      showAlert("Category name is required", "error");
      return;
    }

    if (file) {
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

      const media_url = "https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/" + data.path

      await createCategory({ ...categoryData, media_url });
    } else {
      await createCategory(categoryData);
    }

    setOpen(false);
    setCategoryData({
      name: "",
      media_url: "",
      active: true,
    });
    setFile(null);
    showAlert("Category created successfully", "success");
  };

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-x-3">
          <HiPlus className="text-xl" />
          Add Category
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Add new Category</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
            <div>
              <Label htmlFor="name">Name</Label>
              <div className="mt-1">
                <TextInput
                  id="name"
                  name="name"
                  placeholder="Fruits & Vegetables"
                  value={categoryData.name}
                  onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
                />
              </div>
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
                    className="object-cover rounded-sm w-50 max-h-64 rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleAddCategory}>
            Add Category
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddCategoryModal;