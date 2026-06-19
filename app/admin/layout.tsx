import type { Metadata } from 'next'
import AdminShell from '@/components/admin/AdminShell'

export const metadata: Metadata = {
  title: 'Panel de Administración - Multi Accesorios',
  description: 'Gestión de inventario y órdenes',
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
