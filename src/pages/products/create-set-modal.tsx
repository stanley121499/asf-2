import { Button, Label, Modal, TextInput, FileInput } from "flowbite-react";
import React, { useState } from "react";
import { useAlertContext } from "../../context/AlertContext";
import { useCategoryContext } from "../../context/product/CategoryContext";
import { useDepartmentContext } from "../../context/product/DepartmentContext";
import { useRangeContext } from "../../context/product/RangeContext";
import { useBrandContext } from "../../context/product/BrandContext";
import { supabase } from "../../utils/supabaseClient";

export type ActiveSet = "categories" | "departments" | "ranges" | "brands";

const AddSetModal: React.FC<{ activeSet: ActiveSet }> = ({ activeSet }) => {
  const [isOpen, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { showAlert } = useAlertContext();
  const { createCategory } = useCategoryContext();
  const { createDepartment } = useDepartmentContext();
  const { createRange } = useRangeContext();
  const { createBrand } = useBrandContext();

  const label = activeSet === "categories" ? "Category" : activeSet === "departments" ? "Department" : activeSet === "ranges" ? "Range" : "Brand";

  const handleCreate = async () => {
    if (name.trim().length === 0) {
      showAlert(`${label} name is required`, "error");
      return;
    }

    let mediaUrl: string | null = null;
    if (file) {
      const randomId = Math.random().toString(36).substring(2);
      const { data, error } = await supabase.storage
        .from("product_medias")
        .upload(`${randomId}`, file, { cacheControl: "3600", upsert: false });
      if (error) {
        console.error(error);
        showAlert("Failed to upload file", "error");
        return;
      }
      mediaUrl = `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/${data.path}`;
    }

    if (activeSet === "categories") {
      await createCategory({ name, media_url: mediaUrl ?? "", active: true });
    } else if (activeSet === "departments") {
      await createDepartment({ name, active: true, ...(mediaUrl ? { media_url: mediaUrl } : {}) });
    } else if (activeSet === "ranges") {
      await createRange({ name, active: true, ...(mediaUrl ? { media_url: mediaUrl } : {}) });
    } else if (activeSet === "brands") {
      await createBrand({ name, active: true, ...(mediaUrl ? { media_url: mediaUrl } : {}) });
    }

    setOpen(false);
    setName("");
    setFile(null);
    showAlert(`${label} created successfully`, "success");
  };

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        Add {label}
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Add new {label}</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
            <div>
              <Label htmlFor="name">Name</Label>
              <div className="mt-1">
                <TextInput id="name" name="name" placeholder={`Enter ${label} name`} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="media">Image</Label>
              <div className="mt-1">
                <FileInput id="media" name="media" accept="image/*" onChange={(e) => { if (e.target.files) { setFile(e.target.files[0]); } }} />
              </div>
              {file && (
                <div className="mt-2">
                  <img src={URL.createObjectURL(file)} alt={`${label} Preview`} className="object-cover rounded-sm w-50 max-h-64 rounded-md" />
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleCreate}>
            Add {label}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddSetModal;
