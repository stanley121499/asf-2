/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Label,
  Modal, TextInput
} from "flowbite-react";
import React, { useState } from "react";
import {
  HiOutlinePencilAlt
} from "react-icons/hi";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { useAlertContext } from "../../context/AlertContext";
import { Category, useCategoryContext } from "../../context/CategoryContext";

// Defining props type
interface EditCategoryModalProps {
  category: Category;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ category }) => {
  const [isOpen, setOpen] = useState(false);
  const { updateCategory } = useCategoryContext();
  const { showAlert } = useAlertContext();
  const [categoryData, setCategoryData] = useState<Category>(category);

  const handleUpdateCategory = async () => {
    try {
      await updateCategory(categoryData);
      setOpen(false);
      showAlert("Category updated successfully", "success");
    } catch (error) {
      console.error("Error updating category:", error);
      showAlert("Error updating category", "error");
    }
  }

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)} className=''>
        <div className="flex items-center gap-x-2">
          <HiOutlinePencilAlt className="text-xs" />
          Edit Category
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Edit category</strong>
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
          <Button color="primary" onClick={() => handleUpdateCategory()}>
            Save all
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditCategoryModal;