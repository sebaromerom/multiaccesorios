import type { Metadata } from 'next'
import AdminShell from '@/components/admin/AdminShell'

export const metadata: Metadata = {
  title: 'Panel de Administracion - Multi Accesorios',
  description: 'Gestion de inventario y ordenes',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full min-h-screen bg-[#f6f6f5] text-black es-ruta-admin">
      <AdminShell>{children}</AdminShell>
    </div>
  )
}
