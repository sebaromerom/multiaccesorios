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
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  type OrderWithItems = (typeof orders)[0]
  type OrderItemWithProduct = NonNullable<OrderWithItems>['items'][0]

  return (
    <div className="animate-fade-in px-4">
      <div className="mb-16 mt-8">
        <h1
          className="text-7xl text-black font-[900] uppercase tracking-tighter leading-none"
          style={{ transform: 'skewX(-8deg)', fontStyle: 'italic', display: 'inline-block' }}
        >
          Órdenes
        </h1>
      </div>

      <div className="border-t-4 border-black">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-black hover:bg-transparent">
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm py-4">ID</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm">Cliente</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm">Entrega</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm">Productos</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm">Total</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm">Estado</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm text-right">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-zinc-400 font-medium italic text-xl">
                  No hay órdenes registradas aún.
                </TableCell>
              </TableRow>
            )}
            {orders.map((order: OrderWithItems) => (
              <TableRow
                key={order.id}
                className="border-b border-zinc-200 group hover:bg-black transition-all duration-200"
              >
                {/* ID */}
                <TableCell className="font-mono text-xs font-bold text-zinc-500 group-hover:text-zinc-400">
                  #{order.id.slice(0, 8).toUpperCase()}
                </TableCell>

                {/* Cliente */}
                <TableCell>
                  <p className="font-bold text-sm text-black group-hover:text-white uppercase tracking-tight">
                    {order.customerName ?? '—'}
                  </p>
                  {order.customerPhone && (
                    <p className="text-xs text-zinc-500 group-hover:text-zinc-400">
                      📞 {order.customerPhone}
                    </p>
                  )}
                  {order.customerEmail && (
                    <p className="text-xs text-zinc-500 group-hover:text-zinc-400">
                      ✉️ {order.customerEmail}
                    </p>
                  )}
                </TableCell>

                {/* Entrega */}
                <TableCell>
                  {order.deliveryType === 'retiro' ? (
                    <div>
                      <Badge className="rounded-none bg-zinc-800 text-white text-[10px] uppercase tracking-widest mb-1">
                        🏪 Retiro
                      </Badge>
                      <p className="text-xs text-zinc-500 group-hover:text-zinc-400">
                        {order.deliverySucursal ?? '—'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Badge className="rounded-none bg-blue-600 text-white text-[10px] uppercase tracking-widest mb-1">
                        🚚 Starken
                      </Badge>
                      <p className="text-xs text-zinc-500 group-hover:text-zinc-400">
                        {order.deliveryAddress}
                        {order.deliveryCity ? `, ${order.deliveryCity}` : ''}
                      </p>
                    </div>
                  )}
                  {order.deliveryNotes && (
                    <p className="text-xs italic text-zinc-400 group-hover:text-zinc-500 mt-1">
                      {order.deliveryNotes}
                    </p>
                  )}
                </TableCell>

                {/* Productos */}
                <TableCell>
                  {order.items.map((item: OrderItemWithProduct) => (
                    <div key={item.id} className="text-sm font-bold text-black group-hover:text-white uppercase tracking-tight">
                      {item.product.name}
                      <span className="ml-2 text-zinc-500 group-hover:text-zinc-400">x{item.quantity}</span>
                    </div>
                  ))}
                </TableCell>

                {/* Total */}
                <TableCell className="font-black text-black group-hover:text-white text-lg">
                  ${order.total.toLocaleString('es-CL')}
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <Badge
                    className={`rounded-none uppercase text-[10px] tracking-[0.2em] px-3 py-1 font-bold shadow-none ${
                      order.status === 'completed'
                        ? 'bg-black text-white group-hover:bg-white group-hover:text-black'
                        : order.status === 'cancelled'
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-200 text-zinc-600 group-hover:bg-zinc-800 group-hover:text-zinc-300'
                    }`}
                  >
                    {order.status === 'completed'
                      ? 'Completada'
                      : order.status === 'cancelled'
                      ? 'Cancelada'
                      : 'Pendiente'}
                  </Badge>
                </TableCell>

                {/* Fecha */}
                <TableCell className="text-right text-zinc-600 group-hover:text-zinc-400 font-bold text-sm uppercase">
                  {new Date(order.createdAt).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
