"use client";
import { SlimLandingContextBundle } from "@/context/RouteContextBundles";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SlimLandingContextBundle>{children}</SlimLandingContextBundle>;
}
