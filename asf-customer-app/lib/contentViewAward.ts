import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Content kinds for discovery-view awards (product PDP, post, promo).
 * Note: linked-products route uses `promotion`; award type uses `promo`.
 */
export type ContentViewAwardType = "product" | "post" | "promo";

/** Successful or terminal award result for ceremony / UI decisions. */
export type ContentViewAwardResult = {
  awarded: boolean;
  points: number;
  alreadyAwarded: boolean;
  balance?: number;
  /** True when this client session already requested this content key. */
  skippedLocally: boolean;
  /**
   * HTTP status when a remote request completed; `0` for local-only /
   * network-skip paths.
   */
  httpStatus: number;
  /** True when the award decision came from AsyncStorage (not the API). */
  fromLocal: boolean;
};

/** Soft guest prompt AsyncStorage flag — shown at most once per device. */
const GUEST_PROMPT_STORAGE_KEY = "asf_discovery_points_guest_prompt_v1";

/**
 * Persisted map of already-awarded content keys for this device.
 * Value shape: `{ [userId:contentType:contentId]: true }`.
 *
 * Temporary until `POST /api/rewards/content-view` is reliably deployed.
 */
const LOCAL_AWARDS_STORAGE_KEY = "@asf/content_view_awards";

/** Local discovery points granted on first view (matches server default). */
const LOCAL_AWARD_POINTS = 1;

/** UUID shape matching server Zod / deep-link validation. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** In-flight shared promises — remounts await the same request instead of skipping. */
const inFlightPromises = new Map<string, Promise<ContentViewAwardResult>>();

/** Completed keys this JS session (local store remains source of truth across launches). */
const completedKeys = new Set<string>();

/**
 * Builds a stable debounce / persistence key scoped to the signed-in user.
 *
 * @param userId - Authenticated customer id
 * @param contentType - product | post | promo
 * @param contentId - Content uuid
 */
function awardKey(
  userId: string,
  contentType: ContentViewAwardType,
  contentId: string
): string {
  return `${userId}:${contentType}:${contentId}`;
}

/**
 * Returns true when `value` looks like a UUID suitable for the award API.
 *
 * @param value - Candidate id
 */
export function isContentViewAwardUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/**
 * Narrows unknown JSON into a plain object record.
 *
 * @param value - Parsed JSON value
 */
function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/**
 * Loads the persisted award map from AsyncStorage.
 * Corrupt or missing data yields an empty map.
 */
async function readLocalAwardMap(): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_AWARDS_STORAGE_KEY);
    if (raw === null || raw.length === 0) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    const record = asRecord(parsed);
    if (record === null) {
      return {};
    }
    const map: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(record)) {
      if (value === true) {
        map[key] = true;
      }
    }
    return map;
  } catch (err) {
    console.warn(
      "[contentViewAward] local award map read failed",
      err instanceof Error ? err.message : err
    );
    return {};
  }
}

/**
 * Persists the award map to AsyncStorage.
 *
 * @param map - Key → true for already-awarded content
 */
async function writeLocalAwardMap(map: Record<string, boolean>): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_AWARDS_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn(
      "[contentViewAward] local award map write failed",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Awards discovery points via device-local AsyncStorage (primary path for now).
 *
 * Concurrent callers for the same user+content share one in-flight promise so a
 * PDP remount still receives `{ awarded: true }` and can show the ceremony.
 * Guests must not call this — hosts show a soft sign-in prompt instead.
 *
 * Ceremony should run only when `awarded === true && points > 0`.
 *
 * @param options.contentType - product | post | promo
 * @param options.contentId - Content uuid
 * @param options.userId - Signed-in customer id (required for local scoping)
 */
export async function requestContentViewAward(options: {
  contentType: ContentViewAwardType;
  contentId: string;
  userId: string;
}): Promise<ContentViewAwardResult> {
  const contentType = options.contentType;
  const contentId = options.contentId.trim();
  const userId = options.userId.trim();

  if (!isContentViewAwardUuid(contentId) || userId.length === 0) {
    return {
      awarded: false,
      points: 0,
      alreadyAwarded: false,
      skippedLocally: true,
      httpStatus: 0,
      fromLocal: true,
    };
  }

  const key = awardKey(userId, contentType, contentId);

  if (completedKeys.has(key)) {
    return {
      awarded: false,
      points: 0,
      alreadyAwarded: true,
      skippedLocally: true,
      httpStatus: 0,
      fromLocal: true,
    };
  }

  const existing = inFlightPromises.get(key);
  if (existing !== undefined) {
    return existing;
  }

  const promise = executeLocalContentViewAward(key, contentType, contentId);
  inFlightPromises.set(key, promise);

  try {
    return await promise;
  } finally {
    inFlightPromises.delete(key);
  }
}

/**
 * Reads AsyncStorage, awards once, and marks the session key complete.
 *
 * @param key - User-scoped persistence key
 * @param contentType - Content kind (logging)
 * @param contentId - Content uuid (logging)
 */
async function executeLocalContentViewAward(
  key: string,
  contentType: ContentViewAwardType,
  contentId: string
): Promise<ContentViewAwardResult> {
  const map = await readLocalAwardMap();

  if (map[key] === true) {
    completedKeys.add(key);
    if (__DEV__) {
      console.info("[contentViewAward] local already awarded", {
        contentType,
        contentId,
        key,
      });
    }
    return {
      awarded: false,
      points: 0,
      alreadyAwarded: true,
      skippedLocally: false,
      httpStatus: 0,
      fromLocal: true,
    };
  }

  map[key] = true;
  await writeLocalAwardMap(map);
  completedKeys.add(key);

  if (__DEV__) {
    console.info("[contentViewAward] local award granted", {
      contentType,
      contentId,
      key,
      points: LOCAL_AWARD_POINTS,
    });
  }

  return {
    awarded: true,
    points: LOCAL_AWARD_POINTS,
    alreadyAwarded: false,
    skippedLocally: false,
    httpStatus: 0,
    fromLocal: true,
  };
}

/**
 * Clears this JS-session award debounce cache (dev / QA re-test helper).
 * Does not delete persisted AsyncStorage awards — use
 * {@link clearContentViewAwardLocalStore} for a full reset.
 */
export function clearContentViewAwardSessionCache(): void {
  completedKeys.clear();
  inFlightPromises.clear();
}

/**
 * Clears persisted local awards and the session cache (dev / QA re-test).
 * After this, the next PDP open can grant a ceremony again for each content.
 */
export async function clearContentViewAwardLocalStore(): Promise<void> {
  clearContentViewAwardSessionCache();
  try {
    await AsyncStorage.removeItem(LOCAL_AWARDS_STORAGE_KEY);
  } catch (err) {
    console.warn(
      "[contentViewAward] local award map clear failed",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Returns whether the one-time guest “sign in to earn points” prompt was shown.
 */
export async function hasShownGuestDiscoveryPrompt(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(GUEST_PROMPT_STORAGE_KEY);
    return value === "1";
  } catch (err) {
    console.warn(
      "[contentViewAward] guest prompt read failed",
      err instanceof Error ? err.message : err
    );
    return true;
  }
}

/**
 * Marks the guest discovery prompt as shown (device-local, once).
 */
export async function markGuestDiscoveryPromptShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(GUEST_PROMPT_STORAGE_KEY, "1");
  } catch (err) {
    console.warn(
      "[contentViewAward] guest prompt write failed",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Maps linked-products route `kind` to the award `contentType`.
 *
 * @param kind - `post` | `promotion` from browse navigation
 */
export function contentViewTypeFromLinkedKind(
  kind: "post" | "promotion"
): ContentViewAwardType {
  return kind === "promotion" ? "promo" : "post";
}
