/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Label,
  Modal,
  Select,
  TextInput
} from "flowbite-react";
import React, { useState } from "react";
import { FaUsersCog } from "react-icons/fa";
import {
  HiMail,
  HiOutlinePencilAlt
} from "react-icons/hi";
import { PiPasswordBold } from "react-icons/pi";
import { useAlertContext } from "../../context/AlertContext";
import { User, useUserContext } from "../../context/UserContext";

// Defining props type
interface EditUserModalProps {
  user: User;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user }) => {
  const [isOpen, setOpen] = useState(false);
  const { updateUser } = useUserContext();
  const { showAlert } = useAlertContext();
  const [userData, setUserData] = useState<User>(user);

  const handleUpdateUser = async () => {
    await updateUser(userData).then(() => {
      setOpen(false);
      showAlert("User updated successfully", "success");
    }).catch((error) => {
      showAlert(error.message, "error");
    });
  }

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)} className=''>
        <div className="flex items-center gap-x-2">
          <HiOutlinePencilAlt className="text-xs" />
          Edit User
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Edit user</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="mt-1">
                <TextInput
                  id="username"
                  name="username"
                  placeholder="Bonnie"
                  icon={HiMail}
                  value={userData.email.split("@")[0]}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">New Password</Label>
              <div className="mt-1">
                <TextInput
                  id="password"
                  name="password"
                  placeholder="********"
                  icon={PiPasswordBold}
                  type="password"
                  value={userData.password}
                  onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                />
              </div>
            </div>        

            <div>
              <Label htmlFor="role">Role</Label>
              <div className="mt-1">
                <Select
                  id="role"
                  name="role"
                  icon={FaUsersCog}
                  value={userData.user_detail.role as "customer" | "employee" | "admin"}
                  onChange={(e) => setUserData({ ...userData, user_detail: { ...userData.user_detail, role: e.target.value as "customer" | "employee" | "admin" } })}
                >
                  <option value="customer">Customer</option>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={() => handleUpdateUser()}>
            Save all
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditUserModal;