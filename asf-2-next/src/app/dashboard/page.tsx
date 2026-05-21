"use client";
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import { Button } from "flowbite-react";

const DashboardPage: React.FC = function () {
  return (
    <NavbarSidebarLayout>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="flex flex-col items-center gap-3 max-w-xs w-full">
          <img
            alt="ASF logo"
            src="/images/logo.svg"
            className="h-10"
          />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Links
          </h2>
          <Button className="homepage-button w-full" href="/posts/list">
            Setting Posts
          </Button>
          <Button className="homepage-button w-full" href="/products/list">
            Setting Products
          </Button>
          <Button className="homepage-button w-full" href="/stocks/overview">
            Setting Stocks
          </Button>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default function WrappedDashboardPage() {
  return <DashboardPage />;
}
