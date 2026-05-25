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
    /* Cambiamos 'bg-zinc-950' por 'bg-[#FAF9F5]' (o 'bg-zinc-50') 
      y cambiamos 'text-white' por 'text-black' para que haga match 
      perfecto con los textos oscuros de tu panel.
    */
    <div className="w-full min-h-screen bg-[#FAF9F5] text-black es-ruta-admin">
      {children}
    </div>
  )
}