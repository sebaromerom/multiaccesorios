import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  ImageOff,
  PackageCheck,
  ReceiptText,
  Tag,
} from 'lucide-react'

export default async function AdminPage() {
  const [productCount, availableProductCount, orderCount, pendingOrders, discountCount, missingImages] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { stock: { gt: 0 } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.discountRule.count({ where: { active: true } }),
    prisma.product.count({
      where: {
        OR: [{ imageUrl: null }, { imageUrl: '' }],
      },
    }),
  ])

  const sections = [
    { href: '/admin/products', label: 'Productos', detail: `${productCount} cargados en catálogo`, value: availableProductCount, icon: Boxes },
    { href: '/admin/orders', label: 'Pedidos', detail: 'Ventas y entregas', value: orderCount, icon: ReceiptText },
    { href: '/admin/discounts', label: 'Descuentos', detail: 'Reglas comerciales activas', value: discountCount, icon: Tag },
    { href: '/admin/metrics', label: 'Métricas', detail: 'Rendimiento de la tienda', value: 'Ver', icon: CircleDollarSign },
  ]

  return (
    <main>
      <div className="mb-7">
        <h1 className="admin-page-title">Resumen del negocio</h1>
        <p className="admin-page-kicker">Control rápido del catálogo y las ventas de Multi Accesorios.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group bg-white border border-zinc-200 rounded-[6px] p-4 min-h-32 hover:border-red-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="w-9 h-9 rounded-[5px] bg-zinc-100 grid place-items-center group-hover:bg-red-50 transition-colors">
                  <Icon className="size-4 text-zinc-600 group-hover:text-red-600" />
                </span>
                <ArrowRight className="size-4 text-zinc-300 group-hover:text-red-600" />
              </div>
              <p className="text-2xl font-extrabold">{section.value}</p>
              <p className="text-sm font-bold mt-1">{section.label}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{section.detail}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        <section className="bg-white border border-zinc-200 rounded-[6px]">
          <div className="px-5 py-4 border-b border-zinc-200">
            <h2 className="text-sm font-bold">Acciones frecuentes</h2>
            <p className="text-[11px] text-zinc-500 mt-1">Atajos para las tareas del día.</p>
          </div>
          <div className="divide-y divide-zinc-100">
            <Link href="/admin/products/new" className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50">
              <Boxes className="size-4 text-red-600" />
              <span className="text-sm font-semibold">Agregar un producto al catálogo</span>
              <ArrowRight className="ml-auto size-4 text-zinc-400" />
            </Link>
            <Link href="/admin/orders" className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50">
              <PackageCheck className="size-4 text-red-600" />
              <span className="text-sm font-semibold">Revisar pedidos pendientes</span>
              <span className="ml-auto text-xs font-bold text-red-600">{pendingOrders}</span>
            </Link>
            <Link href="/admin/discounts/new" className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50">
              <Tag className="size-4 text-red-600" />
              <span className="text-sm font-semibold">Crear una promoción</span>
              <ArrowRight className="ml-auto size-4 text-zinc-400" />
            </Link>
          </div>
        </section>

        <aside className="bg-white border border-zinc-200 rounded-[6px] p-5">
          <div className="w-10 h-10 rounded-[5px] bg-red-50 grid place-items-center mb-4">
            <ImageOff className="size-5 text-red-600" />
          </div>
          <p className="text-3xl font-extrabold">{missingImages}</p>
          <h2 className="text-sm font-bold mt-1">Productos sin imagen cargada</h2>
          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
            Revisa los productos que aún necesitan una fotografía confiable.
          </p>
          <Link
            href="/admin/products"
            className="mt-5 h-10 rounded-[4px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            Revisar catálogo
            <ArrowRight className="size-4" />
          </Link>
        </aside>
      </div>
    </main>
  )
}
