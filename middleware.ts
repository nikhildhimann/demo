import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "ADMIN";
    const pathname = req.nextUrl.pathname;

    // Role check for all admin-only routes.
    if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || pathname.startsWith("/api/upload")) && !isAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Admin access required" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Protect /admin, /api/admin, and admin uploads.
        if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || pathname.startsWith("/api/upload")) {
          return token?.role === "ADMIN";
        }
        // Allow public access to all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/upload/:path*",
  ],
};
