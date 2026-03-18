"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import CustomerLoadingPage from "@/components/CustomerLoadingPage";

/**
 * NavigationLoader
 *
 * Renders an instant full-screen loading overlay for EVERY in-app navigation:
 *
 *   1. <Link> / <a> tag clicks          — caught by document click listener
 *   2. router.push() / router.replace() — caught by history.pushState patch
 *   3. router.back() / browser back     — caught by popstate listener
 *
 * The overlay disappears as soon as `usePathname` reflects the new route,
 * meaning the incoming page has finished rendering its initial HTML.
 *
 * A 10-second safety timeout ensures the overlay never gets stuck if something
 * unexpected prevents the pathname from changing (e.g. navigation cancelled).
 */
export function NavigationLoader({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  /** Mutable refs so the event handlers always see the latest values. */
  const pathnameRef = useRef<string>(pathname);
  const isNavigatingRef = useRef<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Show the overlay (idempotent — won't restart the safety timer if already showing). */
  const startLoading = (): void => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsNavigating(true);

    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
      setIsNavigating(false);
    }, 10_000);
  };

  /** Hide the overlay and cancel the safety timer. */
  const stopLoading = (): void => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isNavigatingRef.current = false;
    setIsNavigating(false);
  };

  /**
   * Detect navigation completion: whenever the pathname changes, the new
   * page has rendered and we can remove the overlay.
   */
  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      stopLoading();
    }
  }, [pathname]);

  /**
   * Wire up all three navigation entry-points.
   * The history.pushState patch is marked so it is never applied twice
   * (handles React StrictMode's double-invocation in development).
   */
  useEffect(() => {
    // ── 1. Anchor / Link click ───────────────────────────────────────────
    const handleClick = (e: MouseEvent): void => {
      const anchor = (e.target as HTMLElement).closest(
        "a[href]"
      ) as HTMLAnchorElement | null;
      if (anchor === null) return;

      // Skip external, new-tab, download, or non-http links
      if (
        anchor.target === "_blank" ||
        anchor.download !== "" ||
        anchor.href.startsWith("mailto:") ||
        anchor.href.startsWith("tel:") ||
        anchor.href.startsWith("javascript:")
      ) return;

      try {
        const dest = new URL(anchor.href, globalThis.location.href);
        if (dest.origin !== globalThis.location.origin) return;

        const currentPath =
          globalThis.location.pathname + globalThis.location.search;
        const destPath = dest.pathname + dest.search;

        // Skip hash-only jumps (same path, just an anchor scroll)
        const isHashJump =
          dest.pathname === globalThis.location.pathname &&
          dest.hash !== "";

        if (destPath !== currentPath && !isHashJump) {
          startLoading();
        }
      } catch {
        // Malformed href — skip
      }
    };

    // ── 2. Programmatic navigation (router.push / router.replace) ────────
    const PATCH_KEY = "__nav_loader_patched__" as keyof typeof window.history.pushState;
    const originalPushState = window.history.pushState.bind(window.history);

    if (!(window.history.pushState as Record<string, unknown>)[PATCH_KEY as string]) {
      const patched = (
        ...args: Parameters<typeof window.history.pushState>
      ): void => {
        originalPushState(...args);
        startLoading();
      };
      (patched as Record<string, unknown>)[PATCH_KEY as string] = true;
      window.history.pushState = patched;
    }

    // ── 3. Back / Forward buttons (also catches router.back()) ───────────
    const handlePopState = (): void => startLoading();

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);

    return (): void => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);
      // Restore original pushState on unmount
      window.history.pushState = originalPushState;
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      {children}
      {isNavigating && (
        <div className="fixed inset-0 z-[9999] bg-white">
          <CustomerLoadingPage />
        </div>
      )}
    </>
  );
}
