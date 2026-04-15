"use client";

import type { ReactNode } from "react";
import { TicketProvider } from "@/context/TicketContext";

/**
 * Scope TicketProvider to support-chat only so `useTicketContext` works here
 * without adding ticket realtime subscriptions to the whole customer layout.
 */
export default function SupportChatLayout({ children }: { children: ReactNode }) {
  return <TicketProvider>{children}</TicketProvider>;
}
