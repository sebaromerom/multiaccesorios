import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isUrlAdmin = req.nextUrl.pathname.startsWith("/admin")

    // Si intenta entrar a una ruta /admin y NO tiene el rol 'admin', lo mandamos a la raíz
    if (isUrlAdmin && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // 1. IMPORTANTE: Dejar pasar libremente las rutas de la API de autenticación 
        // para que NextAuth pueda procesar el login y el logout sin bloquearse.
        if (pathname.startsWith("/api/auth")) {
          return true
        }

        // 2. Para cualquier otra subruta de /admin, sí exigimos que exista un token activo
        return !!token
      },
    },
  }
)

export const config = {
  // Protege estrictamente todo lo que esté dentro de /admin y sus subcarpetas
  matcher: ["/admin/:path*"],
}