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
    <div className="animate-fade-in px-4">
      {/* SECCIÓN DE CABECERA: Título en diagonal y Botón Invertido */}
      <div className="flex justify-between items-center mb-16 mt-8">
        <h1 
          className="text-7xl text-black font-[900] uppercase tracking-tighter leading-none"
          style={{ 
            transform: 'skewX(-8deg)', 
            fontStyle: 'italic',
            display: 'inline-block'
          }}
        >
          Descuentos
        </h1>
        
        <Link href="/admin/discounts/new">
          <Button className="bg-black hover:bg-white text-white hover:text-black border-2 border-black rounded-none uppercase tracking-widest px-10 py-7 font-black transition-all duration-300 text-sm">
            Agregar Descuento
          </Button>
        </Link>
      </div>

      {/* TABLA DE ALTO IMPACTO */}
      <div className="border-t-4 border-black">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-black hover:bg-transparent">
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm py-4">Nombre</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm">Tipo</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm">Valor</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm">Cant. mínima</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm">Producto</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm">Estado</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tighter text-sm text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-zinc-400 font-medium italic text-xl">
                  No hay descuentos configurados aún.
                </TableCell>
              </TableRow>
            )}
            {discounts.map((discount: DiscountWithProduct) => (
              <TableRow 
                key={discount.id} 
                className="border-b border-zinc-200 group hover:bg-zinc-900 transition-all duration-200"
              >
                <TableCell className="font-black text-black group-hover:text-white uppercase tracking-tight text-lg">
                  {discount.name}
                </TableCell>
                <TableCell className="text-zinc-500 group-hover:text-zinc-400 uppercase text-xs font-bold">
                  {discount.type}
                </TableCell>
                <TableCell className="font-black text-black group-hover:text-white text-xl">
                  {discount.type === 'percentage'
                    ? `${discount.value}%`
                    : discount.type === '2x1'
                    ? '2X1'
                    : `$${discount.value.toLocaleString('es-CL')}`}
                </TableCell>
                <TableCell className="text-zinc-600 group-hover:text-zinc-400 font-mono font-bold">
                  {discount.minQuantity}
                </TableCell>
                <TableCell className="text-zinc-500 group-hover:text-zinc-400 italic font-medium">
                  {discount.product?.name ?? 'TODOS LOS PRODUCTOS'}
                </TableCell>
                <TableCell>
                  <Badge 
                    className={`rounded-none uppercase text-[10px] tracking-[0.2em] px-3 py-1 font-bold ${
                      discount.active 
                        ? 'bg-black text-white group-hover:bg-white group-hover:text-black' 
                        : 'bg-zinc-200 text-zinc-500 shadow-none'
                    }`}
                  >
                    {discount.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2 justify-end py-6">
                  <Link href={`/admin/discounts/${discount.id}`}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-none border-2 border-zinc-300 group-hover:border-white group-hover:bg-white group-hover:text-black transition-all uppercase text-[10px] font-black"
                    >
                      Editar
                    </Button>
                  </Link>
                  <DeleteDiscountButton id={discount.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}