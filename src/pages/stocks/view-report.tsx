import React from "react";
import { useParams } from "react-router-dom";
import { useProductReportContext } from "../../context/product/ProductReportContext";
import LoadingPage from "../pages/loading";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { Button } from "flowbite-react";

const ViewReportPage: React.FC = function () {
  const { reportId } = useParams();
  const { product_reports, loading } = useProductReportContext();
  const report = product_reports.find((r) => r.id === reportId);

  if (loading) {
    return <LoadingPage />;
  }

  if (!report) {
    return (
      <NavbarSidebarLayout>
        <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <h1 className="text-xl text-gray-900 dark:text-white sm:text-2xl">
                  Report Not Found
                </h1>
              </div>
            </div>
          </div>
        </div>
      </NavbarSidebarLayout>
    );
  }

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <h1 className="text-xl text-gray-900 dark:text-white sm:text-2xl">
                Stock Report
              </h1>
              <a
                href="/stocks/overview"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Overview
              </a>
              <a
                href="/stocks/all"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                All Products
              </a>
              {/* Schedule */}
              <a
                href="/stocks/reports"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Reports
              </a>
              {/* Product Events */}
              <a
                href="/stocks/events"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Product Events
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto mt-5">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle gap-4">
            <div className="overflow-auto scrollbar-hide w-full p-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-xl mb-2">
                Report Details
              </h1>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-1 flex flex-col gap-4">
                  <div>
                    <p className="text-md text-gray-900 dark:text-white">
                      <strong>Date & Time:</strong>{" "}
                      {new Date(report.created_at).toLocaleDateString()}{" "}
                      {new Date(report.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-md text-gray-900 dark:text-white">
                      <strong>Company:</strong> {report.company}
                    </p>
                  </div>
                  <div>
                    <p className="text-md text-gray-900 dark:text-white">
                      <strong>Department:</strong> {report.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-md text-gray-900 dark:text-white">
                      <strong>Person In Charge:</strong>{" "}
                      {report.person_in_charge}
                    </p>
                  </div>
                </div>
                <div className="col-span-1 flex flex-col gap-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Own Company Details
                  </h3>
                  <div>
                    <p className="text-md text-gray-900 dark:text-white">
                      <strong>Department:</strong> {report.oc_department}
                    </p>
                  </div>
                  <div>
                    <p className="text-md text-gray-900 dark:text-white">
                      <strong>Name:</strong> {report.oc_name}
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
                Reason
              </h3>

              <p className="text-md text-gray-900 dark:text-white">
                {report.reason}
              </p>

              <div className="flex gap-4">
                <Button
                  color={"primary"}
                  className="mt-4 w-40"
                  onClick={() => {
                    window.print();
                  }}>
                  Print
                </Button>

                <Button
                  color={"red"}
                  className="mt-4 w-40"
                  onClick={() => {
                    window.history.back();
                  }}>
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default ViewReportPage;
