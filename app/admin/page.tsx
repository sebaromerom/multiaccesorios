'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Control de redirección seguro
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
      router.push('/api/auth/signin')
    }
  }, [status, session, router])

  // Mientras valida la sesión, mostramos una pantalla limpia para evitar parpadeos visuales
  if (status === 'loading' || !session || session.user?.role !== 'admin') {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center bg-[#FAF9F5]">
        <p className="text-[10px] tracking-[0.4em] uppercase text-zinc-400 font-mono animate-pulse">
          Validando credenciales...
        </p>
      </div>
    )
  }

  const adminLinks = [
    { href: '/admin/products', num: '01', title: 'Productos', desc: 'Gestionar productos y stock' },
    { href: '/admin/discounts', num: '02', title: 'Descuentos', desc: 'Crear y gestionar descuentos' },
    { href: '/admin/orders', num: '03', title: 'Ordenes', desc: 'Ver y gestionar ordenes' },
    { href: '/admin/metrics', num: '04', title: 'Metricas', desc: 'Analiticas de ventas y rendimiento' },
  ]

  return (
    <div className="animate-fade-in px-8 py-10 max-w-5xl mx-auto">
      <div className="mb-16">
        <p className="text-[10px] tracking-[0.4em] uppercase text-zinc-400 font-bold mb-3">
          Multiaccesorios — Panel interno
        </p>
        <h1 className="text-7xl text-black font-black uppercase tracking-tighter leading-none">
          Admin
        </h1>
      </div>

      <div className="flex flex-col divide-y divide-zinc-100">
        {/* ENLACES NORMALES DEL PANEL */}
        {adminLinks.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between py-8 hover:bg-zinc-50 transition-all duration-300 px-2"
            style={{ animation: 'fadeInUp 0.4s ease forwards', animationDelay: `${index * 0.08}s`, opacity: 0 }}
          >
            <div className="flex items-center gap-10">
              <span className="text-red-600 text-xs tracking-widest uppercase font-black w-6">
                {item.num}
              </span>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-black group-hover:translate-x-1 transition-transform duration-300">
                  {item.title}
                </h2>
                <p className="text-xs text-zinc-400 uppercase tracking-widest mt-1">{item.desc}</p>
              </div>
            </div>
            <span className="text-zinc-300 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300 text-2xl font-light">
              &#8594;
            </span>
          </Link>
        ))}

        {/* ── BOTÓN DE LOG OUT (FILA 05) ── */}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="group w-full flex items-center justify-between py-8 hover:bg-red-50/50 transition-all duration-300 px-2 text-left border-b border-zinc-100"
          style={{ 
            animation: 'fadeInUp 0.4s ease forwards', 
            animationDelay: `${adminLinks.length * 0.08}s`, 
            opacity: 0 
          }}
        >
          <div className="flex items-center gap-10">
            <span className="text-zinc-400 group-hover:text-red-600 text-xs tracking-widest uppercase font-black w-6 transition-colors">
              05
            </span>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-500 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300">
                Cerrar Sesión
              </h2>
              <p className="text-xs text-zinc-400 uppercase tracking-widest mt-1 group-hover:text-red-600/70 transition-colors">
                Salir del perfil de administrador de forma segura
              </p>
            </div>
          </div>
          <span className="text-zinc-300 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300 text-2xl font-light">
            ✕
          </span>
        </button>
      </div>
    </div>
  )
}