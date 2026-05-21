"use client";

import type { ReactNode } from "react";
import { CommunityContextBundle } from "@/context/RouteContextBundles";

/**
 * Provides TicketContext, ConversationContext, UserContext, and related community
 * providers for support-chat only, without mounting them on the entire customer tree.
 */
export default function SupportChatLayout({ children }: { children: ReactNode }) {
  return <CommunityContextBundle>{children}</CommunityContextBundle>;
}
