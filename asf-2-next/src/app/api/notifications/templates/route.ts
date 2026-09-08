import { NextResponse } from "next/server";

import { requireStaffUser } from "@/app/api/_lib/apiAuth";
import { notificationTemplatesUpsertBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import {
  ALLOWED_TEMPLATE_VARS,
  isTransactionalTemplateType,
  NOTIFICATION_TEMPLATE_LOCALES,
  SAMPLE_TEMPLATE_VARS,
  TEMPLATE_TYPE_LABELS,
  TRANSACTIONAL_TEMPLATE_TYPES,
  validateTemplateVarsForType,
} from "@/app/api/_lib/notificationTemplateVars";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import type { Tables, TablesInsert } from "@/database.types";

type TemplateRow = Tables<"notification_templates">;

/**
 * GET /api/notifications/templates
 *
 * Staff-only list of all `notification_templates` rows, plus the var whitelist
 * metadata used by the admin editor.
 */
export async function GET(): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (err) {
    console.error(
      "GET /api/notifications/templates: service role",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Server configuration error" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("notification_templates")
    .select(
      "id, type, locale, title_template, body_template, updated_at, updated_by"
    )
    .order("type", { ascending: true })
    .order("locale", { ascending: true });

  if (error !== null) {
    console.error("GET /api/notifications/templates", error.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not load notification templates" },
      { status: 500 }
    );
  }

  const templates: TemplateRow[] = data ?? [];

  const allowedVars: Record<string, readonly string[]> = {};
  const sampleVars: Record<string, Readonly<Record<string, string>>> = {};
  const typeLabels: Record<string, string> = {};
  for (const type of TRANSACTIONAL_TEMPLATE_TYPES) {
    allowedVars[type] = ALLOWED_TEMPLATE_VARS[type];
    sampleVars[type] = SAMPLE_TEMPLATE_VARS[type];
    typeLabels[type] = TEMPLATE_TYPE_LABELS[type];
  }

  return NextResponse.json({
    templates,
    types: [...TRANSACTIONAL_TEMPLATE_TYPES],
    locales: [...NOTIFICATION_TEMPLATE_LOCALES],
    allowedVars,
    sampleVars,
    typeLabels,
  });
}

/**
 * PUT /api/notifications/templates
 *
 * Staff-only upsert of one transactional `type` × three locales.
 * Rejects templates that use `{{vars}}` outside the type whitelist.
 * Sets `updated_by` to the authenticated staff user id.
 */
export async function PUT(request: Request): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = notificationTemplatesUpsertBodySchema.safeParse(
    parsedBody.data
  );
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const body = validated.data;
  if (!isTransactionalTemplateType(body.type)) {
    return NextResponse.json(
      {
        error: "VALIDATION",
        message: `Unknown or non-editable template type: ${body.type}`,
      },
      { status: 400 }
    );
  }

  const type = body.type;
  const texts: string[] = [];
  for (const locale of NOTIFICATION_TEMPLATE_LOCALES) {
    const fields = body.locales[locale];
    texts.push(fields.title_template, fields.body_template);
  }

  const varCheck = validateTemplateVarsForType(type, texts);
  if (varCheck.ok === false) {
    return NextResponse.json(
      {
        error: "VALIDATION",
        message: varCheck.message,
        unknownVars: varCheck.unknownVars,
      },
      { status: 400 }
    );
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (err) {
    console.error(
      "PUT /api/notifications/templates: service role",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Server configuration error" },
      { status: 500 }
    );
  }

  const nowIso = new Date().toISOString();
  const rows: TablesInsert<"notification_templates">[] =
    NOTIFICATION_TEMPLATE_LOCALES.map((locale) => {
      const fields = body.locales[locale];
      return {
        type,
        locale,
        title_template: fields.title_template,
        body_template: fields.body_template,
        updated_at: nowIso,
        updated_by: auth.user.id,
      };
    });

  const { data, error } = await supabase
    .from("notification_templates")
    .upsert(rows, { onConflict: "type,locale" })
    .select(
      "id, type, locale, title_template, body_template, updated_at, updated_by"
    );

  if (error !== null) {
    console.error("PUT /api/notifications/templates upsert", error.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not save notification templates" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    type,
    templates: data ?? [],
  });
}
