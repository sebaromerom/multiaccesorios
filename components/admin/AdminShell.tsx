'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
import {
  BarChart3,
  Boxes,
  ChevronRight,
  Megaphone,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  ShoppingBag,
  Store,
  Tag,
  X,
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Productos', icon: Boxes },
  { href: '/admin/orders', label: 'Pedidos', icon: ReceiptText },
  { href: '/admin/discounts', label: 'Descuentos', icon: Tag },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/metrics', label: 'Métricas', icon: BarChart3 },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (pathname === '/admin/login') return children

  const current = NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  )

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null)
    window.location.href = '/'
  }

  return (
    <div className="admin-shell">
      <style>{`
        body:has(.admin-shell) .public-navbar { display: none; }
        body:has(.admin-shell) main { padding: 0 !important; }
        .admin-shell { min-height: 100vh; background: #f6f6f5; color: #171717; font-family: var(--font-inter), Inter, sans-serif; letter-spacing: 0; }
        .admin-sidebar { position: fixed; inset: 0 auto 0 0; width: 244px; background: #111; color: #fff; z-index: 50; display: flex; flex-direction: column; }
        .admin-brand { height: 78px; padding: 0 22px; display: flex; align-items: center; gap: 11px; border-bottom: 1px solid #292929; }
        .admin-brand-mark { position: relative; width: 36px; height: 36px; border-radius: 6px; background: #fff; display: block; overflow: hidden; flex: 0 0 auto; }
        .admin-nav { padding: 18px 12px; display: flex; flex-direction: column; gap: 4px; }
        .admin-nav-link { display: flex; align-items: center; gap: 11px; min-height: 44px; padding: 0 12px; border-radius: 5px; color: #b7b7b7; font-size: 13px; font-weight: 600; transition: .16s ease; }
        .admin-nav-link:hover { background: #202020; color: #fff; }
        .admin-nav-link.active { background: #e30613; color: #fff; }
        .admin-sidebar-footer { margin-top: auto; padding: 14px 12px 18px; border-top: 1px solid #292929; }
        .admin-main { min-height: 100vh; padding-left: 244px; }
        .admin-topbar { height: 78px; background: #fff; border-bottom: 1px solid #e5e5e5; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; position: sticky; top: 0; z-index: 30; }
        .admin-content { padding: 28px 30px 48px; max-width: 1600px; margin: 0 auto; }
        .admin-mobile-button { display: none; }
        .admin-sidebar-close { display: none; }
        .admin-backdrop { display: none; }
        .admin-page-title { font-size: 30px; line-height: 1.1; font-weight: 800; letter-spacing: 0; }
        .admin-page-kicker { color: #737373; font-size: 12px; margin-top: 5px; }
        @media (max-width: 860px) {
          .admin-shell { min-height: 100dvh; }
          .admin-sidebar { width: min(82vw, 300px); padding-bottom: env(safe-area-inset-bottom); transform: translateX(-100%); transition: transform .2s ease; box-shadow: 12px 0 30px rgba(0,0,0,.16); }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-backdrop.open { display: block; position: fixed; inset: 0; z-index: 40; border: 0; background: rgba(0,0,0,.42); }
          .admin-main { padding-left: 0; }
          .admin-topbar { min-height: 64px; padding: 0 16px; padding-top: env(safe-area-inset-top); }
          .admin-content { padding: 20px 14px calc(36px + env(safe-area-inset-bottom)); }
          .admin-mobile-button { display: inline-grid; place-items: center; width: 44px; height: 44px; border: 1px solid #ddd; border-radius: 5px; }
          .admin-sidebar-close { display: inline-flex; }
          .admin-page-title { font-size: 23px; }
        }
      `}</style>

      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <BrandLogo className="admin-brand-mark" sizes="36px" />
          <div>
            <p className="text-sm font-extrabold leading-tight">MULTI ACCESORIOS</p>
            <p className="text-[10px] text-zinc-400">Panel de administración</p>
          </div>
          <button
            type="button"
            className="admin-sidebar-close ml-auto text-zinc-400 hover:text-white"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`admin-nav-link ${active ? 'active' : ''}`}
              >
                <Icon className="size-[17px]" />
                <span>{item.label}</span>
                {active && <ChevronRight className="ml-auto size-4" />}
              </Link>
            )
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/shop" className="admin-nav-link">
            <Store className="size-[17px]" />
            <span>Ver tienda</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="admin-nav-link w-full"
          >
            <LogOut className="size-[17px]" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>
      <button
        type="button"
        className={`admin-backdrop ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
        aria-label="Cerrar menu administrativo"
      />

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="admin-mobile-button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-sm font-bold">{current?.label ?? 'Administración'}</p>
              <p className="text-[11px] text-zinc-500 hidden sm:block">Gestión de tienda y catálogo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
            <ShoppingBag className="size-4 text-red-600" />
            Multi Accesorios
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  )
}
