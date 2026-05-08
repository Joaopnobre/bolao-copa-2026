import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin-only
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // VIEWER: bloqueia ações e configurações
    if (token?.role === "VIEWER") {
      // Não pode palpitar (página individual de palpite)
      if (pathname.startsWith("/predictions/")) {
        return NextResponse.redirect(new URL("/predictions", req.url));
      }
      // Não pode acessar configurações
      if (pathname.startsWith("/settings")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
