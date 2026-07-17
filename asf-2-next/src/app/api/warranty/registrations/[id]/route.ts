import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import {
  getWarrantyRegistrationForUser,
  warrantyErrorBody,
} from "@/app/api/_lib/warrantyRegistrations";
import { isUuid } from "@/utils/uuid";

type RouteParams = { params: { id: string } };

/**
 * GET /api/warranty/registrations/[id]
 * Own registration detail with current tier preview and claim eligibility.
 */
export async function GET(
  _request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const auth = await requireAuthenticatedUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const id = context.params.id;
  if (typeof id !== "string" || isUuid(id) === false) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Invalid registration id" },
      { status: 404 }
    );
  }

  const supabase = createServiceRoleClient();
  const result = await getWarrantyRegistrationForUser(supabase, auth.user.id, id);

  if (result.ok === false) {
    return NextResponse.json(warrantyErrorBody(result), { status: result.httpStatus });
  }

  return NextResponse.json({ registration: result.registration });
}
