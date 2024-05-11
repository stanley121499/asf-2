/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import NavbarSidebarLayout from "../layouts/navbar-sidebar";
const DashboardPage: React.FC = function () {
  return (
    <NavbarSidebarLayout>
      <div className="grid grid-cols-1 px-4 pt-6 xl:grid-cols-2 xl:gap-4">
        <div className="col-span-full mb-4 xl:mb-2">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
            Dashboard
          </h1>
        </div>
        <div className="col-span-full xl:col-auto">
        </div>
        <div className="col-span-1">
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default DashboardPage;
