import React from "react";
import { Card } from "flowbite-react";
import { useBakiContext } from "../../context/BakiContext";
import { useAccountBalanceContext } from "../../context/AccountBalanceContext";
import { useCategoryContext } from "../../context/CategoryContext";

const BalanceCards: React.FC = function () {
  const { currentUserAccountBalance } = useAccountBalanceContext();
  const { currentUserBaki } = useBakiContext();
  const { categories } = useCategoryContext();

  return (
    <>
      {/* Account Balance */}
      <Card className="mb-4 rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">Account Balance</h5>
        </div>
        <div className="flow-root">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentUserAccountBalance && currentUserAccountBalance.map((accountBalance) => (
              <li key={accountBalance.id} className="py-3 sm:py-4">
                <div className="flex items-center space-x-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{
                      categories.find(category => category.id === accountBalance.category_id)?.name
                    }</p>
                  </div>
                  <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">${accountBalance.balance}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
      {/* Baki */}
      <Card className="mb-4 rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">Baki</h5>
        </div>
        <div className="flow-root">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentUserBaki && currentUserBaki.map((baki) => (
              <li key={baki.id} className="py-3 sm:py-4">
                <div className="flex items-center space-x-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{
                      categories.find(category => category.id === baki.category_id)?.name
                    }</p>
                  </div>
                  <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">${baki.balance}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </>
  );
};

export default BalanceCards;