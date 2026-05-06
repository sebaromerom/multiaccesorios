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
    <div>
      <h1 className="text-5xl mb-8">Órdenes</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay órdenes aún
              </TableCell>
            </TableRow>
          )}
          {orders.map((order: OrderWithItems) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
              <TableCell>
                {order.items.map((item: OrderItemWithProduct) => (
                  <div key={item.id} className="text-sm">
                    {item.product.name}
                    {item.size && (
                      <span className="text-xs text-muted-foreground ml-1 tracking-widest uppercase">
                        ({item.size})
                      </span>
                    )}
                    {' '}x{item.quantity}
                  </div>
                ))}
              </TableCell>
              <TableCell>${order.total.toLocaleString('es-CL')}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    order.status === 'completed'
                      ? 'default'
                      : order.status === 'cancelled'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {order.status === 'completed'
                    ? 'Completada'
                    : order.status === 'cancelled'
                    ? 'Cancelada'
                    : 'Pendiente'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {new Date(order.createdAt).toLocaleDateString('es-CL')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}