/**
 * Very early JS fatal / unhandled-rejection logger for device builds.
 *
 * RootErrorBoundary only catches React render errors. Native OS "error then
 * exit" dialogs are often uncaught JS fatals or module-eval throws that never
 * reach a boundary. This module:
 * 1. Installs a global ErrorUtils handler + unhandledrejection listener
 * 2. Persists the last crash reason to AsyncStorage
 * 3. Lets the next cold start surface that message on the recover screen
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

/** AsyncStorage key for the most recent fatal crash payload. */
export const LAST_CRASH_STORAGE_KEY = "@asf/last_js_crash_v1";

/** Structured crash record shown on the next successful launch. */
export type LastCrashRecord = {
  message: string;
  stack: string | null;
  source: "fatal" | "unhandledrejection" | "render";
  at: string;
};

type ErrorUtilsGlobalHandler = (
  error: Error,
  isFatal: boolean | undefined,
) => void;

type ErrorUtilsShape = {
  getGlobalHandler?: () => ErrorUtilsGlobalHandler;
  setGlobalHandler?: (handler: ErrorUtilsGlobalHandler) => void;
};

let installed = false;

/**
 * Coerces an unknown thrown value into a safe display string.
 *
 * @param value - Thrown error or rejection reason
 */
function formatCrashMessage(value: unknown): string {
  if (value instanceof Error) {
    const msg = value.message.trim();
    return msg.length > 0 ? msg : value.name || "Unknown Error";
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Reads an optional stack string from an Error-like value.
 *
 * @param value - Thrown error or rejection reason
 */
function formatCrashStack(value: unknown): string | null {
  if (value instanceof Error && typeof value.stack === "string") {
    const trimmed = value.stack.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

/**
 * Builds a single grep-friendly Metro line: name + message + first stack frames.
 *
 * @param options - Crash fields to flatten into one string
 */
export function formatFatalForMetro(options: {
  name?: string;
  message: string;
  stack: string | null;
  maxStackLines?: number;
}): string {
  const name =
    typeof options.name === "string" && options.name.trim().length > 0
      ? options.name.trim()
      : "Error";
  const message =
    options.message.trim().length > 0
      ? options.message.trim()
      : "Unexpected application error";
  const maxLines =
    typeof options.maxStackLines === "number" && options.maxStackLines > 0
      ? options.maxStackLines
      : 5;
  const stackPreview =
    options.stack === null
      ? ""
      : options.stack
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .slice(0, maxLines)
          .join(" | ");
  if (stackPreview.length === 0) {
    return `${name}: ${message}`;
  }
  return `${name}: ${message} | ${stackPreview}`;
}

/**
 * Persists the last crash so the next open can show it (even if this process dies).
 *
 * @param record - Crash payload
 */
export async function persistLastCrash(record: LastCrashRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_CRASH_STORAGE_KEY, JSON.stringify(record));
  } catch (err) {
    console.error(
      "[earlyCrashLog] persist failed",
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Loads the last persisted crash, if any.
 */
export async function readLastCrash(): Promise<LastCrashRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_CRASH_STORAGE_KEY);
    if (raw === null || raw.trim().length === 0) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const message = record["message"];
    const stack = record["stack"];
    const source = record["source"];
    const at = record["at"];
    if (typeof message !== "string" || message.trim().length === 0) {
      return null;
    }
    if (source !== "fatal" && source !== "unhandledrejection" && source !== "render") {
      return null;
    }
    if (typeof at !== "string") {
      return null;
    }
    return {
      message: message.trim(),
      stack: typeof stack === "string" && stack.trim().length > 0 ? stack.trim() : null,
      source,
      at,
    };
  } catch {
    return null;
  }
}

/**
 * Clears the persisted crash after the user dismisses / retries.
 */
export async function clearLastCrash(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_CRASH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * True when a rejection is Expo DEV `asyncRoutes` failing to fetch a Metro
 * chunk (`LoadBundleFromServerRequestError`). Common during `expo start -c`,
 * Fast Refresh, or brief LAN blips — not an app module crash.
 *
 * @param reason - `unhandledrejection` reason or thrown value
 */
function isDevAsyncBundleFetchFailure(reason: unknown): boolean {
  if (!__DEV__) {
    return false;
  }
  if (!(reason instanceof Error)) {
    return false;
  }
  const name = reason.name.trim();
  const message = reason.message.trim();
  if (name === "LoadBundleFromServerRequestError") {
    return true;
  }
  if (name === "LoadBundleFromServerError") {
    return true;
  }
  return message.includes("Could not load bundle");
}

/**
 * Installs global handlers once. Call from the root layout before providers mount.
 */
export function installEarlyCrashLog(): void {
  if (installed) {
    return;
  }
  installed = true;

  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsShape }).ErrorUtils;
  const previousHandler =
    typeof errorUtils?.getGlobalHandler === "function"
      ? errorUtils.getGlobalHandler()
      : undefined;

  if (typeof errorUtils?.setGlobalHandler === "function") {
    errorUtils.setGlobalHandler((error, isFatal) => {
      if (isDevAsyncBundleFetchFailure(error)) {
        console.warn(
          "[earlyCrashLog] ignoring DEV Metro async bundle fetch failure",
          formatCrashMessage(error),
        );
        return;
      }

      const message = formatCrashMessage(error);
      const stack = formatCrashStack(error);
      const name = error instanceof Error ? error.name : "Error";
      console.error(
        "[earlyCrashLog] fatal",
        formatFatalForMetro({ name, message, stack }),
      );

      void persistLastCrash({
        message,
        stack,
        source: "fatal",
        at: new Date().toISOString(),
      });

      if (typeof previousHandler === "function") {
        try {
          previousHandler(error, isFatal);
        } catch (handlerErr) {
          console.error(
            "[earlyCrashLog] previous handler threw",
            formatFatalForMetro({
              name: handlerErr instanceof Error ? handlerErr.name : "Error",
              message: formatCrashMessage(handlerErr),
              stack: formatCrashStack(handlerErr),
            }),
          );
        }
      }
    });
  }

  const rejectionTarget = globalThis as {
    addEventListener?: (
      type: string,
      listener: (event: {
        reason?: unknown;
        preventDefault?: () => void;
      }) => void,
    ) => void;
  };

  if (typeof rejectionTarget.addEventListener === "function") {
    rejectionTarget.addEventListener("unhandledrejection", (event) => {
      if (isDevAsyncBundleFetchFailure(event.reason)) {
        if (typeof event.preventDefault === "function") {
          event.preventDefault();
        }
        console.warn(
          "[earlyCrashLog] ignoring DEV Metro async bundle fetch rejection",
          formatCrashMessage(event.reason),
        );
        return;
      }

      const message = formatCrashMessage(event.reason);
      const stack = formatCrashStack(event.reason);
      const name =
        event.reason instanceof Error ? event.reason.name : "UnhandledRejection";
      console.error(
        "[earlyCrashLog] unhandledrejection",
        formatFatalForMetro({ name, message, stack }),
      );
      void persistLastCrash({
        message,
        stack,
        source: "unhandledrejection",
        at: new Date().toISOString(),
      });
    });
  }
}
