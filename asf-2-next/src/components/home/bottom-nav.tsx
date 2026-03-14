"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaShoppingCart, FaUser, FaTrophy } from "react-icons/fa";
import { GoGoal } from "react-icons/go";

interface TooltipButtonProps {
  tooltipText: string;
  children: React.ReactNode;
  to: string;
  rounded?: boolean;
  isActive?: boolean;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({
  tooltipText,
  children,
  to,
  rounded = false,
  isActive = false,
}) => (
  <Link
    href={to}
    aria-label={tooltipText}
    className={`relative inline-flex flex-col items-center justify-center px-5 ${
      rounded ? "rounded-full" : ""
    } hover:bg-gray-50 dark:hover:bg-gray-800 group`}
  >
    <span className="flex flex-col items-center justify-center py-1">
      {children}
      {isActive && (
        <span className="mt-0.5 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
      )}
    </span>
  </Link>
);

const BottomNavbar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (prefix: string): boolean =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix);

  const iconClass = (prefix: string): string =>
    isActive(prefix)
      ? "w-5 h-5 text-blue-600 dark:text-blue-400"
      : "w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500";

  return (
    <div
      className="fixed z-50 w-full max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full left-1/2 dark:bg-gray-700 dark:border-gray-600 shadow-lg"
      style={{
        bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        height: "4rem",
      }}
    >
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto">
        <TooltipButton tooltipText="首页" to="/" rounded isActive={isActive("/")}>
          <FaHome className={iconClass("/")} />
        </TooltipButton>

        <TooltipButton tooltipText="购物车" to="/cart" isActive={isActive("/cart")}>
          <FaShoppingCart className={iconClass("/cart")} />
        </TooltipButton>

        <div className="flex items-center justify-center">
          <Link
            href="/highlights"
            aria-label="精选推荐"
            className={`inline-flex items-center justify-center w-10 h-10 font-medium rounded-full focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800 transition-colors ${
              isActive("/highlights")
                ? "bg-blue-700 hover:bg-blue-800"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            style={{ transform: "scale(2)" }}
          >
            <FaTrophy className="w-4 h-4 text-white" />
            <span className="sr-only">精选推荐</span>
          </Link>
        </div>

        <TooltipButton tooltipText="目标" to="/goal" isActive={isActive("/goal")}>
          <GoGoal className={iconClass("/goal")} />
        </TooltipButton>

        <TooltipButton tooltipText="设置" to="/settings" rounded isActive={isActive("/settings")}>
          <FaUser className={iconClass("/settings")} />
        </TooltipButton>
      </div>
    </div>
  );
};

export default BottomNavbar;
