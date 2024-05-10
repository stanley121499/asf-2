/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Breadcrumb,
  Label,
  Table,
  TextInput
} from "flowbite-react";
import type { FC } from "react";
import React from "react";
import {
  HiHome
} from "react-icons/hi";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useResultContext, Results } from "../../context/ResultContext";
import { useUserContext } from "../../context/UserContext";
import { useCategoryContext } from "../../context/CategoryContext";
import AddResultModal from "./add-result-modal";
import EditResultModal from "./edit-result-modal";
import DeleteResultModal from "./delete-result-modal";

const ResultListPage: FC = function () {
  const { results, loading } = useResultContext();
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
              <Breadcrumb.Item>All Result</Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              All Results
            </h1>
          </div>
          <div className="sm:flex">
            <div className="mb-3 hidden items-center dark:divide-gray-700 sm:mb-0 sm:flex sm:divide-x sm:divide-gray-100">
              <form className="lg:pr-3">
                <Label htmlFor="results-search" className="sr-only">
                  Search
                </Label>
                <div className="relative mt-1 lg:w-64 xl:w-96">
                  <TextInput
                    id="results-search"
                    name="results-search"
                    placeholder="Search for Results"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
              <AddResultModal />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              {results.length > 0 ? (
                <ResultsTable results={results.filter((result) => users.find((user) => user.id === result.user_id)?.email.includes(searchValue))} />

              ) : (
                <div className="p-4 text-center">No results found</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

const ResultsTable: React.FC<Results> = function ({ results }) {
  const { categories } = useCategoryContext();

  return (
    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
      <Table.Head className="bg-gray-100 dark:bg-gray-700">
        <Table.HeadCell>Date</Table.HeadCell>
        <Table.HeadCell>Category</Table.HeadCell>
        <Table.HeadCell>Target</Table.HeadCell>
        <Table.HeadCell>Result</Table.HeadCell>
        <Table.HeadCell>Actions</Table.HeadCell>
      </Table.Head>
      <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
        {results.map((result) => (
          <Table.Row key={result.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <Table.Cell>{result.created_at.split("T")[0]}</Table.Cell>
            <Table.Cell>{categories.find((category) => category.id === result.category_id)?.name}</Table.Cell>
            <Table.Cell>{result.target}</Table.Cell>
            <Table.Cell>{result.result}</Table.Cell>           
            <Table.Cell>
              <div className="flex items-center gap-x-3 whitespace-nowrap">
                <EditResultModal result={result} />
                <DeleteResultModal result={result} />
              </div>
            </Table.Cell>            
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};


export default ResultListPage;
