import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "ADMIN";
    const pathname = req.nextUrl.pathname;

    // Redirect /admin to the enquiries dashboard if logged in as admin
    if (pathname === "/admin" && isAdmin) {
      return NextResponse.redirect(new URL("/admin/enquiries", req.url));
    }

    // Role check for all /admin routes
    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Protect /admin and /api/admin
        if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
          return !!token;
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
  ],
};
