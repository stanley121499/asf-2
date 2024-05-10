/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Label,
  Modal,
  Select, Textarea
} from "flowbite-react";
import React, { useState } from "react";
import {
  HiOutlinePencilAlt
} from "react-icons/hi";
import { useAlertContext } from "../../context/AlertContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { Result, useResultContext } from "../../context/ResultContext";

// Defining props type
interface EditResultModalProps {
  result: Result;
}

const EditResultModal: React.FC<EditResultModalProps> = ({ result }) => {
  const [isOpen, setOpen] = useState(false);
  const { updateResult } = useResultContext();
  const { showAlert } = useAlertContext();
  const { categories } = useCategoryContext();
  const [resultData, setResultData] = useState<Result>(result);

  const handleUpdateResult = async () => {
    await updateResult(resultData)
    setOpen(false);
    showAlert("Result updated successfully", "success");
  }

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)} className=''>
        <div className="flex items-center gap-x-2">
          <HiOutlinePencilAlt className="text-xs" />
          Edit Result
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Edit result</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
            <div>
              <Label htmlFor="category">Category</Label>
              <div className="mt-1">
                <Select
                  id="category"
                  name="category"
                  value={resultData.category_id}
                  onChange={(e) => setResultData({ ...resultData, category_id: parseInt(e.target.value) })}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="result">Result</Label>
              <div className="mt-1">
                <Textarea
                  id="result"
                  name="result"
                  placeholder="The result of the test"
                  value={resultData.result}
                  onChange={(e) => setResultData({ ...resultData, result: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={() => handleUpdateResult()}>
            Save all
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditResultModal;