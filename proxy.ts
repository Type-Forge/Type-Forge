import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Next.js 16 renamed Middleware to Proxy (same functionality, file must be named proxy.ts).
//
// This is an OPTIMISTIC check: it only looks for the presence of the Auth.js session
// cookie to do fast redirects. The authoritative session verification happens in the
// protected route's server layout (app/profile/layout.tsx) via auth(), as recommended
// by the Next.js auth guide.

// Routes that require authentication. Add /account, /leaderboard, etc. here later.
const PROTECTED_PREFIXES = ["/profile"]

// Auth pages that an already-authenticated user should be redirected away from.
const AUTH_PAGES = ["/signin", "/signup"]

function hasSessionCookie(request: NextRequest): boolean {
  // Auth.js uses `authjs.session-token` (http) or `__Secure-authjs.session-token` (https).
  return (
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token")
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoggedIn = hasSessionCookie(request)

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  const isAuthPage = AUTH_PAGES.includes(pathname)

  // Unauthenticated user hitting a protected route -> send to sign in (with return path).
  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL("/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Authenticated user hitting sign in / sign up -> send home.
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Run on app routes but skip Next internals, API routes, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
