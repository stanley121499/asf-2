/**
 * Whitelisted `{{var}}` names per transactional notification type (plan §7).
 * Used by the templates admin API to reject unknown placeholders on save.
 */

/** Locales staff edit for each transactional template type. */
export const NOTIFICATION_TEMPLATE_LOCALES = ["en", "zh-CN", "ms"] as const;

/** Locale union for template rows. */
export type NotificationTemplateLocale =
  (typeof NOTIFICATION_TEMPLATE_LOCALES)[number];

/**
 * Transactional template types staff may edit (excludes `promotion` campaigns).
 */
export const TRANSACTIONAL_TEMPLATE_TYPES = [
  "order_confirmed",
  "payment_failed",
  "order_fulfillment_error",
  "order_status_changed",
  "claim_created",
  "claim_status_changed",
  "warranty_credit_issued",
  "warranty_registration_activated",
  "warranty_registration_claimed",
  "ticket_created",
  "ticket_replied",
  "wishlist_nearby_stock",
] as const;

/** One of {@link TRANSACTIONAL_TEMPLATE_TYPES}. */
export type TransactionalTemplateType =
  (typeof TRANSACTIONAL_TEMPLATE_TYPES)[number];

/**
 * Allowed `{{var}}` names per type (plan §7 + seed usage).
 * Empty array means no placeholders are allowed.
 */
export const ALLOWED_TEMPLATE_VARS: Readonly<
  Record<TransactionalTemplateType, readonly string[]>
> = {
  order_confirmed: ["order_label", "order_id"],
  payment_failed: ["amount_label"],
  order_fulfillment_error: ["order_label", "order_id"],
  order_status_changed: [
    "order_label",
    "order_id",
    "old_status",
    "new_status",
    "status_label",
  ],
  claim_created: ["claim_label", "claim_id", "status_label"],
  claim_status_changed: ["claim_label", "claim_id", "status_label"],
  warranty_credit_issued: ["amount_rm", "claim_label"],
  warranty_registration_activated: [
    "registration_label",
    "code",
    "amount_rm",
  ],
  warranty_registration_claimed: ["registration_label", "code", "amount_rm"],
  ticket_created: ["ticket_label"],
  ticket_replied: ["ticket_label"],
  wishlist_nearby_stock: ["product_name", "mall_name", "store_name"],
};

/**
 * Sample values for admin preview interpolation.
 */
export const SAMPLE_TEMPLATE_VARS: Readonly<
  Record<TransactionalTemplateType, Readonly<Record<string, string>>>
> = {
  order_confirmed: {
    order_label: "ORD-10042",
    order_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  payment_failed: {
    amount_label: " of RM 129.00",
  },
  order_fulfillment_error: {
    order_label: "ORD-10042",
    order_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  order_status_changed: {
    order_label: "ORD-10042",
    order_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    old_status: "processing",
    new_status: "shipped",
    status_label: "Shipped",
  },
  claim_created: {
    claim_label: "CLM-204",
    claim_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    status_label: "Submitted",
  },
  claim_status_changed: {
    claim_label: "CLM-204",
    claim_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    status_label: "Approved",
  },
  warranty_credit_issued: {
    amount_rm: "85.00",
    claim_label: "CLM-204",
  },
  warranty_registration_activated: {
    registration_label: "WR-9001",
    code: "ACT-7788",
    amount_rm: "50.00",
  },
  warranty_registration_claimed: {
    registration_label: "WR-9001",
    code: "ACT-7788",
    amount_rm: "50.00",
  },
  ticket_created: {
    ticket_label: "TKT-551",
  },
  ticket_replied: {
    ticket_label: "TKT-551",
  },
  wishlist_nearby_stock: {
    product_name: "Classic Leather Oxford",
    mall_name: "Pavilion KL",
    store_name: "ASF Pavilion",
  },
};

/** Human-readable labels for the admin type list. */
export const TEMPLATE_TYPE_LABELS: Readonly<
  Record<TransactionalTemplateType, string>
> = {
  order_confirmed: "Order confirmed",
  payment_failed: "Payment failed",
  order_fulfillment_error: "Order fulfillment error",
  order_status_changed: "Order status changed",
  claim_created: "Claim created",
  claim_status_changed: "Claim status changed",
  warranty_credit_issued: "Warranty credit issued",
  warranty_registration_activated: "Warranty registration activated",
  warranty_registration_claimed: "Warranty registration claimed",
  ticket_created: "Support ticket created",
  ticket_replied: "Support ticket replied",
  wishlist_nearby_stock: "Wishlist nearby stock",
};

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * Safely replaces `{{name}}` placeholders. Unknown vars become empty strings.
 * Never evaluates code — only string substitution. Safe for client preview.
 *
 * @param template - Template text with `{{var}}` placeholders
 * @param vars - Variable map
 * @returns Interpolated string
 */
export function interpolateTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_match, name: string) => {
      const value = vars[name];
      return typeof value === "string" ? value : "";
    }
  );
}

/**
 * Extracts unique `{{var}}` names from template text (order of first appearance).
 *
 * @param text - Title or body template string
 * @returns Distinct placeholder names
 */
export function extractTemplateVarNames(text: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  PLACEHOLDER_RE.lastIndex = 0;
  let match = PLACEHOLDER_RE.exec(text);
  while (match !== null) {
    const name = match[1];
    if (typeof name === "string" && name.length > 0 && seen.has(name) === false) {
      seen.add(name);
      found.push(name);
    }
    match = PLACEHOLDER_RE.exec(text);
  }
  return found;
}

/**
 * Returns whether `type` is a known transactional template type.
 *
 * @param type - Candidate type string
 */
export function isTransactionalTemplateType(
  type: string
): type is TransactionalTemplateType {
  return (TRANSACTIONAL_TEMPLATE_TYPES as readonly string[]).includes(type);
}

/**
 * Validates that every `{{var}}` in the given texts is allowed for `type`.
 *
 * @param type - Transactional notification type
 * @param texts - Title/body strings to scan
 * @returns `null` when valid; otherwise an error describing unknown vars
 */
export function validateTemplateVarsForType(
  type: TransactionalTemplateType,
  texts: readonly string[]
): { ok: true } | { ok: false; unknownVars: string[]; message: string } {
  const allowed = new Set(ALLOWED_TEMPLATE_VARS[type]);
  const unknown = new Set<string>();

  for (const text of texts) {
    for (const name of extractTemplateVarNames(text)) {
      if (allowed.has(name) === false) {
        unknown.add(name);
      }
    }
  }

  if (unknown.size === 0) {
    return { ok: true };
  }

  const unknownVars = Array.from(unknown).sort();
  const allowedList = [...ALLOWED_TEMPLATE_VARS[type]];
  return {
    ok: false,
    unknownVars,
    message: `Unknown template variables for ${type}: ${unknownVars
      .map((v) => `{{${v}}}`)
      .join(", ")}. Allowed: ${
      allowedList.length === 0
        ? "(none)"
        : allowedList.map((v) => `{{${v}}}`).join(", ")
    }`,
  };
}
