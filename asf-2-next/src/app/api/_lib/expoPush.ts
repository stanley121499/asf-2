/**
 * Expo Push API sender for the customer app.
 *
 * Server-only module: chunk messages (≤100 per request) and throttle under
 * Expo's 600 notifications/second project limit. Invalid tokens are logged
 * and skipped; a single bad token must not abort the whole batch.
 *
 * Do not import this module into client bundles.
 */

import Expo, { type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";

/** Max messages per Expo HTTP request (SDK constant; typically 100). */
const CHUNK_SIZE = Expo.pushNotificationChunkSizeLimit;

/**
 * Stay under Expo's 600 notifications/second limit with headroom.
 * After each chunk of N messages, wait at least N / RATE_LIMIT_PER_SEC seconds.
 */
const RATE_LIMIT_PER_SEC = 500;

/** Shape accepted by {@link sendExpoPushNotifications}. */
export type ExpoPushPayload = {
  /** Expo push token (`ExponentPushToken[...]`). */
  to: string;
  title: string;
  body: string;
  /** Deep-link / inbox metadata forwarded to the device. */
  data?: Record<string, string | number | boolean | null>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
};

/** Aggregate result of a multi-token send. */
export type SendExpoPushResult = {
  /** Tokens accepted and attempted. */
  attempted: number;
  /** Tickets with status `ok`. */
  ok: number;
  /** Tickets with status `error` (or send failure). */
  errors: number;
  /** Tokens rejected by {@link Expo.isExpoPushToken}. */
  invalidTokens: string[];
};

const expoClient = new Expo();

/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms - Duration to wait
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Builds a typed Expo push message from a payload, or `null` if the token is invalid.
 *
 * @param payload - Title, body, token, and optional data
 * @returns Message ready for the Expo API, or `null` when the token is not an Expo push token
 */
function toExpoMessage(payload: ExpoPushPayload): ExpoPushMessage | null {
  if (!Expo.isExpoPushToken(payload.to)) {
    return null;
  }
  const message: ExpoPushMessage = {
    to: payload.to,
    title: payload.title,
    body: payload.body,
    sound: payload.sound === null ? null : (payload.sound ?? "default"),
    priority: payload.priority ?? "high",
  };
  if (payload.data !== undefined) {
    message.data = payload.data;
  }
  return message;
}

/**
 * Sends Expo push notifications in chunks of ≤100, throttling under 600/s.
 *
 * Invalid `ExponentPushToken[...]` values are logged and omitted. Ticket-level
 * errors (e.g. `DeviceNotRegistered`) are logged without throwing so callers
 * can continue.
 *
 * @param payloads - One message per recipient token
 * @returns Counts of attempted / ok / error tickets and the invalid token list
 */
export async function sendExpoPushNotifications(
  payloads: ExpoPushPayload[]
): Promise<SendExpoPushResult> {
  const result: SendExpoPushResult = {
    attempted: 0,
    ok: 0,
    errors: 0,
    invalidTokens: [],
  };

  if (payloads.length === 0) {
    return result;
  }

  const messages: ExpoPushMessage[] = [];
  for (const payload of payloads) {
    const message = toExpoMessage(payload);
    if (message === null) {
      console.error(
        "expoPush: invalid Expo push token (skipped)",
        payload.to.slice(0, 48)
      );
      result.invalidTokens.push(payload.to);
      continue;
    }
    messages.push(message);
  }

  if (messages.length === 0) {
    return result;
  }

  result.attempted = messages.length;
  const chunks = expoClient.chunkPushNotifications(messages);
  const effectiveChunkSize = CHUNK_SIZE > 0 ? CHUNK_SIZE : 100;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    if (chunk === undefined || chunk.length === 0) {
      continue;
    }

    let tickets: ExpoPushTicket[] = [];
    try {
      tickets = await expoClient.sendPushNotificationsAsync(chunk);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Expo push send error";
      console.error("expoPush: chunk send failed", message);
      result.errors += chunk.length;
      // Still throttle even on failure so retries don't spike the rate limit.
      await throttleAfterChunk(chunk.length, effectiveChunkSize, index, chunks.length);
      continue;
    }

    for (const ticket of tickets) {
      if (ticket.status === "ok") {
        result.ok += 1;
        continue;
      }
      result.errors += 1;
      const detailError =
        ticket.details !== undefined &&
        typeof ticket.details === "object" &&
        "error" in ticket.details
          ? String(ticket.details.error)
          : "unknown";
      console.error("expoPush: ticket error", ticket.message, detailError);
    }

    await throttleAfterChunk(chunk.length, effectiveChunkSize, index, chunks.length);
  }

  return result;
}

/**
 * Waits after a chunk so sustained send rate stays under {@link RATE_LIMIT_PER_SEC}.
 *
 * @param chunkLength - Number of messages in the chunk just sent
 * @param effectiveChunkSize - Max chunk size used for minimum delay floor
 * @param chunkIndex - Zero-based index of the chunk
 * @param totalChunks - Total number of chunks in this send
 */
async function throttleAfterChunk(
  chunkLength: number,
  effectiveChunkSize: number,
  chunkIndex: number,
  totalChunks: number
): Promise<void> {
  if (chunkIndex >= totalChunks - 1) {
    return;
  }
  const minDelayMs = Math.ceil((chunkLength / RATE_LIMIT_PER_SEC) * 1000);
  // Floor: ~200ms between full 100-message chunks (~500/s).
  const floorMs = Math.ceil((effectiveChunkSize / RATE_LIMIT_PER_SEC) * 1000);
  const delayMs = Math.max(minDelayMs, Math.min(floorMs, 250));
  if (delayMs > 0) {
    await sleep(delayMs);
  }
}

/**
 * Convenience: send the same title/body/data to many tokens.
 *
 * @param tokens - Expo push tokens
 * @param content - Shared title, body, and optional data
 * @returns Same aggregate result as {@link sendExpoPushNotifications}
 */
export async function sendExpoPushToTokens(
  tokens: string[],
  content: {
    title: string;
    body: string;
    data?: Record<string, string | number | boolean | null>;
  }
): Promise<SendExpoPushResult> {
  const payloads: ExpoPushPayload[] = tokens.map((token) => ({
    to: token,
    title: content.title,
    body: content.body,
    data: content.data,
  }));
  return sendExpoPushNotifications(payloads);
}

/**
 * Returns whether a string looks like a valid Expo push token.
 *
 * @param token - Candidate token string
 */
export function isValidExpoPushToken(token: string): boolean {
  return Expo.isExpoPushToken(token);
}
