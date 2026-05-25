import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth" // Revisa que la ruta a tus authOptions sea la correcta
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // 1. Si no hay sesión o el rol no es admin, rebota al login
  if (!session || session.user?.role !== "admin") {
    redirect("/admin/login")
  }

  // 2. Retorno corregido (sin etiquetas duplicadas)
  return <>{children}</>
}