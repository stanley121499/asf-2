/* eslint-disable jsx-a11y/anchor-is-valid */
import classNames from "classnames";
import { Sidebar } from "flowbite-react";
import React, { useEffect, useState } from "react";
import { BiSolidCategory } from "react-icons/bi";
import { FaUsers } from "react-icons/fa";
import { FaRegNoteSticky } from "react-icons/fa6";
import { GrTransaction } from "react-icons/gr";
import {
  HiChartPie,
} from "react-icons/hi";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useAuthContext } from "../context/AuthContext";
import { useSidebarContext } from "../context/SidebarContext";
import isSmallScreen from "../helpers/is-small-screen";

const ExampleSidebar: React.FC = function () {
  const { isOpenOnSmallScreens: isSidebarOpenOnSmallScreens } =
    useSidebarContext();
  const [currentPage, setCurrentPage] = useState("");
  const { user_detail } = useAuthContext();

  useEffect(() => {
    const newPage = window.location.pathname;

    setCurrentPage(newPage);
  }, [setCurrentPage]);

  return (
    <div
      className={classNames("lg:!block", {
        hidden: !isSidebarOpenOnSmallScreens,
      })}
    >
      <Sidebar
        aria-label="Sidebar with multi-level dropdown example"
        collapsed={isSidebarOpenOnSmallScreens && !isSmallScreen()}
      >
        <div className="flex h-full flex-col justify-between py-2">
          <div>
            <Sidebar.Items>

              <Sidebar.ItemGroup>

                <Sidebar.Item
                  href="/dashboard"
                  icon={HiChartPie}
                  className={
                    "/dashboard" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                  }
                >
                  Dashboard
                </Sidebar.Item>

                {/* Transactions */}
                <Sidebar.Item
                  href="/transactions"
                  icon={GrTransaction}
                  className={
                    "/transactions" === currentPage
                      ? "bg-gray-100 dark:bg-gray-700"
                      : ""
                  }
                >
                  Transactions
                </Sidebar.Item>

                {/* Note */}
                {(user_detail?.role === "admin" || user_detail?.role === "employee") && (
                  <Sidebar.Item
                    href="/notes"
                    icon={FaRegNoteSticky}
                    className={
                      "/notes" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                    }
                  >
                    Notes
                  </Sidebar.Item>
                )}
                {/* Result */}
                {(user_detail?.role === "admin" || user_detail?.role === "employee") && (
                  <Sidebar.Item
                    href="/results"
                    icon={IoDocumentTextOutline}
                    className={
                      "/results" === currentPage
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }
                  >
                    Results
                  </Sidebar.Item>
                )}

                {/* Users */}
                {(user_detail?.role === "admin" || user_detail?.role === "employee") && (
                  <Sidebar.Item
                    href="/users/list"
                    icon={FaUsers}
                    className={
                      "/users/list" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                    }
                  >
                    Users
                  </Sidebar.Item>
                )}

                {/* Categories */}
                {(user_detail?.role === "admin" || user_detail?.role === "employee") && (
                  <Sidebar.Item
                    href="/categories"
                    icon={BiSolidCategory}
                    className={
                      "/categories" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                    }
                  >
                    Categories
                  </Sidebar.Item>
                )}

              </Sidebar.ItemGroup>
            </Sidebar.Items>
          </div>
        </div>
      </Sidebar>
    </div>
  );
};

export default ExampleSidebar;
