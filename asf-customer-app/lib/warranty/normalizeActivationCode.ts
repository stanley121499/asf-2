/**
 * Normalizes a raw activation code for lookup / storage.
 * Trims whitespace, strips internal spaces and hyphens clustering noise,
 * and uppercases. Empty input yields an empty string.
 *
 * @param raw - User-entered or QR-scanned activation code
 * @returns Uppercase normalized code (e.g. "ASF-7K2M9P")
 */
export function normalizeActivationCode(raw: string): string {
  if (typeof raw !== "string") {
    return "";
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "";
  }

  // Collapse runs of whitespace; keep single hyphens between segments.
  const collapsed = trimmed.replace(/\s+/g, "").toUpperCase();
  return collapsed;
}
