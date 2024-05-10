/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button, Modal
} from "flowbite-react";
import React, { useState } from "react";
import {
  HiTrash
} from "react-icons/hi";
import { useAlertContext } from "../../context/AlertContext";
import { Result, useResultContext } from "../../context/ResultContext";

// Defining props type
interface DeleteResultModalProps {
  result: Result;
}

const DeleteResultModal: React.FC<DeleteResultModalProps> = ({ result }) => {
  const [isOpen, setOpen] = useState(false);
  const { deleteResult } = useResultContext();
  const { showAlert } = useAlertContext();

  const handleDeleteResult = async () => {
    await deleteResult(result)
    setOpen(false);
    showAlert("Result updated successfully", "success");
  }

  return (
    <>
      <Button color="failure" onClick={() => setOpen(true)} className=''>
        <div className="flex items-center gap-x-2">
          <HiTrash className="text-sm" />
          Delete Result
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Body>
          {/* Confirm Delete Modal */}
          <div className="p-5">
            <div className="text-xl font-bold text-center">Delete Result</div>
            <div className="text-center mt-2">Are you sure you want to delete this result?</div>
            <div className="flex justify-center gap-x-5 mt-5">
              <Button color="failure" onClick={handleDeleteResult}>Yes</Button>
              <Button onClick={() => setOpen(false)}>No</Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DeleteResultModal;