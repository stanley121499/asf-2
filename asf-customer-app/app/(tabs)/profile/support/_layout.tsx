import { Slot } from "expo-router";
import React from "react";

import { ConversationProvider } from "@/context/ConversationContext";
import { TicketProvider } from "@/context/TicketContext";

/**
 * Mounts ticket + conversation providers only for the support flow.
 */
export default function SupportLayout() {
  return (
    <TicketProvider>
      <ConversationProvider>
        <Slot />
      </ConversationProvider>
    </TicketProvider>
  );
}
