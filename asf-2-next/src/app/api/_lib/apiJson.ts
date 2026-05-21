import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Parses a JSON request body. Returns a 400 response when the payload is not valid JSON.
 */
export async function parseJsonBody(
  request: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; response: NextResponse }> {
  try {
    const data: unknown = await request.json();
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}

/**
 * Standard 400 payload when Zod validation fails (field-level errors for clients).
 */
export function validationErrorResponse(error: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: "Validation failed",
      issues: error.flatten(),
    },
    { status: 400 },
  );
}
