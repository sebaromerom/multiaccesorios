import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import DeleteProductButton from './DeleteProductButton'

export default async function ProductsPage() {
  // 1. Fetch de datos
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // 2. Definición del tipo mediante inferencia (Clave para que pase el build de Vercel)
  type ProductType = (typeof products)[0];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-bold italic tracking-tighter">Productos</h1>
        <Link href="/admin/products/new">
          <Button>Agregar Producto</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No hay productos aún
                </TableCell>
              </TableRow>
            ) : (
              // 3. Aplicamos el tipo ProductType al parámetro del map
              products.map((product: ProductType) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center text-xs text-muted-foreground border">
                        N/A
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {product.description}
                  </TableCell>
                  <TableCell className="font-mono">
                    ${product.price.toLocaleString('es-CL')}
                  </TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="outline" size="sm">Editar</Button>
                      </Link>
                      <DeleteProductButton id={product.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}