import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import DeleteDiscountButton from './DeleteDiscountButton'

type DiscountWithProduct = {
  id: string
  name: string
  type: string
  value: number
  minQuantity: number
  active: boolean
  createdAt: Date
  product: { id: string; name: string } | null
}

export default async function DiscountsPage() {
  const discounts = await prisma.discountRule.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl">Descuentos</h1>
        <Link href="/admin/discounts/new">
          <Button>Agregar Descuento</Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Cant. mínima</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discounts.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No hay descuentos aún
              </TableCell>
            </TableRow>
          )}
          {discounts.map((discount: DiscountWithProduct) => (
            <TableRow key={discount.id}>
              <TableCell className="font-medium">{discount.name}</TableCell>
              <TableCell>{discount.type}</TableCell>
              <TableCell>
                {discount.type === 'percentage'
                  ? `${discount.value}%`
                  : discount.type === '2x1'
                  ? '2x1'
                  : `$${discount.value.toLocaleString('es-CL')}`}
              </TableCell>
              <TableCell>{discount.minQuantity}</TableCell>
              <TableCell>{discount.product?.name ?? 'Todos'}</TableCell>
              <TableCell>
                <Badge variant={discount.active ? 'default' : 'secondary'}>
                  {discount.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2">
                <Link href={`/admin/discounts/${discount.id}`}>
                  <Button variant="outline" size="sm">Editar</Button>
                </Link>
                <DeleteDiscountButton id={discount.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}