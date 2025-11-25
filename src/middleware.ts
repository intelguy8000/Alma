import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/reset-password", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If trying to access public route while authenticated, redirect to dashboard
  if (isPublicRoute && isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If trying to access protected route while not authenticated, redirect to login
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't need protection
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
