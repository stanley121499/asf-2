/* eslint-disable jsx-a11y/anchor-is-valid */
import classNames from "classnames";
import { Sidebar, Avatar, Dropdown } from "flowbite-react";
import React, { useEffect, useState } from "react";
import { FaBox, FaUsers } from "react-icons/fa";
import { useSidebarContext } from "../context/SidebarContext";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { BsFillFilePostFill } from "react-icons/bs";
import { GoHomeFill } from "react-icons/go";
import { FaBoxes } from "react-icons/fa";
import { GrAnalytics } from "react-icons/gr";
import { MdOutlineSupportAgent } from "react-icons/md";
import { DarkThemeToggle } from "flowbite-react";
import { FiMessageCircle } from "react-icons/fi";
import { HiX, HiMenu } from "react-icons/hi";

/**
 * Mobile responsive sidebar component that adapts its behavior based on screen size
 * Desktop: Shows collapsed sidebar (preserves original behavior)
 * Mobile: Shows full overlay drawer that slides in from left
 */
const ExampleSidebar: React.FC = function () {
  const { isOpenOnSmallScreens: isSidebarOpenOnSmallScreens, setOpenOnSmallScreens } =
    useSidebarContext();
  const [currentPage, setCurrentPage] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  /**
   * Update current page for active state highlighting
   */
  useEffect(() => {
    const newPage = window.location.pathname;
    setCurrentPage(newPage);
  }, [setCurrentPage]);

  /**
   * Handle screen size detection and responsive behavior
   */
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkScreenSize();

    // Listen for resize events
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  /**
   * Handle sidebar item click on mobile - close sidebar
   */
  const handleMobileItemClick = () => {
    if (isMobile) {
      setOpenOnSmallScreens(false);
    }
  };

  /**
   * Floating Action Button component for mobile
   */
  const FloatingMenuButton: React.FC = () => (
    <button
      type="button"
      onClick={() => setOpenOnSmallScreens(true)}
      className="fixed bottom-6 right-6 z-30 p-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-110 lg:hidden"
      aria-label="Open navigation menu"
    >
      <HiMenu className="w-6 h-6" />
    </button>
  );

  /**
   * Sidebar content component - shared between mobile and desktop
   */
  const SidebarContent: React.FC<{ onItemClick?: () => void }> = ({ onItemClick }) => (
    <>
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <Sidebar.Item
            href="/dashboard"
            icon={GoHomeFill}
            onClick={onItemClick}
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
            onClick={onItemClick}
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
            onClick={onItemClick}
            className={
              "/posts/list" === currentPage
                ? "bg-gray-100 dark:bg-gray-700"
                : ""
            }>
            All Posts
          </Sidebar.Item>

          <Sidebar.Item
            icon={FaBox}
            href="/products/list"
            onClick={onItemClick}
            className={
              "/products/list" === currentPage
                ? "bg-gray-100 dark:bg-gray-700"
                : ""
            }>
            Products
          </Sidebar.Item>

          <Sidebar.Item
            icon={FaBoxes}
            href="/stocks/overview"
            onClick={onItemClick}
            className={
              "/stocks/overview" === currentPage
                ? "bg-gray-100 dark:bg-gray-700"
                : ""
            }>
            Stocks
          </Sidebar.Item>

          <Sidebar.Item
            icon={MdOutlineSupportAgent}
            href="/support"
            onClick={onItemClick}
            className={
              "/support" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
            }>
            Support
          </Sidebar.Item>

          <Sidebar.Item
            icon={FiMessageCircle}
            href="/internal-chat"
            onClick={onItemClick}
            className={
              "/internal-chat" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
            }>
            Internal Chat
          </Sidebar.Item>

          <Sidebar.Item
            icon={GrAnalytics}
            href="/analytics/users"
            onClick={onItemClick}
            className={
              "/analytics/users" === currentPage
                ? "bg-gray-100 dark:bg-gray-700"
                : ""
            }>
            Analytics
          </Sidebar.Item>

          <DarkThemeToggle />
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </>
  );

  /**
   * Mobile user section component for mobile sidebar
   */
  const MobileUserSection: React.FC = () => {
    const { signOut, user } = useAuthContext();
    const navigate = useNavigate();
    const username = user.email.split("@")[0];

    const handleNavigation = (path: string) => {
      navigate(path);
      setOpenOnSmallScreens(false);
    };

    return (
      <div className="border-t dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar
            alt=""
            img="../images/users/neil-sims.png"
            rounded
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
              {username}
            </p>
            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>
        
        <div className="space-y-1">
          <button
            onClick={() => handleNavigation("/users/settings")}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Settings
          </button>
          <button
            onClick={() => {
              signOut();
              setOpenOnSmallScreens(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  };

  // Mobile view: Full overlay drawer + floating button
  if (isMobile) {
    return (
      <>
        {/* Floating menu button */}
        {!isSidebarOpenOnSmallScreens && <FloatingMenuButton />}

        {/* Backdrop overlay */}
        {isSidebarOpenOnSmallScreens && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setOpenOnSmallScreens(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile sidebar drawer */}
        <div
          className={classNames(
            "fixed top-0 left-0 z-50 h-full w-72 transform bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
            {
              "translate-x-0": isSidebarOpenOnSmallScreens,
              "-translate-x-full": !isSidebarOpenOnSmallScreens,
            }
          )}
        >
          {/* Mobile sidebar header with close button */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Navigation
            </h2>
            <button
              type="button"
              className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={() => setOpenOnSmallScreens(false)}
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile sidebar content */}
          <div className="flex-1 overflow-y-auto">
            <Sidebar
              aria-label="Mobile sidebar"
              className="pt-0 border-none"
            >
              <SidebarContent onItemClick={handleMobileItemClick} />
            </Sidebar>
          </div>

          {/* Mobile user section */}
          <MobileUserSection />
        </div>
      </>
    );
  }

  // Desktop view: Collapsed sidebar (preserves original behavior)
  return (
    <div
      className={classNames("lg:!block", {
        hidden: !isSidebarOpenOnSmallScreens,
      })}
    >
      <Sidebar
        aria-label="Sidebar with multi-level dropdown example"
        collapsed={true}
        className="pt-0"
      >
        <SidebarContent />
      </Sidebar>
    </div>
  );
};

export default ExampleSidebar;
