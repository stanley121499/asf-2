/* eslint-disable jsx-a11y/anchor-is-valid */
import classNames from "classnames";
import { Sidebar } from "flowbite-react";
import React, { useEffect, useState } from "react";
import { FaUsers } from "react-icons/fa";
import {
  HiChartPie,
} from "react-icons/hi";
// import { useAuthContext } from "../context/AuthContext";
import { useSidebarContext } from "../context/SidebarContext";
import isSmallScreen from "../helpers/is-small-screen";
import { BsFillFilePostFill } from "react-icons/bs";
import { GoHomeFill } from "react-icons/go";

const ExampleSidebar: React.FC = function () {
  const { isOpenOnSmallScreens: isSidebarOpenOnSmallScreens } =
    useSidebarContext();
  const [currentPage, setCurrentPage] = useState("");
  // const { user_detail } = useAuthContext();
  const [isPostOpen, setPostOpen] = useState(true);

  useEffect(() => {
    const newPage = window.location.pathname;

    setCurrentPage(newPage);
    setPostOpen(newPage.includes("/posts/"));
  }, [setCurrentPage]);

  return (
    <div
      className={classNames("lg:!block", {
        hidden: !isSidebarOpenOnSmallScreens,
      })}
    >
      <Sidebar
        aria-label="Sidebar with multi-level dropdown example"
        // collapsed={isSidebarOpenOnSmallScreens && !isSmallScreen()}
        collapsed={true}
        className="pt-0"
      >
        <div className="flex h-full flex-col justify-between py-2">
          <div>
            <Sidebar.Items>

              <Sidebar.ItemGroup>

                <Sidebar.Item
                  href="/dashboard"
                  icon={GoHomeFill}
                  className={
                    "/dashboard" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                  }
                >
                  Dashboard
                </Sidebar.Item>

                <Sidebar.Item
                  href="/users/list"
                  icon={FaUsers}
                  className={
                    "/users/list" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                  }
                >
                  Users
                </Sidebar.Item>
                <Sidebar.Item
                  icon={BsFillFilePostFill}
                  href="/posts/list"
                  className={
                    "/posts/list" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                  }
                >
                  All Posts
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
          </div>
        </div>
      </Sidebar>
    </div>
  );
};

export default ExampleSidebar;
