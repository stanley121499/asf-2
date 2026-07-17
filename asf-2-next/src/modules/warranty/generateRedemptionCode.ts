const REDEMPTION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REDEMPTION_CODE_LENGTH = 8;

/**
 * Generates an 8-character uppercase alphanumeric redemption / backup code.
 * Ambiguous characters (I, O, 0, 1) are excluded to reduce staff mistypes.
 *
 * Collision safety: callers must insert with the unique partial index on
 * `warranty_credits.redemption_code` and retry this generator on unique
 * violation (typically a few attempts is enough).
 *
 * @returns Eight-character redemption code (e.g. "K7M2P9QX")
 */
export function generateRedemptionCode(): string {
  const chars: string[] = [];

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(REDEMPTION_CODE_LENGTH);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < REDEMPTION_CODE_LENGTH; i += 1) {
      const byte = bytes[i];
      if (typeof byte !== "number") {
        continue;
      }
      chars.push(REDEMPTION_CODE_ALPHABET[byte % REDEMPTION_CODE_ALPHABET.length] ?? "A");
    }
  } else {
    for (let i = 0; i < REDEMPTION_CODE_LENGTH; i += 1) {
      const index = Math.floor(Math.random() * REDEMPTION_CODE_ALPHABET.length);
      chars.push(REDEMPTION_CODE_ALPHABET[index] ?? "A");
    }
  }

  if (chars.length !== REDEMPTION_CODE_LENGTH) {
    throw new Error("Failed to generate redemption code of expected length");
  }

  return chars.join("");
}
