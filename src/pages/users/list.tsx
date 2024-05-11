/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Breadcrumb,
  Label,
  Table,
  TextInput,
  // Button
} from "flowbite-react";
import type { FC } from "react";
import React from "react";
import {
  HiHome,
  // HiTrash
} from "react-icons/hi";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import AddUserModal from "./add-user-modal";
import EditUserModal from "./edit-user-modal";
import LoadingPage from "../pages/loading";
import { useUserContext, Users } from "../../context/UserContext";

const UserListPage: FC = function () {
  const { users, loading } = useUserContext();

  const [searchValue, setSearchValue] = React.useState("");

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="mb-1 w-full">
          <div className="mb-4">
            <Breadcrumb className="mb-4">
              <Breadcrumb.Item href="/dashboard">
                <div className="flex items-center gap-x-3">
                  <HiHome className="text-xl" />
                  <span className="dark:text-white">Home</span>
                </div>
              </Breadcrumb.Item>
              <Breadcrumb.Item>All User</Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              All Users
            </h1>
          </div>
          <div className="sm:flex">
            <div className="mb-3 hidden items-center dark:divide-gray-700 sm:mb-0 sm:flex sm:divide-x sm:divide-gray-100">
              <form className="lg:pr-3">
                <Label htmlFor="users-search" className="sr-only">
                  Search
                </Label>
                <div className="relative mt-1 lg:w-64 xl:w-96">
                  <TextInput
                    id="users-search"
                    name="users-search"
                    placeholder="Search for Users"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
              <AddUserModal />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              {users.length > 0 ? (
                <UsersTable users={users.filter((user) => user.email.toLowerCase().includes(searchValue.toLowerCase()))} />

              ) : (
                <div className="p-4 text-center">No users found</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

const UsersTable: React.FC<Users> = function ({ users }) {
  // const { deleteUser } = useUserContext();

  return (
    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
      <Table.Head className="bg-gray-100 dark:bg-gray-700">
        <Table.HeadCell>Username</Table.HeadCell>
        <Table.HeadCell>Role</Table.HeadCell>
        <Table.HeadCell>Actions</Table.HeadCell>
      </Table.Head>
      <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
        {users.map((user) => (
          <Table.Row key={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <Table.Cell>{user.email}</Table.Cell>
            <Table.Cell>{user.user_detail.role}</Table.Cell>
            <Table.Cell>
              <div className="flex items-center gap-x-3 whitespace-nowrap">
                <EditUserModal user={user} />
                {/* <Button
                  className="text-red-600 dark:text-red-400"
                  onClick={() => deleteUser(user)}
                >
                  <HiTrash />
                </Button> */}

              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};


export default UserListPage;
