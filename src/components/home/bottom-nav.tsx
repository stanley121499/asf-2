import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaShoppingCart, FaUser, FaTrophy } from "react-icons/fa";
import { GoGoal } from "react-icons/go";

/**
 * Props for a single bottom-nav icon button.
 */
interface TooltipButtonProps {
  /** Accessible tooltip / label text. */
  tooltipText: string;
  children: React.ReactNode;
  /** Route the button navigates to. */
  to: string;
  rounded?: boolean;
  /** Whether this tab is currently active. */
  isActive?: boolean;
}

/**
 * Individual tab button in the bottom navigation bar.
 * Renders a Link with an optional active indicator dot below the icon.
 */
const TooltipButton: React.FC<TooltipButtonProps> = ({
  tooltipText,
  children,
  to,
  rounded = false,
  isActive = false,
}) => (
  <Link
    to={to}
    aria-label={tooltipText}
    className={`relative inline-flex flex-col items-center justify-center px-5 ${
      rounded ? "rounded-full" : ""
    } hover:bg-gray-50 dark:hover:bg-gray-800 group`}
  >
    {/* Icon wrapper — larger touch target via padding */}
    <span className="flex flex-col items-center justify-center py-1">
      {children}
      {/* Active indicator dot */}
      {isActive && (
        <span className="mt-0.5 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
      )}
    </span>
  </Link>
);

/**
 * Fixed bottom navigation bar for the customer-facing (landing) pages.
 *
 * Mobile / WebView considerations:
 * - Uses `env(safe-area-inset-bottom)` to avoid overlapping the iOS home
 *   indicator bar or Android gesture navigation zone.
 * - Highlights the active tab based on the current route so users always
 *   have a visual anchor when navigating the app.
 * - The bar itself adds bottom padding equal to the safe area so content
 *   on the pages behind it is never fully hidden.
 */
const BottomNavbar: React.FC = () => {
  const { pathname } = useLocation();

  /**
   * Returns true when the current path matches the given prefix.
   * The root "/" only matches exactly to avoid false positives.
   */
  const isActive = (prefix: string): boolean =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix);

  /**
   * Returns the appropriate Tailwind colour classes for an icon
   * based on whether its tab is currently active.
   */
  const iconClass = (prefix: string): string =>
    isActive(prefix)
      ? "w-5 h-5 text-blue-600 dark:text-blue-400"
      : "w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500";

  return (
    <div
      className="fixed z-50 w-full max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full left-1/2 dark:bg-gray-700 dark:border-gray-600 shadow-lg"
      style={{
        // Sit 1rem above the safe-area bottom inset so the bar never
        // overlaps the iOS home indicator / Android gesture zone.
        bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        // Height accounts for icon + possible dot indicator
        height: "4rem",
      }}
    >
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto">
        {/* Home */}
        <TooltipButton tooltipText="Home" to="/" rounded isActive={isActive("/")}>
          <FaHome className={iconClass("/")} />
        </TooltipButton>

        {/* Cart */}
        <TooltipButton tooltipText="Cart" to="/cart" isActive={isActive("/cart")}>
          <FaShoppingCart className={iconClass("/cart")} />
        </TooltipButton>

        {/* Highlights — centre large button */}
        <div className="flex items-center justify-center">
          <Link
            to="/highlights"
            aria-label="Highlights"
            className={`inline-flex items-center justify-center w-10 h-10 font-medium rounded-full focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800 transition-colors ${
              isActive("/highlights")
                ? "bg-blue-700 hover:bg-blue-800"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            style={{ transform: "scale(2)" }}
          >
            <FaTrophy className="w-4 h-4 text-white" />
            <span className="sr-only">Highlights</span>
          </Link>
        </div>

        {/* Goal */}
        <TooltipButton tooltipText="Goal" to="/goal" isActive={isActive("/goal")}>
          <GoGoal className={iconClass("/goal")} />
        </TooltipButton>

        {/* Settings / Profile */}
        <TooltipButton
          tooltipText="Settings"
          to="/settings"
          rounded
          isActive={isActive("/settings")}
        >
          <FaUser className={iconClass("/settings")} />
        </TooltipButton>
      </div>
    </div>
  );
};

export default BottomNavbar;
