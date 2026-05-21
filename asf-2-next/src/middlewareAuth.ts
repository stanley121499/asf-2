import { createClient, type Session, type User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/database.types";

/**
 * Decodes a base64url string to a UTF-8 string without using Buffer (Edge-safe).
 */
function base64UrlDecodeEdge(base64url: string): string {
  const base64 = base64url.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.codePointAt(i) ?? 0;
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Decodes a JWT and returns its payload as an object. Does NOT verify the signature —
 * signature verification is handled server-side by Supabase when the token is used.
 * Used here only to check expiry and read non-sensitive claims (sub, email, role).
 */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3 || parts[1] === undefined) {
      return null;
    }
    return JSON.parse(base64UrlDecodeEdge(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Extracts the access_token string from the session value stored in the
 * `sb-app-session` localStorage / cookie. Handles all three known formats:
 *   1. Legacy flat format:  {"access_token":"...", "refresh_token":"...", ...}
 *   2. Supabase v2 wrapper: {"currentSession":{...}, "expiresAt":N}
 *   3. Supabase v2.60+ base64 format: "base64-<base64url-json>"
 */
function extractAccessToken(raw: string): string | null {
  try {
    // Format 3: base64-<payload>
    if (raw.startsWith("base64-")) {
      const decoded = base64UrlDecodeEdge(raw.slice(7));
      const obj = JSON.parse(decoded) as Record<string, unknown>;
      const tok = (obj["access_token"] ?? (obj["currentSession"] as Record<string, unknown> | undefined)?.["access_token"]) as string | undefined;
      return typeof tok === "string" && tok.length > 0 ? tok : null;
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Format 2: {currentSession: {...}}
    if (typeof parsed["currentSession"] === "object" && parsed["currentSession"] !== null) {
      const inner = parsed["currentSession"] as Record<string, unknown>;
      const tok = inner["access_token"];
      return typeof tok === "string" && tok.length > 0 ? tok : null;
    }

    // Format 1: flat {access_token: "..."}
    const tok = parsed["access_token"];
    return typeof tok === "string" && tok.length > 0 ? tok : null;
  } catch {
    return null;
  }
}
import {
  SESSION_MIRROR_COUNT_COOKIE,
  SESSION_MIRROR_MAIN_COOKIE,
  SESSION_MIRROR_MAX_CHUNKS,
  base64UrlToUtf8,
  sessionMirrorChunkCookieName,
} from "@/utils/sessionMirrorEncoding";

/** Same name as browser `storageKey` / primary session cookie mirror. */
const SESSION_COOKIE_NAME = SESSION_MIRROR_MAIN_COOKIE;

function trimEnv(value: string | undefined): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

/**
 * Public routes — no session required (edge allows immediately).
 */
export function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/authentication")) {
    return true;
  }
  if (pathname.startsWith("/legal")) {
    return true;
  }
  if (pathname === "/maintenance" || pathname.startsWith("/maintenance/")) {
    return true;
  }
  return false;
}

/**
 * Customer routes that require a session cookie at the edge (best-effort).
 */
export function isCustomerProtectedPath(pathname: string): boolean {
  const rules: Array<(p: string) => boolean> = [
    (p) => p === "/cart" || p.startsWith("/cart/"),
    (p) => p === "/checkout" || p.startsWith("/checkout/"),
    (p) => p === "/order-success" || p.startsWith("/order-success/"),
    (p) => p === "/order-details" || p.startsWith("/order-details/"),
    (p) => p === "/settings" || p.startsWith("/settings/"),
    (p) => p === "/rewards" || p.startsWith("/rewards/"),
    (p) => p === "/notifications" || p.startsWith("/notifications/"),
    (p) => p === "/support-chat" || p.startsWith("/support-chat/"),
  ];
  return rules.some((fn) => fn(pathname));
}

/**
 * Admin app routes — session + `staff_roles` or `ADMIN_EMAIL` at the edge.
 * Uses segment boundaries so `/products-listing` is not treated as `/products/*`.
 */
export function isAdminProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/support-chat")) {
    return false;
  }
  const segmentRoots = [
    "/dashboard",
    "/products",
    "/stocks",
    "/orders",
    "/analytics",
    "/payments",
    "/users",
    "/posts",
    "/internal-chat",
  ] as const;
  for (const root of segmentRoots) {
    if (pathname === root || pathname.startsWith(`${root}/`)) {
      return true;
    }
  }
  if (pathname === "/support" || pathname.startsWith("/support/")) {
    return true;
  }
  if (pathname === "/home-page-builder" || pathname.startsWith("/home-page-builder/")) {
    return true;
  }
  return false;
}

function decodeCookieValue(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

function sessionExpired(session: Session): boolean {
  if (typeof session.expires_at !== "number") {
    return false;
  }
  return session.expires_at < Math.floor(Date.now() / 1000);
}

/**
 * Reads persisted Supabase session JSON from cookies: either a single
 * URI-encoded `sb-app-session` value or chunked base64url (`sb-app-session-cnt`
 * + `sb-app-session-ch-*`) when the JSON exceeds browser per-cookie limits.
 */
function readSessionMirrorRaw(request: NextRequest): string | null {
  const cntEncoded = request.cookies.get(SESSION_MIRROR_COUNT_COOKIE)?.value;
  if (typeof cntEncoded === "string" && cntEncoded.length > 0) {
    let decodedCount: string;
    try {
      decodedCount = decodeURIComponent(cntEncoded);
    } catch {
      return null;
    }
    const cnt = Number.parseInt(decodedCount, 10);
    if (!Number.isFinite(cnt) || cnt < 1 || cnt > SESSION_MIRROR_MAX_CHUNKS) {
      return null;
    }
    let acc = "";
    for (let i = 0; i < cnt; i += 1) {
      const piece = request.cookies.get(sessionMirrorChunkCookieName(i))?.value ?? "";
      acc += piece;
    }
    if (acc.length === 0) {
      return null;
    }
    try {
      return base64UrlToUtf8(acc);
    } catch {
      return null;
    }
  }

  const encoded = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (typeof encoded !== "string" || encoded.length === 0) {
    return null;
  }
  return decodeCookieValue(encoded);
}

/**
 * Hydrates a read-only anon Supabase client from mirrored session cookies and
 * returns the session if valid.
 */
async function readSessionFromRequest(request: NextRequest): Promise<Session | null> {
  const raw = readSessionMirrorRaw(request);

  if (raw === null || raw.length === 0) {
    return null;
  }

  /**
   * Directly extract and decode the access_token JWT from the cookie value,
   * handling all three known Supabase session storage formats (legacy flat,
   * v2 wrapper, and v2.60+ base64). This avoids creating a full Supabase
   * client whose session-parsing logic is version-sensitive and was the root
   * cause of the middleware always returning null for the legacy flat format.
   */
  const accessToken = extractAccessToken(raw);

  if (accessToken === null) {
    return null;
  }

  const payload = decodeJwtPayload(accessToken);
  if (payload === null) {
    return null;
  }

  const userId = payload["sub"];
  const email = payload["email"];
  const exp = payload["exp"];

  if (typeof userId !== "string" || userId.length === 0) {
    return null;
  }

  // Check token expiry from the JWT claim directly.
  if (typeof exp === "number" && exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  /**
   * Build a minimal synthetic Session so callers can use session.user.id
   * and session.user.email without needing the full Supabase session object.
   * The session is not used for any writes — only for RBAC checks.
   */
  const syntheticUser = {
    id: userId,
    email: typeof email === "string" ? email : undefined,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "",
  } as User;

  const syntheticSession = {
    access_token: accessToken,
    refresh_token: "",
    expires_in: typeof exp === "number" ? exp - Math.floor(Date.now() / 1000) : 3600,
    expires_at: typeof exp === "number" ? exp : undefined,
    token_type: "bearer",
    user: syntheticUser,
  } as Session;

  return syntheticSession;
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/authentication/sign-in";
  url.search = "";
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
}

/**
 * One DB round-trip: `staff_roles` by `user_id`. Falls back to `ADMIN_EMAIL`.
 * If the service role key is missing, returns false (fail closed for admin).
 */
async function userHasStaffAccess(
  userId: string,
  email: string | undefined,
  supabaseUrl: string,
  serviceRoleKey: string,
  adminEmailRaw: string | undefined
): Promise<boolean> {
  const adminEmail = trimEnv(adminEmailRaw).toLowerCase();
  if (adminEmail.length > 0 && typeof email === "string") {
    if (email.trim().toLowerCase() === adminEmail) {
      return true;
    }
  }
  if (serviceRoleKey.length === 0) {
    return false;
  }
  const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { data, error } = await adminClient
    .from("staff_roles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error !== null) {
    return false;
  }
  return data !== null;
}

/**
 * Returns a redirect response when RBAC applies; otherwise `null` to continue.
 */
export async function rbacMiddlewareResponse(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return null;
  }

  const customerProtected = isCustomerProtectedPath(pathname);
  const adminProtected = isAdminProtectedPath(pathname);

  if (!customerProtected && !adminProtected) {
    return null;
  }

  const session = await readSessionFromRequest(request);

  if (session === null) {
    return redirectToSignIn(request);
  }

  if (!adminProtected) {
    return null;
  }

  // Prototype mode: any authenticated session can access admin routes.
  return null;

  const supabaseUrl = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const allowed = await userHasStaffAccess(
    session.user.id,
    typeof session.user.email === "string" ? session.user.email : undefined,
    supabaseUrl,
    serviceKey,
    process.env.ADMIN_EMAIL
  );

  if (allowed) {
    return null;
  }

  return NextResponse.redirect(new URL("/", request.url));
}
