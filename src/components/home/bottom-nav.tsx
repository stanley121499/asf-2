import React from "react";
import { Link } from "react-router-dom";
import { FaBoxes, FaHome, FaShoppingCart, FaUser } from "react-icons/fa";
import { GoGoal } from "react-icons/go";
import { MdLocalOffer } from "react-icons/md";

interface TooltipButtonProps {
  tooltipText: string;
  children: React.ReactNode;
  to: string; // Add a 'to' prop for navigation
  rounded?: boolean;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({
  tooltipText,
  children,
  to,
  rounded = false,
}) => (
  <Link
    to={to}
    className={`relative inline-flex flex-col items-center justify-center px-5 ${
      rounded ? "rounded-full" : ""
    } hover:bg-gray-50 dark:hover:bg-gray-800 group`}
  >
    <button type="button" className="focus:outline-none">
      {children}
    </button>
    <div
      role="tooltip"
      className="absolute z-10 invisible px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip transition-opacity duration-300 dark:bg-gray-700"
    >
      {tooltipText}
      <div className="tooltip-arrow" data-popper-arrow></div>
    </div>
  </Link>
);

const BottomNavbar: React.FC = () => (
  <div className="fixed z-50 w-full h-16 max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full bottom-4 left-1/2 dark:bg-gray-700 dark:border-gray-600">
    <div className="grid h-full max-w-lg grid-cols-5 mx-auto">
      <TooltipButton tooltipText="Home" to="/" rounded>
        <FaHome className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" />
      </TooltipButton>

      <TooltipButton tooltipText="Cart" to="/cart">
        <FaShoppingCart className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" />
      </TooltipButton>

      <div className="flex items-center justify-center">
        <Link
          to="/product-section"
          className="inline-flex items-center justify-center w-10 h-10 font-medium bg-blue-600 rounded-full hover:bg-blue-700 group focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800"
          style={{ transform: "scale(2)" }}
        >
          <MdLocalOffer className="w-4 h-4 text-white" />
          <span className="sr-only">New item</span>
        </Link>
      </div>

      <TooltipButton tooltipText="Goal" to="/goal">
        <GoGoal className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" />
      </TooltipButton>

      <TooltipButton tooltipText="Setting" to="/settings" rounded>
        <FaUser className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" />
      </TooltipButton>
    </div>
  </div>
);

export default BottomNavbar;
