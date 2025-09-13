import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Redirect to sign in if no token
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // Force role selection if not set
    if (!(token.user as { role?: string })?.role && !pathname.startsWith("/role-selection") && !pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/role-selection", req.url))
    }

    // Check role-based access
    if (pathname.startsWith("/seller") && (token.user as { role?: string })?.role !== "SELLER") {
      return NextResponse.redirect(new URL("/buyer/appointments", req.url))
    }

    if (pathname.startsWith("/buyer") && (token.user as { role?: string })?.role !== "BUYER") {
      return NextResponse.redirect(new URL("/seller/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    "/seller/:path*",
    "/buyer/:path*",
    "/appointments/:path*"
  ]
}
