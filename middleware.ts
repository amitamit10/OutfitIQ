import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth is handled client-side via AuthProvider + MainLayout.
// The middleware is kept for future SSR session-cookie protection but
// currently passes all requests through. Firebase signInWithPopup does
// not set a __session cookie, so redirecting here would break login.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
