import AsyncStorage from "@react-native-async-storage/async-storage";

import { getApiBaseUrl } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";

/**
 * Content kinds accepted by `POST /api/rewards/content-view`.
 * Note: linked-products route uses `promotion`; API uses `promo`.
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
  /** HTTP status when the request completed; 0 on network failure. */
  httpStatus: number;
};

/** Soft guest prompt AsyncStorage flag — shown at most once per device. */
const GUEST_PROMPT_STORAGE_KEY = "asf_discovery_points_guest_prompt_v1";

/** UUID shape matching server Zod / deep-link validation. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** In-flight shared promises — remounts await the same request instead of skipping. */
const inFlightPromises = new Map<string, Promise<ContentViewAwardResult>>();

/** Completed keys this JS session (server remains source of truth). */
const completedKeys = new Set<string>();

/**
 * Builds a stable debounce key for a content view award attempt.
 */
function awardKey(contentType: ContentViewAwardType, contentId: string): string {
  return `${contentType}:${contentId}`;
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
 */
function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/**
 * Parses a non-negative finite number from an API field.
 */
function parseNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

/**
 * Resolves the API base for failure logs without throwing when misconfigured.
 */
function safeApiBaseForLog(): string {
  try {
    return getApiBaseUrl();
  } catch (err) {
    return err instanceof Error ? err.message : "API base unavailable";
  }
}

/**
 * POSTs `/api/rewards/content-view` with the customer Bearer session.
 *
 * Concurrent callers for the same content share one in-flight promise so a PDP
 * remount still receives `{ awarded: true }` and can show the ceremony.
 * The server unique constraint remains the authority for once-forever awards.
 *
 * Ceremony should run only when `awarded === true && points > 0`.
 *
 * @param options.contentType - product | post | promo
 * @param options.contentId - Content uuid
 */
export async function requestContentViewAward(options: {
  contentType: ContentViewAwardType;
  contentId: string;
}): Promise<ContentViewAwardResult> {
  const contentType = options.contentType;
  const contentId = options.contentId.trim();

  if (!isContentViewAwardUuid(contentId)) {
    return {
      awarded: false,
      points: 0,
      alreadyAwarded: false,
      skippedLocally: true,
      httpStatus: 0,
    };
  }

  const key = awardKey(contentType, contentId);

  if (completedKeys.has(key)) {
    return {
      awarded: false,
      points: 0,
      alreadyAwarded: true,
      skippedLocally: true,
      httpStatus: 0,
    };
  }

  const existing = inFlightPromises.get(key);
  if (existing !== undefined) {
    return existing;
  }

  const promise = executeContentViewAwardRequest(key, contentType, contentId);
  inFlightPromises.set(key, promise);

  try {
    return await promise;
  } finally {
    inFlightPromises.delete(key);
  }
}

/**
 * Performs the network request and parses the award response.
 */
async function executeContentViewAwardRequest(
  key: string,
  contentType: ContentViewAwardType,
  contentId: string
): Promise<ContentViewAwardResult> {
  let response: Response;
  try {
    response = await apiFetch("/api/rewards/content-view", {
      method: "POST",
      body: JSON.stringify({
        contentType,
        contentId,
      }),
    });
  } catch (err) {
    console.warn(
      "[contentViewAward] network error",
      {
        apiBase: safeApiBaseForLog(),
        contentType,
        contentId,
        message: err instanceof Error ? err.message : err,
      }
    );
    return {
      awarded: false,
      points: 0,
      alreadyAwarded: false,
      skippedLocally: false,
      httpStatus: 0,
    };
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    console.warn("[contentViewAward] HTTP", {
      apiBase: safeApiBaseForLog(),
      status: response.status,
      contentType,
      contentId,
      body: typeof json === "object" && json !== null ? json : undefined,
    });
    return {
      awarded: false,
      points: 0,
      alreadyAwarded: false,
      skippedLocally: false,
      httpStatus: response.status,
    };
  }

  const record = asRecord(json);
  const awarded = record?.["awarded"] === true;
  const alreadyAwarded = record?.["alreadyAwarded"] === true;
  const pointsRaw = parseNonNegativeNumber(record?.["points"]);
  const points = pointsRaw ?? 0;
  const balanceRaw = parseNonNegativeNumber(record?.["balance"]);

  completedKeys.add(key);

  const result: ContentViewAwardResult = {
    awarded,
    points,
    alreadyAwarded,
    skippedLocally: false,
    httpStatus: response.status,
  };

  if (balanceRaw !== null) {
    result.balance = balanceRaw;
  }

  if (__DEV__) {
    console.info("[contentViewAward] ok", {
      contentType,
      contentId,
      awarded,
      points,
      alreadyAwarded,
    });
  }

  return result;
}

/**
 * Clears this JS-session award debounce cache (dev / QA re-test helper).
 * Does not delete server `content_view_awards` rows.
 */
export function clearContentViewAwardSessionCache(): void {
  completedKeys.clear();
  inFlightPromises.clear();
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
 * Maps linked-products route `kind` to the award API `contentType`.
 *
 * @param kind - `post` | `promotion` from browse navigation
 */
export function contentViewTypeFromLinkedKind(
  kind: "post" | "promotion"
): ContentViewAwardType {
  return kind === "promotion" ? "promo" : "post";
}
