"use client";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// NProgress CSS injected via globals style tag
const NPROGRESS_STYLES = `
  #nprogress { pointer-events: none; }
  #nprogress .bar {
    background: #6366f1;
    position: fixed;
    z-index: 9999;
    top: 0; left: 0;
    width: 100%; height: 3px;
  }
  #nprogress .peg {
    display: block;
    position: absolute;
    right: 0px; width: 100px; height: 100%;
    box-shadow: 0 0 10px #6366f1, 0 0 5px #6366f1;
    opacity: 1;
    transform: rotate(3deg) translate(0px, -4px);
  }
`;

NProgress.configure({ showSpinner: false, speed: 300, minimum: 0.08 });

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept all link clicks to start the progress bar
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http")) return;
      // Same-origin internal navigation
      NProgress.start();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <style dangerouslySetInnerHTML={{ __html: NPROGRESS_STYLES }} />
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
