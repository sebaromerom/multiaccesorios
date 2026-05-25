import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // 1. IMPORTANTE: Si es una ruta de la API de autenticación, la dejamos pasar DE UNA
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // 2. Intentamos obtener el token del usuario (la sesión) de forma nativa
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // 3. Si intenta entrar a /admin...
  if (pathname.startsWith("/admin")) {
    // Si no está logueado o el rol no es admin, lo mandamos al login oficial de NextAuth
    if (!token || token.role !== "admin") {
      const loginUrl = new URL("/api/auth/signin", req.url)
      // Esto le dice a NextAuth que, después de loguearse, lo devuelva a la página que intentaba ver
      loginUrl.searchParams.set("callbackUrl", pathname) 
      return NextResponse.redirect(loginUrl)
    }
  }

  // Si todo está en orden (es admin o no es una ruta protegida), continúa normal
  return NextResponse.next()
}

// Indicamos que el middleware intercepte solo las llamadas de autenticación y el panel admin
export const config = {
  matcher: ["/admin/:path*", "/api/auth/:path*"],
}