import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } },
  })

  type Order = (typeof orders)[0]
  type OrderItem = Order['items'][0]

  const statusLabel = (status: string) =>
    status === 'completed' ? 'Completada' : status === 'cancelled' ? 'Cancelada' : 'Pendiente'

  const statusClass = (status: string) =>
    status === 'completed'
      ? 'bg-green-100 text-green-700'
      : status === 'cancelled'
        ? 'bg-red-100 text-red-700'
        : 'bg-zinc-100 text-zinc-700'

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="admin-page-title">Pedidos</h1>
        <p className="admin-page-kicker">{orders.length} pedidos registrados</p>
      </div>

      <div className="hidden md:block border border-zinc-200 rounded-[6px] bg-white overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="border-b border-zinc-200 bg-zinc-50 hover:bg-zinc-50">
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-sm text-zinc-500">
                  No hay pedidos registrados aun.
                </TableCell>
              </TableRow>
            )}
            {orders.map((order: Order) => (
              <TableRow key={order.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <TableCell className="font-mono text-xs text-zinc-500">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                <TableCell>
                  <p className="text-sm font-bold">{order.customerName ?? 'Sin nombre'}</p>
                  {order.customerPhone && <p className="text-xs text-zinc-500">{order.customerPhone}</p>}
                  {order.customerEmail && <p className="text-xs text-zinc-500">{order.customerEmail}</p>}
                </TableCell>
                <TableCell>
                  <p className="text-sm font-semibold">{order.deliveryType === 'retiro' ? 'Retiro en tienda' : 'Starken'}</p>
                  <p className="text-xs text-zinc-500">
                    {order.deliveryType === 'retiro' ? order.deliverySucursal : [order.deliveryAddress, order.deliveryCity].filter(Boolean).join(', ')}
                  </p>
                </TableCell>
                <TableCell>
                  {order.items.map((item: OrderItem) => (
                    <p key={item.id} className="text-xs text-zinc-700">{item.product.name} x{item.quantity}</p>
                  ))}
                </TableCell>
                <TableCell className="font-bold">${order.total.toLocaleString('es-CL')}</TableCell>
                <TableCell>
                  <Badge className={`rounded-[3px] text-[10px] uppercase ${statusClass(order.status)}`}>{statusLabel(order.status)}</Badge>
                </TableCell>
                <TableCell className="text-right text-xs text-zinc-500">
                  {new Date(order.createdAt).toLocaleDateString('es-CL')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-[6px] border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500">
            No hay pedidos registrados aun.
          </div>
        ) : orders.map((order: Order) => (
          <article key={order.id} className="rounded-[6px] border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{order.customerName ?? 'Sin nombre'}</p>
                <p className="mt-1 text-[11px] font-mono text-zinc-500">#{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <Badge className={`rounded-[3px] text-[10px] uppercase ${statusClass(order.status)}`}>{statusLabel(order.status)}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-3 text-xs">
              <div><p className="text-zinc-500">Total</p><p className="mt-1 font-bold text-red-600">${order.total.toLocaleString('es-CL')}</p></div>
              <div><p className="text-zinc-500">Entrega</p><p className="mt-1 font-semibold">{order.deliveryType === 'retiro' ? 'Retiro en tienda' : 'Starken'}</p></div>
            </div>
            <div className="mt-3 text-xs text-zinc-600">
              {order.items.map((item: OrderItem) => <p key={item.id}>{item.product.name} x{item.quantity}</p>)}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
