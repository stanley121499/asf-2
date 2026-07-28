/**
 * In-memory gate for the Shop catalog first-land ceremony (仪式感).
 * Resets when the JS process restarts (cold start); not persisted.
 * Returning from PDP to catalog in the same session should not replay.
 */

let shopCeremonyPlayed = false;

/**
 * Returns whether the Shop first-land ceremony has already run this session.
 */
export function hasPlayedShopCeremony(): boolean {
  return shopCeremonyPlayed;
}

/**
 * Marks the Shop first-land ceremony as played for the remainder of this session.
 */
export function markShopCeremonyPlayed(): void {
  shopCeremonyPlayed = true;
}
