import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths
  if (pathname === "/login" || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("__session")?.value;

  // Firebase Auth clients set a token via API after login; for SSR we use
  // the session cookie if available. If not, client-side redirect handles
  // unauthenticated users in protected layout.
  if (!token && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

function isProtectedPath(pathname: string): boolean {
  const protectedPrefixes = [
    "/",
    "/wardrobe",
    "/outfits",
    "/packing",
    "/laundry",
    "/statistics",
    "/coach",
    "/settings",
  ];
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
