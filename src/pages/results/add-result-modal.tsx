/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Label,
  Modal,
  Select,
  Textarea,
} from "flowbite-react";
import React, { useState } from "react";
import {
  HiPlus
} from "react-icons/hi";
import { useAlertContext } from "../../context/AlertContext";
import { useAuthContext } from "../../context/AuthContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { ResultInsert, useResultContext } from "../../context/ResultContext";

const AddResultModal: React.FC = function () {
  const [isOpen, setOpen] = useState(false);
  const { addResult } = useResultContext();
  const { user } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { categories } = useCategoryContext();
  const [resultData, setResultData] = useState<ResultInsert>({
    category_id: 1,
    result: "",
    status: "PENDING",
    target: "account_balance",
    user_id: user.id,
  });

  const handleAddResult = async () => {
    try {
      await addResult(resultData);
      setOpen(false);
      showAlert("Result added successfully", "success");
      setResultData({
        category_id: 0,
        result: "",
        status: "PENDING",
        target: "account_balance",
        user_id: user.id,
      });
    } catch (error: any) {
      showAlert(error.message, "error");
    }
  };

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-x-3">
          <HiPlus className="text-xl" />
          Add Result
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Add new result</strong>
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
              <Label htmlFor="target">Target</Label>
              <div className="mt-1">
                <Select
                  value={resultData.target}
                  onChange={(e) => setResultData({
                    ...resultData,
                    target: e.target.value as "account_balance" | "baki",
                  })}
                >
                  <option value="account_balance">Account Balance</option>
                  <option value="baki">Baki</option>
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
          <Button color="primary" onClick={handleAddResult}>
            Add result
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddResultModal;