import { NextResponse } from "next/server";

import { requireStaffUser } from "@/app/api/_lib/apiAuth";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { notifyTicketReplied } from "@/app/api/_lib/ticketNotifications";
import { isUuid } from "@/utils/uuid";

type RouteParams = { params: { ticketId: string } };

/**
 * POST /api/tickets/[ticketId]/notify-replied
 *
 * Staff helper: inserts `ticket_replied` via service role after a staff
 * message on a support conversation. Skips when the authenticated user is
 * the ticket owner (customer self-reply).
 *
 * Request body: none (empty POST).
 *
 * Response: `{ ok: true, skipped?: boolean }`
 */
export async function POST(
  _request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const ticketId = context.params.ticketId;
  if (typeof ticketId !== "string" || isUuid(ticketId) === false) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Invalid ticket id" },
      { status: 404 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id, user_id")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError !== null) {
    console.error("notify-replied: ticket query", ticketError.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not load ticket" },
      { status: 500 }
    );
  }

  if (ticket === null) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Ticket not found" },
      { status: 404 }
    );
  }

  if (typeof ticket.user_id !== "string" || ticket.user_id.length === 0) {
    return NextResponse.json(
      { error: "INTERNAL", message: "Ticket has no customer user id" },
      { status: 500 }
    );
  }

  // Customer messaging their own ticket should not trigger ticket_replied
  if (ticket.user_id === auth.user.id) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await notifyTicketReplied(supabase, {
    userId: ticket.user_id,
    ticketId: ticket.id,
  });

  return NextResponse.json({ ok: true, skipped: false });
}
