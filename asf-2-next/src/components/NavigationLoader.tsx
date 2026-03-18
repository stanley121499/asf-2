"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import CustomerLoadingPage from "@/components/CustomerLoadingPage";

/**
 * Module-level flag so the history.pushState patch is only applied once,
 * even when React StrictMode mounts this component twice in development.
 * Using a module variable avoids storing properties on the function itself
 * (which causes TypeScript type errors on build).
 */
let pushStatePatched = false;
/** The original pushState reference, stored so we can restore it on unmount. */
let originalPushState: typeof window.history.pushState | null = null;

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
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  /** Mutable refs so event handlers always see the latest values. */
  const pathnameRef = useRef<string>(pathname);
  const isNavigatingRef = useRef<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Show the overlay — idempotent, won't restart the timer if already showing. */
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

  /** When pathname changes, the new page is ready — remove overlay. */
  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      stopLoading();
    }
  }, [pathname]);

  /** Wire up all three navigation entry-points. */
  useEffect(() => {
    // ── 1. Anchor / <Link> click ─────────────────────────────────────────
    const handleClick = (e: MouseEvent): void => {
      const anchor = (e.target as HTMLElement).closest(
        "a[href]"
      ) as HTMLAnchorElement | null;
      if (anchor === null) return;

      if (
        anchor.target === "_blank" ||
        anchor.download !== "" ||
        anchor.href.startsWith("mailto:") ||
        anchor.href.startsWith("tel:") ||
        anchor.href.startsWith("javascript:")
      ) return;

      try {
        const dest = new URL(anchor.href, window.location.href);
        if (dest.origin !== window.location.origin) return;

        const currentPath = window.location.pathname + window.location.search;
        const destPath = dest.pathname + dest.search;
        const isHashJump =
          dest.pathname === window.location.pathname && dest.hash !== "";

        if (destPath !== currentPath && !isHashJump) {
          startLoading();
        }
      } catch {
        // Malformed href — skip
      }
    };

    // ── 2. router.push() / router.replace() ──────────────────────────────
    // Patch history.pushState once at the module level so the flag survives
    // React StrictMode's double-mount in development.
    if (!pushStatePatched) {
      pushStatePatched = true;
      originalPushState = window.history.pushState.bind(window.history);

      window.history.pushState = (
        ...args: Parameters<typeof window.history.pushState>
      ): void => {
        originalPushState?.(...args);
        startLoading();
      };
    }

    // ── 3. Back / Forward / router.back() ────────────────────────────────
    const handlePopState = (): void => startLoading();

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);

    return (): void => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);

      // Restore the original pushState and reset the module flag on unmount
      if (originalPushState !== null) {
        window.history.pushState = originalPushState;
        originalPushState = null;
      }
      pushStatePatched = false;

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
