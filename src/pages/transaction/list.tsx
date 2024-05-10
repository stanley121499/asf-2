/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Label,
  Table,
  TextInput, Badge
} from "flowbite-react";
import type { FC } from "react";
import React from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useTransactionContext, Transactions } from "../../context/TransactionContext";
import { useUserContext } from "../../context/UserContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { useAuthContext } from "../../context/AuthContext";

const TransactionListPage: FC = function () {
  const { transactions, loading } = useTransactionContext();
  const { users } = useUserContext();
  const [searchValue, setSearchValue] = React.useState("");
  const { user } = useAuthContext();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="mb-1 w-full">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              All Transactions
            </h1>
          </div>
          <div className="sm:flex">
            <div className="mb-3 hidden items-center dark:divide-gray-700 sm:mb-0 sm:flex sm:divide-x sm:divide-gray-100">
              {user.role !== "customer" && (
                <form className="lg:pr-3">
                  <Label htmlFor="transactions-search" className="sr-only">
                    Search
                  </Label>
                  <div className="relative mt-1 lg:w-64 xl:w-96">
                    <TextInput
                      id="transactions-search"
                      name="transactions-search"
                      placeholder="Search for Transactions"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              {transactions.length > 0 ? user.role === "customer" ? (
                <TransactionsTable transactions={transactions.filter((transaction) => transaction.user_id === user.id)} />
              ) : (<TransactionsTable transactions={transactions.filter((transaction) => users.find((user) => user.id === transaction.user_id)?.email.includes(searchValue))} />)
                : (
                  <div className="p-4 text-center">No transactions found</div>
                )}
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

const TransactionsTable: React.FC<Transactions> = function ({ transactions }) {
  const { users } = useUserContext();
  const { categories } = useCategoryContext();

  return (
    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
      <Table.Head className="bg-gray-100 dark:bg-gray-700">
        <Table.HeadCell>Customer</Table.HeadCell>
        <Table.HeadCell>Type</Table.HeadCell>
        <Table.HeadCell>Source</Table.HeadCell>
        <Table.HeadCell>Amount</Table.HeadCell>
        <Table.HeadCell>Target</Table.HeadCell>
        <Table.HeadCell>Category</Table.HeadCell>
      </Table.Head>
      <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
        {transactions.map((transaction) => (
          <Table.Row key={transaction.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <Table.Cell> {users.find((user) => user.id === transaction.user_id)?.email.split("@")[0]}</Table.Cell>
            <Table.Cell>
              {transaction.type === "credit" ? (
                <Badge color="success" className="w-fit">Credit</Badge>
              ) : (
                <Badge color="failure" className="w-fit">Debit</Badge>
              )}
            </Table.Cell>
            <Table.Cell>{transaction.source}</Table.Cell>
            <Table.Cell>{transaction.amount}</Table.Cell>
            <Table.Cell>{transaction.target}</Table.Cell>
            <Table.Cell>{categories.find((category) => category.id === transaction.category_id)?.name}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};


export default TransactionListPage;
