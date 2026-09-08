import * as Haptics from "expo-haptics";

/**
 * Light tap — buttons, toggles, secondary actions.
 */
export async function hapticLight(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* unsupported on this device / simulator */
  }
}

/**
 * Medium tap — primary CTAs (open maps, call).
 */
export async function hapticMedium(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    /* unsupported */
  }
}

/**
 * Selection tick — gallery page change, picker steps.
 */
export async function hapticSelection(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    /* unsupported */
  }
}

/**
 * Success pulse — e.g. when nearest store is resolved.
 */
export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* unsupported */
  }
}

/**
 * Stronger achievement pulse for discovery-points ceremony.
 * Heavy impact + success notification — stronger than add-to-bag medium.
 */
export async function hapticAchievement(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* unsupported on this device / simulator */
  }
}
