import React, { ReactNode } from "react";
import NavbarHome from "../components/navbar-home";

/**
 * Layout component for landing pages
 * Ensures proper spacing after the navbar and consistent layout structure
 */
interface LandingLayoutProps {
  children: ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed navbar */}
      <header className="sticky top-0 z-50">
        <NavbarHome />
      </header>
      
      {/* Main content with appropriate spacing */}
      <main className="flex-grow pt-16">
        {children}
      </main>
    </div>
  );
};

export default LandingLayout; 