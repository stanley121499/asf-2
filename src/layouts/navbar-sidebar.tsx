import classNames from "classnames";
import type { PropsWithChildren } from "react";
import React from "react";
// import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";
import { SidebarProvider, useSidebarContext } from "../context/SidebarContext";

interface NavbarSidebarLayoutProps {
  isFooter?: boolean;
}

const NavbarSidebarLayout: React.FC<PropsWithChildren<NavbarSidebarLayoutProps>> =
  function ({ children, isFooter = true }) {
    return (
      <SidebarProvider>
        {/* <Navbar /> */}
        <div className="flex items-start pt-0">
          <Sidebar />
          <MainContent isFooter={isFooter}>{children}</MainContent>
        </div>
      </SidebarProvider>
    );
  };

const MainContent: React.FC<PropsWithChildren<NavbarSidebarLayoutProps>> = function ({
  children,
  isFooter,
}) {
  const { isOpenOnSmallScreens: isSidebarOpen } = useSidebarContext();

  return (
    <main
      className={classNames(
        "overflow-y-auto relative w-full h-full bg-gray-50 dark:bg-gray-900",
        isSidebarOpen ? "lg:ml-16" : "lg:ml-16"
      )}
    >
      {children}
    </main>
  );
};

export default NavbarSidebarLayout;
