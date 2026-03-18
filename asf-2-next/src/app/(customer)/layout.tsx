"use client";
import { SlimLandingContextBundle } from "@/context/RouteContextBundles";
import { NavigationLoader } from "@/components/NavigationLoader";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SlimLandingContextBundle>
      <NavigationLoader>{children}</NavigationLoader>
    </SlimLandingContextBundle>
  );
}
