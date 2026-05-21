import { NextResponse, type NextRequest } from "next/server";

import { rbacMiddlewareResponse } from "./middlewareAuth";

/**
 * Edge RBAC: best-effort session from mirrored cookies (`sb-app-session` or
 * chunked `sb-app-session-cnt` + `sb-app-session-ch-*`; see sessionCookieSync).
 * Client-side auth remains authoritative.
 */
export async function middleware(request: NextRequest) {
  const rbac = await rbacMiddlewareResponse(request);
  if (rbac !== null) {
    return rbac;
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
