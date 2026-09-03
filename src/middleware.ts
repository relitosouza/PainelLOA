import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";

// Rotas públicas que não exigem autenticação
const PUBLIC_PATHS = [
  "/login",
  "/favicon.ico",
  "/brasao.png",
  "/api/auth/login",
  "/api/auth/logout",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir assets estáticos e rotas públicas
  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Verificar cookie de sessão
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  // Se não estiver autenticado, redirecionar para a tela de login
  if (!session) {
    // Se for requisição de API interna não pública, responder com 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ authenticated: false, error: "Acesso não autorizado. Faça login." }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
