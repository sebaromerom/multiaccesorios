'use client'

import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // 1. Si está cargando la sesión o si YA estás en el login, no hagas nada
    if (status === "loading" || pathname === "/admin/login") return

    // 2. Si no hay sesión o el rol no es admin, te manda a iniciar sesión
    if (status === "unauthenticated" || (session?.user?.role !== "admin")) {
      router.push("/admin/login")
    }
  }, [status, session, pathname, router])

  // 3. EXCEPCIÓN CLAVE: Si la URL es exactamente el login, renderiza la pantalla de una sin trabas
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  // 4. Mientras verifica las credenciales del panel, muestra una pantalla de carga limpia
  if (status === "loading" || !session || session.user?.role !== "admin") {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center bg-[#FAF9F5]">
        <p className="text-[10px] tracking-[0.4em] uppercase text-zinc-400 font-mono animate-pulse">
          Autenticando administrador...
        </p>
      </div>
    )
  }

  // 5. Si todo está perfecto y es admin, despliega el panel normal
  return <>{children}</>
}