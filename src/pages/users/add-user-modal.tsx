/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Label,
  Modal,
  Select,
  TextInput,
  Datepicker,
} from "flowbite-react";
import React, { useState } from "react";
import { FaUsersCog } from "react-icons/fa";
import { FaPhoneFlip } from "react-icons/fa6";
import {
  HiMail,
  HiPlus,
} from "react-icons/hi";
import { LiaBirthdayCakeSolid } from "react-icons/lia";
import { PiPasswordBold } from "react-icons/pi";
import { useAlertContext } from "../../context/AlertContext";
import { User, useUserContext } from "../../context/UserContext";

const AddUserModal: React.FC = function () {
  const [isOpen, setOpen] = useState(false);
  const { addUser } = useUserContext();
  const { showAlert } = useAlertContext();
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    user_detail: {
      birthday: "",
      role: "customer",
      contact_number: "",
    }
  });

  const handleAddUser = async () => {
    // append @fruitcalculator.com to the email
    userData.email = `${userData.email.split("@")[0]}@fruitcalculator.com`;


    await addUser(userData as User).then(() => {
      setOpen(false);
      showAlert("User added successfully", "success");
    }).catch((error) => {
      showAlert(error.message, "error");
    });
  };

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-x-3">
          <HiPlus className="text-xl" />
          Add User
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Add new user</strong>
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
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Password</Label>
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
              <Label htmlFor="birthday">Birthday</Label>
              <div className="mt-1">
                {/* Date input should show and save in the format of DD-MM-YYYY */}
                <Datepicker
                  id="birthday"
                  name="birthday"
                  icon={LiaBirthdayCakeSolid}
                  value={userData.user_detail.birthday}
                  onSelectedDateChanged={(date) => setUserData({ ...userData, user_detail: { ...userData.user_detail, birthday: date.toLocaleDateString() } })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contact_number">Contact Number</Label>
              <div className="mt-1">
                <TextInput
                  id="contact_number"
                  name="contact_number"
                  placeholder="09123456789"
                  icon={FaPhoneFlip}
                  value={userData.user_detail.contact_number}
                  onChange={(e) => setUserData({ ...userData, user_detail: { ...userData.user_detail, contact_number: e.target.value } })}
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
                  value={userData.user_detail.role}
                  onChange={(e) => setUserData({ ...userData, user_detail: { ...userData.user_detail, role: e.target.value } })}
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
          <Button color="primary" onClick={handleAddUser}>
            Add user
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddUserModal;