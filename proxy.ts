import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // 1. Dejar pasar libremente las APIs de Auth Y tu página de login personalizada
  if (pathname.startsWith("/api/auth") || pathname === "/admin/login") {
    return NextResponse.next()
  }

  // 2. Intentamos obtener la sesión del usuario
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // 3. Proteger las rutas de administración
  if (pathname.startsWith("/admin")) {
    // Si no está logueado o no es administrador, lo mandamos a tu login personalizado
    if (!token || token.role !== "admin") {
      const loginUrl = new URL("/admin/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname) 
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Asegura capturar todas las variantes internas
  matcher: ["/admin/:path*", "/api/auth/:path*"],
}