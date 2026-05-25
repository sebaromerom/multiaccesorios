// app/admin/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Panel de Administración - CARCASAS STORE',
  description: 'Gestión de inventario y órdenes',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    /* Agregamos la clase 'es-ruta-admin'. 
      Al renderizarse aquí, el layout raíz (app/layout.tsx) la detectará 
      y automáticamente ocultará el NavBar y reseteará los paddings y fondos.
    */
    <div className="w-full min-h-screen bg-zinc-950 text-white es-ruta-admin">
      {children}
    </div>
  )
}