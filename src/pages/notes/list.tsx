/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Breadcrumb,
  Label,
  Table,
  TextInput,
  Button,
  Badge
} from "flowbite-react";
import type { FC } from "react";
import React from "react";
import {
  HiHome
} from "react-icons/hi";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useNoteContext, Notes } from "../../context/NoteContext";
import { FaRegCheckCircle } from "react-icons/fa";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useUserContext } from "../../context/UserContext";
import { useCategoryContext } from "../../context/CategoryContext";
import ViewMediaModal from "./view-media-modal";

const NoteListPage: FC = function () {
  const { notes, loading } = useNoteContext();
  const { users } = useUserContext();
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
              <Breadcrumb.Item>All Note</Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              All Notes
            </h1>
          </div>
          <div className="sm:flex">
            <div className="mb-3 hidden items-center dark:divide-gray-700 sm:mb-0 sm:flex sm:divide-x sm:divide-gray-100">
              <form className="lg:pr-3">
                <Label htmlFor="notes-search" className="sr-only">
                  Search
                </Label>
                <div className="relative mt-1 lg:w-64 xl:w-96">
                  <TextInput
                    id="notes-search"
                    name="notes-search"
                    placeholder="Search for Notes"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              {notes.length > 0 ? (
                <NotesTable notes={notes.filter((note) => users.find((user) => user.id === note.user_id)?.email.includes(searchValue))} />

              ) : (
                <div className="p-4 text-center">No notes found</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

const NotesTable: React.FC<Notes> = function ({ notes }) {
  const { users } = useUserContext();
  const { categories } = useCategoryContext();
  const { approveNote, rejectNote } = useNoteContext();

  return (
    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
      <Table.Head className="bg-gray-100 dark:bg-gray-700">
        <Table.HeadCell>Customer</Table.HeadCell>
        <Table.HeadCell>Method</Table.HeadCell>
        <Table.HeadCell>Amount</Table.HeadCell>
        <Table.HeadCell>Target</Table.HeadCell>
        <Table.HeadCell>Category</Table.HeadCell>
        <Table.HeadCell>Status</Table.HeadCell>
        <Table.HeadCell>Media</Table.HeadCell>
        <Table.HeadCell>Actions</Table.HeadCell>
      </Table.Head>
      <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
        {notes.map((note) => (
          <Table.Row key={note.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <Table.Cell>{users.find((user) => user.id === note.user_id)?.email.split("@")[0]}</Table.Cell>
            <Table.Cell>{note.method}</Table.Cell>
            <Table.Cell>{note.amount}</Table.Cell>
            <Table.Cell>{note.target}</Table.Cell>
            <Table.Cell>{categories.find((category) => category.id === note.category_id)?.name}</Table.Cell>
            <Table.Cell>
              {note.status === "APPROVED" ? (
                <Badge color="green" className="w-fit">Approved</Badge>
              ) : note.status === "PENDING" ? (
                <Badge color="yellow" className="w-fit">Pending</Badge>
              ) : (
                <Badge color="red" className="w-fit">Rejected</Badge>
              )}
            </Table.Cell>
            <Table.Cell><ViewMediaModal mediaURL={note.media_url} /></Table.Cell>
            <Table.Cell>
              <div className="flex items-center gap-x-3 whitespace-nowrap">
                {note.status === "PENDING" && (
                  <>
                    <Button
                      color="success"
                      onClick={() => approveNote(note)}
                      className="flex items-center gap-x-2"
                    >
                      <div className="flex items-center gap-x-3">
                        <FaRegCheckCircle className="text-sm" />
                        Approve
                      </div>
                    </Button>
                    <Button
                      color="failure"
                      onClick={() => rejectNote(note)}
                      className="flex items-center gap-x-2"
                    >
                      <div className="flex items-center gap-x-3">
                        <IoIosCloseCircleOutline className="text-sm" />
                        Reject
                      </div>
                    </Button>
                  </>
                )}
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};


export default NoteListPage;
