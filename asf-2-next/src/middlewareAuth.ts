import { createClient, type Session, type User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/database.types";

/** Same name as browser `storageKey` / session cookie mirror. */
const SESSION_COOKIE_NAME = "sb-app-session";

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
 * Hydrates a read-only anon Supabase client from the `sb-app-session` cookie
 * (URI-encoded by the browser mirror) and returns the session if valid.
 */
async function readSessionFromRequest(request: NextRequest): Promise<Session | null> {
  const encoded = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (typeof encoded !== "string" || encoded.length === 0) {
    return null;
  }
  const raw = decodeCookieValue(encoded);
  const supabaseUrl = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (supabaseUrl.length === 0 || anonKey.length === 0) {
    return null;
  }

  const snapshot = raw;
  const client = createClient<Database>(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          if (key === SESSION_COOKIE_NAME) {
            return snapshot;
          }
          return null;
        },
        setItem: () => {},
        removeItem: () => {},
      },
      storageKey: SESSION_COOKIE_NAME,
    },
  });

  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error !== null || session === null) {
    return null;
  }
  if (sessionExpired(session)) {
    return null;
  }
  const user: User | undefined = session.user;
  if (typeof user.id !== "string" || user.id.length === 0) {
    return null;
  }
  return session;
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
