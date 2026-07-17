/**
 * In-memory gate for the home arrival ceremony (仪式感).
 * Resets when the JS process restarts (cold start); not persisted.
 */

let homeCeremonyPlayed = false;

/**
 * Returns whether the home ceremony has already run this session.
 */
export function hasPlayedHomeCeremony(): boolean {
  return homeCeremonyPlayed;
}

/**
 * Marks the home ceremony as played for the remainder of this session.
 */
export function markHomeCeremonyPlayed(): void {
  homeCeremonyPlayed = true;
}
