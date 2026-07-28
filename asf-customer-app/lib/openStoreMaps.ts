import { Alert, Linking, Platform } from "react-native";

/**
 * Destination fields used to build Google Maps / Waze deep links.
 */
export interface StoreMapDestination {
  latitude: number | null;
  longitude: number | null;
  /** Free-text fallback when coordinates are missing (mall or address). */
  query: string;
  googleMapsUrl: string | null;
  wazeUrl: string | null;
}

export interface OpenStoreMapsMessages {
  unavailableTitle: string;
  unavailableMessage: string;
}

/**
 * Soft-failure log — use warn so LogBox does not paint a red "Render Error".
 */
function softWarn(scope: string, detail: string): void {
  if (__DEV__) {
    console.warn(`[${scope}] ${detail}`);
  }
}

/**
 * Attempts to open a single URL. Returns true when the OS accepted it.
 * HTTPS candidates are tried even when `canOpenURL` is false (iOS query-scheme quirks).
 */
async function tryOpenUrl(url: string, scope: string): Promise<boolean> {
  const isHttp = url.startsWith("https://") || url.startsWith("http://");

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen && !isHttp) {
      softWarn(scope, `Skipping unhandled scheme: ${url}`);
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to open URL";
    softWarn(scope, `${message} (${url})`);
    return false;
  }
}

/**
 * Tries candidates in order until one opens.
 */
async function openFirstAvailable(
  candidates: readonly string[],
  scope: string,
  messages: OpenStoreMapsMessages,
): Promise<void> {
  const seen = new Set<string>();

  for (const url of candidates) {
    if (url.length === 0 || seen.has(url)) {
      continue;
    }
    seen.add(url);

    const opened = await tryOpenUrl(url, scope);
    if (opened) {
      return;
    }
  }

  softWarn(scope, "No map URL candidate could be opened");
  Alert.alert(messages.unavailableTitle, messages.unavailableMessage);
}

/**
 * Prefer finite lat/lng when both are present.
 */
function resolveCoords(
  latitude: number | null,
  longitude: number | null,
): { lat: number; lng: number } | null {
  if (latitude === null || longitude === null) {
    return null;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { lat: latitude, lng: longitude };
}

/**
 * Trims and rejects empty query strings.
 */
function normalizeQuery(query: string): string | null {
  const trimmed = query.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Rewrites fragile hosts (maps.google.com, waze.com without www) to stable www forms.
 */
function normalizeStoredHttpsUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return url;
    }

    const host = parsed.hostname.toLowerCase();
    if (host === "maps.google.com" || host === "google.com" || host === "www.maps.google.com") {
      const q = parsed.searchParams.get("q");
      if (q !== null && q.length > 0) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
      }
      return url.replace(/^https?:\/\/(www\.)?maps\.google\.com/i, "https://www.google.com/maps");
    }

    if (host === "waze.com") {
      parsed.hostname = "www.waze.com";
      parsed.protocol = "https:";
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Ordered Google Maps / Apple Maps candidates — app schemes first, then HTTPS.
 */
function buildGoogleMapsCandidates(destination: StoreMapDestination): string[] {
  const coords = resolveCoords(destination.latitude, destination.longitude);
  const query = normalizeQuery(destination.query);
  const candidates: string[] = [];

  if (coords !== null) {
    const { lat, lng } = coords;
    const latLng = `${lat},${lng}`;
    const encodedLatLng = encodeURIComponent(latLng);

    if (Platform.OS === "ios") {
      candidates.push(`comgooglemaps://?q=${encodedLatLng}&center=${lat},${lng}`);
      candidates.push(`maps://?ll=${lat},${lng}&q=${encodedLatLng}`);
    } else if (Platform.OS === "android") {
      candidates.push(`geo:${lat},${lng}?q=${encodedLatLng}`);
      candidates.push(`comgooglemaps://?q=${encodedLatLng}&center=${lat},${lng}`);
    }

    candidates.push(`https://www.google.com/maps/search/?api=1&query=${encodedLatLng}`);
    candidates.push(`https://maps.apple.com/?ll=${lat},${lng}&q=${encodedLatLng}`);
  } else if (query !== null) {
    const encoded = encodeURIComponent(query);

    if (Platform.OS === "ios") {
      candidates.push(`comgooglemaps://?q=${encoded}`);
      candidates.push(`maps://?q=${encoded}`);
    } else if (Platform.OS === "android") {
      candidates.push(`geo:0,0?q=${encoded}`);
      candidates.push(`comgooglemaps://?q=${encoded}`);
    }

    candidates.push(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
    candidates.push(`https://maps.apple.com/?q=${encoded}`);
  }

  if (destination.googleMapsUrl !== null && destination.googleMapsUrl.length > 0) {
    candidates.push(normalizeStoredHttpsUrl(destination.googleMapsUrl));
  }

  return candidates;
}

/**
 * Ordered Waze candidates — native scheme first, then www HTTPS with navigate=yes.
 */
function buildWazeCandidates(destination: StoreMapDestination): string[] {
  const coords = resolveCoords(destination.latitude, destination.longitude);
  const query = normalizeQuery(destination.query);
  const candidates: string[] = [];

  if (coords !== null) {
    const { lat, lng } = coords;
    candidates.push(`waze://?ll=${lat},${lng}&navigate=yes`);
    candidates.push(`https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`);
  } else if (query !== null) {
    const encoded = encodeURIComponent(query);
    candidates.push(`waze://?q=${encoded}&navigate=yes`);
    candidates.push(`https://www.waze.com/ul?q=${encoded}&navigate=yes`);
  }

  if (destination.wazeUrl !== null && destination.wazeUrl.length > 0) {
    candidates.push(normalizeStoredHttpsUrl(destination.wazeUrl));
  }

  return candidates;
}

/**
 * True when we have enough data to attempt opening a map destination.
 */
export function canOpenStoreMaps(destination: StoreMapDestination): boolean {
  return buildGoogleMapsCandidates(destination).length > 0;
}

/**
 * True when we have enough data to attempt opening Waze.
 */
export function canOpenWaze(destination: StoreMapDestination): boolean {
  return buildWazeCandidates(destination).length > 0;
}

/**
 * Opens Google Maps (or Apple Maps / browser HTTPS) for a store destination.
 */
export async function openGoogleMapsForStore(
  destination: StoreMapDestination,
  messages: OpenStoreMapsMessages,
): Promise<void> {
  await openFirstAvailable(
    buildGoogleMapsCandidates(destination),
    "openStoreMaps:google",
    messages,
  );
}

/**
 * Opens Waze (app scheme or www HTTPS) for a store destination.
 */
export async function openWazeForStore(
  destination: StoreMapDestination,
  messages: OpenStoreMapsMessages,
): Promise<void> {
  await openFirstAvailable(buildWazeCandidates(destination), "openStoreMaps:waze", messages);
}

/**
 * Opens a tel: link with soft failure (warn + optional alert).
 */
export async function openPhoneUrl(
  phone: string,
  messages: OpenStoreMapsMessages,
): Promise<void> {
  const url = `tel:${phone}`;
  const opened = await tryOpenUrl(url, "openStoreMaps:tel");
  if (!opened) {
    Alert.alert(messages.unavailableTitle, messages.unavailableMessage);
  }
}
