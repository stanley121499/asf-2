/**
 * Dev-only JS heap breadcrumbs for Metro while testing on device.
 *
 * Tries Hermes instrumented stats first, then `performance.memory` when present.
 * Native process RSS is not available from JS — use `adb shell dumpsys meminfo`.
 *
 * Elapsed ms share the same origin as boot logs via {@link resetMemoryClock}
 * (invoked from {@link resetBootClock}).
 *
 * Intentionally does NOT import `@/lib/bootLog` — that module imports this one
 * for milestone `[mem]` lines. A reverse import made `getBootElapsedMs` undefined
 * at module-eval time (`TypeError: undefined is not a function`).
 */

/** Epoch ms aligned with the boot / reload clock. */
let memoryOriginMs: number = Date.now();

/** Interval between automatic samples after boot. */
const SAMPLE_INTERVAL_MS = 5000;

/** Hard stop for the post-boot sampling window. */
const SAMPLE_WINDOW_MS = 30000;

/** Max automatic samples (6 × 5s ≈ 30s). */
const MAX_SAMPLES = 6;

/** Active interval id while sampling, or null when idle. */
let sampleIntervalId: ReturnType<typeof setInterval> | null = null;

/** Absolute timeout that ends sampling after {@link SAMPLE_WINDOW_MS}. */
let sampleWindowTimeoutId: ReturnType<typeof setTimeout> | null = null;

/** How many interval samples have been emitted in the current window. */
let sampleCount = 0;

/**
 * Aligns the `[mem]` elapsed clock with a new boot / Metro reload cycle.
 * Called from {@link resetBootClock}.
 */
export function resetMemoryClock(): void {
  memoryOriginMs = Date.now();
}

/**
 * Narrow unknown values to plain objects for safe property reads.
 *
 * @param value - Candidate value
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Converts a byte count to a one-decimal megabyte string.
 *
 * @param bytes - Heap size in bytes
 */
function bytesToMbLabel(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Reads the first finite numeric field from a stats object.
 *
 * @param stats - Hermes (or similar) stats bag
 * @param keys - Preferred field names in order
 */
function readFiniteNumber(
  stats: Record<string, unknown>,
  keys: ReadonlyArray<string>,
): number | null {
  for (const key of keys) {
    const raw = stats[key];
    if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
      return raw;
    }
  }
  return null;
}

/**
 * Attempts Hermes / JSI instrumented heap stats when the runtime exposes them.
 *
 * @returns Human-readable heap fragment, or null if unavailable
 */
function tryHermesHeapLabel(): string | null {
  if (!("HermesInternal" in globalThis)) {
    return null;
  }

  const hermesUnknown: unknown = Reflect.get(globalThis, "HermesInternal");
  if (!isRecord(hermesUnknown)) {
    return null;
  }

  const getInstrumentedStats = hermesUnknown["getInstrumentedStats"];
  if (typeof getInstrumentedStats !== "function") {
    return null;
  }

  let statsUnknown: unknown;
  try {
    statsUnknown = getInstrumentedStats.call(hermesUnknown);
  } catch {
    return null;
  }

  if (!isRecord(statsUnknown)) {
    return null;
  }

  const heapBytes = readFiniteNumber(statsUnknown, [
    "js_heapSize",
    "heapSize",
    "js_allocatedBytes",
    "allocatedBytes",
  ]);

  if (heapBytes === null) {
    return null;
  }

  return `hermesHeap=${bytesToMbLabel(heapBytes)}`;
}

/**
 * Attempts browser-style `performance.memory` (rarely present in RN, but cheap).
 *
 * @returns Human-readable heap fragment, or null if unavailable
 */
function tryPerformanceMemoryLabel(): string | null {
  if (typeof performance === "undefined") {
    return null;
  }

  if (!("memory" in performance)) {
    return null;
  }

  const memoryUnknown: unknown = Reflect.get(performance, "memory");
  if (!isRecord(memoryUnknown)) {
    return null;
  }

  const used = readFiniteNumber(memoryUnknown, ["usedJSHeapSize"]);
  const limit = readFiniteNumber(memoryUnknown, ["jsHeapSizeLimit"]);

  if (used === null) {
    return null;
  }

  if (limit === null) {
    return `jsHeap=${bytesToMbLabel(used)}`;
  }

  return `jsHeap=${bytesToMbLabel(used)}/${bytesToMbLabel(limit)}`;
}

/**
 * Builds the heap portion of a Metro `[mem]` line.
 *
 * @returns Stats string or `unavailable`
 */
function resolveMemoryLabel(): string {
  const hermes = tryHermesHeapLabel();
  if (hermes !== null) {
    const perf = tryPerformanceMemoryLabel();
    if (perf !== null) {
      return `${hermes} ${perf}`;
    }
    return hermes;
  }

  const perfOnly = tryPerformanceMemoryLabel();
  if (perfOnly !== null) {
    return perfOnly;
  }

  return "unavailable";
}

/**
 * Local boot-relative elapsed ms (no dependency on bootLog helpers).
 *
 * @returns Non-negative elapsed time in ms
 */
function getMemoryElapsedMs(): number {
  try {
    const elapsed = Date.now() - memoryOriginMs;
    if (typeof elapsed !== "number" || !Number.isFinite(elapsed)) {
      return 0;
    }
    return elapsed < 0 ? 0 : elapsed;
  } catch {
    return 0;
  }
}

/**
 * Logs current JS heap (when the runtime exposes it) with boot-relative timing.
 * No-ops outside `__DEV__`.
 *
 * @param reason - Optional milestone / sample label printed after the stats
 */
export function logMemory(reason?: string): void {
  if (!__DEV__) {
    return;
  }

  const elapsedMs = getMemoryElapsedMs();
  const stats = resolveMemoryLabel();
  const suffix =
    reason !== undefined && reason.length > 0 ? ` (${reason})` : "";
  console.log(`[mem +${elapsedMs}ms] ${stats}${suffix}`);
}

/**
 * Clears the post-boot sampling timers if they are running.
 */
function stopDevMemorySampling(): void {
  if (sampleIntervalId !== null) {
    clearInterval(sampleIntervalId);
    sampleIntervalId = null;
  }
  if (sampleWindowTimeoutId !== null) {
    clearTimeout(sampleWindowTimeoutId);
    sampleWindowTimeoutId = null;
  }
}

/**
 * In `__DEV__` only, logs memory every ~5s for the first ~30s after boot
 * (at most 6 samples) so Metro shows heap growth on device.
 * Calling again (e.g. Metro reload) restarts the window from scratch.
 */
export function startDevMemorySampling(): void {
  if (!__DEV__) {
    return;
  }

  /** Fresh window on each Metro reload / `_layout` module eval. */
  stopDevMemorySampling();

  sampleCount = 0;
  logMemory("sample window start");

  sampleIntervalId = setInterval(() => {
    sampleCount += 1;
    logMemory(`sample ${String(sampleCount)}/${String(MAX_SAMPLES)}`);
    if (sampleCount >= MAX_SAMPLES) {
      stopDevMemorySampling();
    }
  }, SAMPLE_INTERVAL_MS);

  sampleWindowTimeoutId = setTimeout(() => {
    stopDevMemorySampling();
  }, SAMPLE_WINDOW_MS);
}
