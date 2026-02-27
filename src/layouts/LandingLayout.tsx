import React, { ReactNode } from "react";
import NavbarHome from "../components/navbar-home";

/**
 * Layout component for all customer-facing (landing) pages.
 *
 * Mobile / WebView considerations:
 * - The sticky header at the top keeps the brand logo and nav always reachable.
 * - Bottom padding accounts for the fixed BottomNavbar height (~4rem / 64px)
 *   PLUS the device's safe-area-inset-bottom (iOS home indicator, Android
 *   gesture navigation bar). This ensures no content is hidden behind either.
 *   Formula: 4rem (nav height) + 1rem (nav bottom offset) + safe-area-inset
 */
interface LandingLayoutProps {
  children: ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed top navbar */}
      <header className="sticky top-0 z-50">
        <NavbarHome />
      </header>

      {/* Main content — top padding clears the sticky header,
          bottom padding clears the fixed bottom nav + safe area */}
      <main
        className="flex-grow pt-16"
        style={{
          paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default LandingLayout;
