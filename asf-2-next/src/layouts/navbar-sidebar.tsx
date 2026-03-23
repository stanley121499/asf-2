"use client";
import classNames from "classnames";
import type { PropsWithChildren } from "react";
import React, { useEffect } from "react";
import Sidebar from "../components/sidebar";
import { SidebarProvider, useSidebarContext } from "../context/SidebarContext";
import { useAuthContext } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import LoadingPage from "@/app/loading";

interface NavbarSidebarLayoutProps {
  isFooter?: boolean;
}

/** Redirects unauthenticated users to sign-in. Uses AuthContext (localStorage-based). */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(
        `/authentication/sign-in?returnTo=${encodeURIComponent(pathname)}`
      );
    }
  }, [user, loading, router, pathname]);

  if (loading) return <LoadingPage />;
  if (!user) return null;

  return <>{children}</>;
}

const NavbarSidebarLayout: React.FC<PropsWithChildren<NavbarSidebarLayoutProps>> =
  function ({ children, isFooter = true }) {
    return (
      <AuthGuard>
        <SidebarProvider>
          <div className="flex items-start pt-0">
            <Sidebar />
            <MainContent isFooter={isFooter}>{children}</MainContent>
          </div>
        </SidebarProvider>
      </AuthGuard>
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
