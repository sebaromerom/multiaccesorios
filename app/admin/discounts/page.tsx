import Link from 'next/link'
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
import DeleteDiscountButton from './DeleteDiscountButton'
import { requireAdminPage } from '@/lib/admin-auth'

export default async function DiscountsPage() {
  await requireAdminPage()

  const discounts = await prisma.discountRule.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  })

  const valueLabel = (discount: (typeof discounts)[0]) =>
    discount.type === 'percentage'
      ? `${discount.value}%`
      : discount.type === '2x1'
        ? '2X1'
        : `$${discount.value.toLocaleString('es-CL')}`

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="admin-page-title">Descuentos</h1>
          <p className="admin-page-kicker">{discounts.length} reglas configuradas</p>
        </div>
        <Link href="/admin/discounts/new">
          <Button className="bg-red-600 hover:bg-red-700 text-white rounded-[4px] px-5 py-5 font-bold text-xs">
            Agregar descuento
          </Button>
        </Link>
      </div>

      <div className="hidden md:block border border-zinc-200 rounded-[6px] bg-white overflow-x-auto">
        <Table className="min-w-[850px]">
          <TableHeader>
            <TableRow className="border-b border-zinc-200 bg-zinc-50 hover:bg-zinc-50">
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Cant. minima</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-sm text-zinc-500">
                  No hay descuentos configurados aun.
                </TableCell>
              </TableRow>
            )}
            {discounts.map((discount) => (
              <TableRow key={discount.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <TableCell className="font-bold">{discount.name}</TableCell>
                <TableCell className="text-xs uppercase text-zinc-500">{discount.type}</TableCell>
                <TableCell className="font-bold text-red-600">{valueLabel(discount)}</TableCell>
                <TableCell>{discount.minQuantity}</TableCell>
                <TableCell className="text-sm text-zinc-500">{discount.product?.name ?? 'Todos los productos'}</TableCell>
                <TableCell>
                  <Badge className={`rounded-[3px] text-[10px] uppercase ${discount.active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {discount.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/discounts/${discount.id}`}><Button variant="outline" size="sm">Editar</Button></Link>
                    <DeleteDiscountButton id={discount.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {discounts.length === 0 ? (
          <div className="rounded-[6px] border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500">
            No hay descuentos configurados aun.
          </div>
        ) : discounts.map((discount) => (
          <article key={discount.id} className="rounded-[6px] border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{discount.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{discount.product?.name ?? 'Todos los productos'}</p>
              </div>
              <Badge className={`rounded-[3px] text-[10px] uppercase ${discount.active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                {discount.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-zinc-100 pt-3">
              <div><p className="text-[11px] text-zinc-500">Beneficio</p><p className="mt-1 text-lg font-extrabold text-red-600">{valueLabel(discount)}</p></div>
              <Link href={`/admin/discounts/${discount.id}`} className="min-h-11 rounded-[4px] border border-zinc-300 px-4 text-xs font-bold flex items-center">Editar</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
