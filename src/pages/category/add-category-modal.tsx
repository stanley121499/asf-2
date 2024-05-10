/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Label,
  Modal, TextInput
} from "flowbite-react";
import React, { useState } from "react";
import {
  HiPlus
} from "react-icons/hi";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { useAlertContext } from "../../context/AlertContext";
import { CategoryInsert, useCategoryContext } from "../../context/CategoryContext";

const AddCategoryModal: React.FC = function () {
  const [isOpen, setOpen] = useState(false);
  const { addCategory } = useCategoryContext();
  const { showAlert } = useAlertContext();
  const [categoryData, setCategoryData] = useState<CategoryInsert>({
    name: "",
  });

  const handleAddCategory = async () => {
    try {
      await addCategory(categoryData);
      setOpen(false);
      setCategoryData({ name: "" });
      showAlert("Category added successfully", "success");
    } catch (error) {
      console.error("Error adding category:", error);
      showAlert("Error adding category", "error");
    }
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
          <strong>Add new category</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
            <div>
              <Label htmlFor="name">Name</Label>
              <div className="mt-1">
                <TextInput
                  id="name"
                  name="name"
                  placeholder="Enter category name"
                  icon={MdDriveFileRenameOutline}
                  value={categoryData.name}
                  onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleAddCategory}>
            Add category
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddCategoryModal;