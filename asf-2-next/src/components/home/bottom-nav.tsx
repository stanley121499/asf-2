"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { HiOutlineHome, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineUser, HiOutlineFilm } from "react-icons/hi";

const BottomNavbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (prefix: string): boolean => {
    if (prefix === "/") return pathname === "/";
    return pathname.startsWith(prefix);
  };

  const activeColor = "text-[var(--color-accent)]";
  const inactiveColor = "text-[var(--color-muted)]";

  const getStyle = (prefix: string) => (isActive(prefix) ? activeColor : inactiveColor);

  const navItems = [
    { href: "/", icon: HiOutlineHome, label: "首页" },
    { href: "/product-section", icon: HiOutlineShoppingBag, label: "购物" },
    { href: "/highlights", icon: HiOutlineFilm, label: "精选" },
    { href: "/wishlist", icon: HiOutlineHeart, label: "收藏" },
    { href: "/settings", icon: HiOutlineUser, label: "我的" },
  ];

  return (
    <div
      className="fixed bottom-0 z-50 w-full max-w-lg -translate-x-1/2 left-1/2 backdrop-blur-md bg-white/80 border-t border-[var(--color-border)]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="grid h-[64px] max-w-lg grid-cols-5 mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => (
          <button
            key={href}
            type="button"
            onClick={() => router.push(href)}
            className="inline-flex flex-col items-center justify-center min-h-[56px] min-w-[56px] group w-full"
          >
            <Icon className={`w-5 h-5 mb-1 ${getStyle(href)}`} />
            <span className={`text-[10px] ${getStyle(href)}`}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavbar;
