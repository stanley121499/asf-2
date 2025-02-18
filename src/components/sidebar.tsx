/* eslint-disable jsx-a11y/anchor-is-valid */
import classNames from "classnames";
import { Sidebar } from "flowbite-react";
import React, { useEffect, useState } from "react";
import { FaBox, FaUsers } from "react-icons/fa";
// import { useAuthContext } from "../context/AuthContext";
import { useSidebarContext } from "../context/SidebarContext";
// import isSmallScreen from "../helpers/is-small-screen";
import { BsFillFilePostFill } from "react-icons/bs";
import { GoHomeFill } from "react-icons/go";
import { FaBoxes } from "react-icons/fa";
import { CiMobile3 } from "react-icons/ci";
import { GrAnalytics } from "react-icons/gr";
import { MdOutlineSupportAgent } from "react-icons/md";

const ExampleSidebar: React.FC = function () {
  const { isOpenOnSmallScreens: isSidebarOpenOnSmallScreens } =
    useSidebarContext();
  const [currentPage, setCurrentPage] = useState("");
  // const { user_detail } = useAuthContext();

  useEffect(() => {
    const newPage = window.location.pathname;

    setCurrentPage(newPage);
  }, [setCurrentPage]);

  return (
    <div
      className={classNames("lg:!block", {
        hidden: !isSidebarOpenOnSmallScreens,
      })}>
      <Sidebar
        aria-label="Sidebar with multi-level dropdown example"
        // collapsed={isSidebarOpenOnSmallScreens && !isSmallScreen()}
        collapsed={true}
        className="pt-0">
        {/* <Sidebar.Logo href="#" img="../../images/logo.svg" imgAlt="ASF logo">
          ASF
        </Sidebar.Logo> */}
        <Sidebar.Items>
          <Sidebar.ItemGroup>
            <Sidebar.Item
              href="/dashboard"
              icon={GoHomeFill}
              className={
                "/dashboard" === currentPage
                  ? "bg-gray-100 dark:bg-gray-700"
                  : ""
              }>
              Dashboard
            </Sidebar.Item>

            <Sidebar.Item
              href="/users/list"
              icon={FaUsers}
              className={
                "/users/list" === currentPage
                  ? "bg-gray-100 dark:bg-gray-700"
                  : ""
              }>
              Users
            </Sidebar.Item>
            <Sidebar.Item
              icon={BsFillFilePostFill}
              href="/posts/list"
              className={
                "/posts/list" === currentPage
                  ? "bg-gray-100 dark:bg-gray-700"
                  : ""
              }>
              All Posts
            </Sidebar.Item>

            {/* Product */}
            <Sidebar.Item
              icon={FaBox}
              href="/products/list"
              className={
                "/products/list" === currentPage
                  ? "bg-gray-100 dark:bg-gray-700"
                  : ""
              }>
              Products
            </Sidebar.Item>

            {/* Stock */}
            <Sidebar.Item
              icon={FaBoxes}
              href="/stocks/overview"
              className={
                "/stocks/overview" === currentPage
                  ? "bg-gray-100 dark:bg-gray-700"
                  : ""
              }>
              Stocks
            </Sidebar.Item>

            {/* Home Page Builder */}
            <Sidebar.Item
              icon={CiMobile3}
              href="/home-page-builder"
              className={
                "/home-page-builder" === currentPage
                  ? "bg-gray-100 dark:bg-gray-700"
                  : ""
              }>
              Home Page Builder
            </Sidebar.Item>

            {/* Support */}
            <Sidebar.Item
              icon={MdOutlineSupportAgent}
              href="/support"
              className={
                "/support" === currentPage
                  ? "bg-gray-100 dark:bg-gray-700"
                  : ""
              }>
              Support
            </Sidebar.Item>

            {/* Analytics */}
            <Sidebar.Item
              icon={GrAnalytics}
              href="/analytics/users"
              className={
                "/analytics/users" === currentPage
                  ? "bg-gray-100 dark:bg-gray-700"
                  : ""
              }>
              Analytics
            </Sidebar.Item>

            {/* <Sidebar.Collapse
                  icon={BsFillFilePostFill}
                  label="Posts"
                  open={isPostOpen}
                >
                  <Sidebar.Item
                    href="/posts/list"
                    className={
                      "/posts/list" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                    }
                  >
                    All Posts
                  </Sidebar.Item>

                  <Sidebar.Item
                    href="/posts/schedule"
                    className={
                      "/posts/schedule" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                    }
                  >
                    Schedule
                  </Sidebar.Item>
                </Sidebar.Collapse> */}
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>
    </div>
  );
};

export default ExampleSidebar;
