import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { notifyTicketCreated } from "@/app/api/_lib/ticketNotifications";
import { isUuid } from "@/utils/uuid";

type RouteParams = { params: { ticketId: string } };

/**
 * POST /api/tickets/[ticketId]/notify-created
 *
 * Thin server helper: inserts `ticket_created` via service role after the
 * customer creates a ticket client-side (RLS blocks browser INSERTs on
 * `notifications`). Caller must own the ticket.
 *
 * Request body: none (empty POST).
 *
 * Response: `{ ok: true }`
 */
export async function POST(
  request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const auth = await requireAuthenticatedUser(request);
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
    console.error("notify-created: ticket query", ticketError.message);
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

  if (ticket.user_id !== auth.user.id) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Ticket does not belong to this account" },
      { status: 403 }
    );
  }

  if (typeof ticket.user_id !== "string" || ticket.user_id.length === 0) {
    return NextResponse.json(
      { error: "INTERNAL", message: "Ticket has no customer user id" },
      { status: 500 }
    );
  }

  await notifyTicketCreated(supabase, {
    userId: ticket.user_id,
    ticketId: ticket.id,
  });

  return NextResponse.json({ ok: true });
}
