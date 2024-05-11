/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import NavbarSidebarLayout from "../layouts/navbar-sidebar";
import { Button } from "flowbite-react";
const DashboardPage: React.FC = function () {
  return (
    <NavbarSidebarLayout>
      {/* One Column Straight in the center */}
      <div className="flex items-center justify-center" style={{ height: "calc(100vh - 4rem)" }}>
        <div className="text-center">
          {/* Logo */}
          <img
            alt=""
            src="../../images/logo.svg"
            className="mx-auto h-12 sm:h-16"
          />
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl">
            ASF
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            App System Formula
          </p>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            Own App
          </p>
          {/* Buttons with transparent bg, grey outlined, blue when hovered */}
          <Button href="/posts/list" className="btn btn-outline btn-gray mt-4 hover:bg-blue-500 hover:text-white">
            Setting Posts
          </Button>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default DashboardPage;
