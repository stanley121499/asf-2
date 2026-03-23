import { NextResponse, type NextRequest } from "next/server";

// Admin route auth is handled client-side in NavbarSidebarLayout (AuthGuard),
// because the app uses localStorage for Supabase sessions — the server-side
// cookie-based client never sees the session, causing false redirects.
// Middleware just passes all requests through.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
