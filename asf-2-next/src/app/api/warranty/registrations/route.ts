import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import {
  listWarrantyRegistrationsForUser,
  warrantyErrorBody,
} from "@/app/api/_lib/warrantyRegistrations";

/**
 * GET /api/warranty/registrations
 * Lists the authenticated customer's physical warranty registrations with tier preview.
 */
export async function GET(): Promise<NextResponse> {
  const auth = await requireAuthenticatedUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const supabase = createServiceRoleClient();
  const result = await listWarrantyRegistrationsForUser(supabase, auth.user.id);

  if (result.ok === false) {
    return NextResponse.json(warrantyErrorBody(result), { status: result.httpStatus });
  }

  return NextResponse.json({ registrations: result.registrations });
}
