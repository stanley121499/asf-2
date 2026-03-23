"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import BottomNavbar from "./home/bottom-nav";
import { HiOutlineSearch, HiOutlineShoppingCart, HiOutlineBell } from "react-icons/hi";
import { useAddToCartContext } from "../context/product/CartContext";
import SearchOverlay from "./SearchOverlay";

const NavbarHome: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const cartContext = useAddToCartContext();
  const cartCount = cartContext?.add_to_carts?.length || 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = pathname === "/";
  const isTransparent = isHome && !isScrolled;

  const bgClass = isTransparent
    ? "bg-transparent text-white"
    : "bg-white border-b border-[var(--color-border)] text-[var(--color-text)]";

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-200 ${bgClass}`}>
        <div className="flex h-[56px] w-full items-center justify-between px-4">
          <Link
            href="/"
            className={`font-display shrink-0 ${isTransparent ? "text-white" : "text-[var(--color-text)]"}`}
            style={{ fontSize: "20px", letterSpacing: "0.15em", fontWeight: "600" }}
          >
            SYSTEM APP FORMULA
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <HiOutlineSearch className="h-6 w-6" />
            </button>

            <button
              onClick={() => router.push("/cart")}
              className="relative flex min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <HiOutlineShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => router.push(`/notifications?from=${encodeURIComponent(pathname)}`)}
              className="relative flex min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <HiOutlineBell className="h-6 w-6" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-danger)]"></span>
            </button>
          </div>
        </div>
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <BottomNavbar />
    </>
  );
};

export default NavbarHome;
