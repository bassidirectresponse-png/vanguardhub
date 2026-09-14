import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.get("authjs.session-token") || request.cookies.get("__Secure-authjs.session-token");
  if (!hasSession) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api/webhooks|api/health|api/auth|login|_next|favicon.ico).*)"] };
