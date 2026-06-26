"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SlimLandingContextBundle } from "@/context/RouteContextBundles";
import { NavigationLoader } from "@/components/NavigationLoader";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";

/**
 * Inner shell rendered inside `SlimLandingContextBundle` so it has access to
 * `useFeatureFlags`. Redirects all customer routes to `/maintenance` when the
 * `maintenance` flag is on. Staff routes (served from the admin Next.js app or
 * NavbarSidebarLayout) are not affected by this layout.
 */
function CustomerShell({ children }: { children: React.ReactNode }) {
  const { isEnabled } = useFeatureFlags();
  const router = useRouter();

  useEffect(() => {
    if (isEnabled("maintenance")) {
      router.replace("/maintenance");
    }
  }, [isEnabled, router]);

  if (isEnabled("maintenance")) return null;

  return <NavigationLoader>{children}</NavigationLoader>;
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SlimLandingContextBundle>
      <CustomerShell>{children}</CustomerShell>
    </SlimLandingContextBundle>
  );
}
