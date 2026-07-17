import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { warrantyRegistrationActivateBodySchema } from "@/app/api/_lib/apiSchemas";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import {
  activateWarrantyRegistration,
  warrantyErrorBody,
} from "@/app/api/_lib/warrantyRegistrations";

/**
 * POST /api/warranty/registrations/activate
 * Authenticated customer activates a one-time physical card code.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAuthenticatedUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = warrantyRegistrationActivateBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const body = validated.data;
  const supabase = createServiceRoleClient();

  const result = await activateWarrantyRegistration(supabase, {
    userId: auth.user.id,
    code: body.code,
    purchaseDate: body.purchaseDate,
    purchaseStoreId: body.purchaseStoreId,
    customerName: body.customerName,
    customerEmail: body.customerEmail,
    customerPhone: body.customerPhone,
    staffName: body.staffName ?? null,
    receiptUrl: body.receiptUrl ?? null,
  });

  if (result.ok === false) {
    return NextResponse.json(warrantyErrorBody(result), { status: result.httpStatus });
  }

  return NextResponse.json({ registration: result.registration }, { status: 201 });
}
