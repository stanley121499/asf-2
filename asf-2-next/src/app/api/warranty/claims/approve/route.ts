import { NextResponse } from "next/server";

import { requireStaffUser } from "@/app/api/_lib/apiAuth";
import { warrantyClaimApproveBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { approveClaimAndIssueCredits } from "@/app/api/_lib/warrantyCredits";

/**
 * POST /api/warranty/claims/approve — staff approve claim and issue credits.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = warrantyClaimApproveBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const { claimId, items, staffNotes } = validated.data;
  const supabase = createServiceRoleClient();

  const result = await approveClaimAndIssueCredits(supabase, {
    claimId,
    items: items.map((item) => ({
      claimItemId: item.claimItemId,
      approvedPercent: item.approvedPercent,
    })),
    staffUserId: auth.user.id,
    staffNotes: staffNotes ?? null,
  });

  if (result.ok === false) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({ credits: result.credits });
}
