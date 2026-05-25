import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isUrlAdmin = req.nextUrl.pathname.startsWith("/admin")

    // Si intenta entrar a cualquier ruta /admin y su rol no es admin, lo rebota a la raíz
    if (isUrlAdmin && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  },
  {
    callbacks: {
      // Este callback asegura que el middleware corra solo si el usuario está autenticado
      authorized: ({ token }) => !!token,
    },
  }
)

// Aquí le dices al middleware qué rutas debe proteger de forma estricta
export const config = {
  matcher: ["/admin/:path*"],
}