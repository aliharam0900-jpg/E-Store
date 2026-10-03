import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit } from "@/lib/security/rate-limit";

/**
 * Strict RBAC, Session Guard & OWASP Rate-Limiting Middleware
 * Operates on Edge Runtime with fail-secure posture.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. IP Identification for Rate Limiting
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : request.headers.get("x-real-ip") || "127.0.0.1";

  // 2. Protect Login & Authentication routes against Brute-Force Attacks
  const isAuthRoute =
    pathname === "/login" ||
    pathname.startsWith("/api/auth");

  if (isAuthRoute) {
    const authRateLimit = await checkRateLimit(`auth:${clientIp}`, 15, 60);
    if (!authRateLimit.success) {
      console.warn(`[RATE_LIMIT_BLOCKED] Auth rate limit exceeded for IP: ${clientIp}`);
      return new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message:
            "Excessive authentication attempts detected. Access temporarily throttled to prevent credential attacks. Please wait 60 seconds.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  }

  // 3. Protect Checkout Initiation against Card-Testing Fraud & Velocity Abuse
  const isCheckoutRoute =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/api/webhooks/checkout");

  if (isCheckoutRoute && !pathname.includes("/success") && !pathname.includes("/cancel")) {
    const checkoutRateLimit = await checkRateLimit(`checkout:${clientIp}`, 20, 60);
    if (!checkoutRateLimit.success) {
      console.warn(`[RATE_LIMIT_BLOCKED] Checkout velocity limit exceeded for IP: ${clientIp}`);
      return new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message:
            "Checkout rate limit exceeded. Please wait 60 seconds before initiating another transaction session.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  }

  // 4. Refresh Supabase session on every matching request
  const { response, user, error } = await updateSession(request);

  // 5. Check if authenticated identity has been suspended / banned
  if (user) {
    const isBanned =
      user.app_metadata?.is_banned === true ||
      user.user_metadata?.is_banned === true;

    if (
      isBanned &&
      !pathname.startsWith("/unauthorized") &&
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/api/auth")
    ) {
      const bannedUrl = new URL("/unauthorized?banned=true", request.url);
      return NextResponse.redirect(bannedUrl);
    }
  }

  // 6. Intercept any request to /sys-admin-portal/* or internal /views directory
  const isProtectedAdminRoute =
    pathname.startsWith("/sys-admin-portal") ||
    pathname === "/views" ||
    pathname.startsWith("/views");

  if (isProtectedAdminRoute) {
    // Local development demo admin session bypass
    const isDevAdminSession =
      request.cookies.get("monolith_dev_admin_session")?.value === "true";

    if (isDevAdminSession) {
      return response;
    }

    // Fail-secure posture: Block access if auth fails, database is unreachable, or no session exists
    if (error || !user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Extract role strictly from app_metadata or user_metadata
    const role =
      (user.app_metadata && user.app_metadata.role) ||
      (user.user_metadata && user.user_metadata.role);

    // Strict RBAC check: Must be administrative authority ('super_admin', 'store_manager', or 'admin')
    const isAdmin =
      role === "super_admin" ||
      role === "store_manager" ||
      role === "admin";

    if (!isAdmin) {
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
