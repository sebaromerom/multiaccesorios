import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import Image from 'next/image'
import DeleteProductButton from './DeleteProductButton'
import { Badge } from '@/components/ui/badge'
import SyncBsaleButton from '@/components/admin/SyncBsaleButton'
import { Category } from '@prisma/client'

const CATEGORIES = ['Carcasa','Lamina','Cargador','Cable','Audifonos','Vapers','Computacion','Otros'] as const
const PER_PAGE = 50

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>
}) {
  const { q, cat, page } = await searchParams
  const currentPage = Math.max(1, Number(page ?? 1))
  const skip = (currentPage - 1) * PER_PAGE

  const where = {
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    ...(cat && CATEGORIES.includes(cat as Category) ? { category: cat as Category } : {}),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: PER_PAGE,
    }),
    prisma.product.count({ where }),
  ])

  const totalPages = Math.ceil(total / PER_PAGE)

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (params.q)    p.set('q', params.q)
    if (params.cat)  p.set('cat', params.cat)
    if (params.page) p.set('page', params.page)
    return `/admin/products?${p.toString()}`
  }

  return (
    <main className="w-full px-4 md:px-8 py-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <h1
            className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-black leading-none"
            style={{ transform: 'skewX(-8deg)', fontStyle: 'italic' }}
          >
            Productos
          </h1>
          <p className="text-zinc-500 mt-2 text-sm uppercase tracking-widest">
            {total} productos en total
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="w-full sm:w-auto">
            <SyncBsaleButton />
          </div>
          <Link href="/admin/products/new" className="w-full sm:w-auto">
            <Button className="w-full bg-black hover:bg-white text-white hover:text-black border-2 border-black rounded-none uppercase tracking-widest px-6 py-6 font-bold transition-all duration-300">
              Agregar Producto
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <form method="GET" action="/admin/products" className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Buscar por nombre..."
          className="h-10 px-4 border-2 border-zinc-200 focus:border-black outline-none text-sm uppercase tracking-wide w-full sm:w-72 transition-colors"
        />

        <select
          name="cat"
          defaultValue={cat ?? ''}
          className="h-10 px-4 border-2 border-zinc-200 focus:border-black outline-none text-sm uppercase tracking-wide bg-white transition-colors w-full sm:w-auto"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            type="submit"
            className="h-10 flex-1 sm:flex-none px-6 bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors"
          >
            Buscar
          </button>

          {(q || cat) && (
            <Link
              href="/admin/products"
              className="h-10 flex-1 sm:flex-none px-6 border-2 border-zinc-300 text-zinc-500 text-xs uppercase tracking-widest font-bold hover:border-black hover:text-black transition-colors flex items-center justify-center"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {/* TABLA */}
      <div className="w-full overflow-x-auto border-t-2 border-black -mx-4 px-4 sm:mx-0 sm:px-0">
        <Table className="w-full min-w-[1000px]">
          <TableHeader>
            <TableRow className="border-b-2 border-black hover:bg-transparent">
              <TableHead className="w-[80px] py-5 text-black font-black uppercase tracking-tight">Imagen</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tight">Nombre</TableHead>
              <TableHead className="w-[140px] text-black font-black uppercase tracking-tight">Categoría</TableHead>
              <TableHead className="w-[120px] text-black font-black uppercase tracking-tight">Precio</TableHead>
              <TableHead className="w-[100px] text-black font-black uppercase tracking-tight">Stock</TableHead>
              <TableHead className="w-[140px] text-right text-black font-black uppercase tracking-tight">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-24 text-zinc-400 italic">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <TableCell className="py-3">
                    {/* Validación estricta para strings vacíos o URLs corruptas */}
                    {product.imageUrl && product.imageUrl.trim() !== "" && product.imageUrl.startsWith('http') ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 object-cover border border-zinc-200"
                        unoptimized // 👈 Evita que Next.js intente optimizar los links dinámicos de placehold.co
                      />
                    ) : (
                      <div className="w-14 h-14 bg-zinc-100 border border-dashed border-zinc-300 flex items-center justify-center text-[10px] uppercase tracking-widest text-zinc-400">
                        N/A
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-black text-sm uppercase tracking-tight">
                      {product.name}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="rounded-none bg-zinc-100 text-zinc-700 uppercase text-[10px] tracking-wider font-bold border-none px-3 py-1">
                      {product.category || 'Sin categoría'}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-black text-black whitespace-nowrap">
                    ${Number(product.price).toLocaleString('es-CL')}
                  </TableCell>

                  <TableCell>
                    <Badge className={`rounded-none uppercase text-[10px] tracking-widest px-3 py-1 border-none ${
                      product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      {product.stock} unid.
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="outline" size="sm" className="rounded-none border-zinc-300 hover:border-black hover:bg-black hover:text-white uppercase text-[10px] tracking-widest font-bold transition-all">
                          Editar
                        </Button>
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

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-zinc-200 gap-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500 text-center sm:text-left">
            Página {currentPage} de {totalPages} — {total} productos
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {currentPage > 1 && (
              <Link href={buildUrl({ q, cat, page: String(currentPage - 1) })}>
                <Button variant="outline" size="sm" className="rounded-none border-zinc-300 uppercase text-[10px] tracking-widest font-bold">
                  ← Ant.
                </Button>
              </Link>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (acc[acc.length - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-2 py-1 text-zinc-400 text-xs flex items-center">…</span>
                ) : (
                  <Link key={p} href={buildUrl({ q, cat, page: String(p) })}>
                    <Button
                      variant={p === currentPage ? 'default' : 'outline'}
                      size="sm"
                      className={`rounded-none uppercase text-[10px] tracking-widest font-bold ${
                        p === currentPage ? 'bg-black text-white' : 'border-zinc-300'
                      }`}
                    >
                      {p}
                    </Button>
                  </Link>
                )
              )}

            {currentPage < totalPages && (
              <Link href={buildUrl({ q, cat, page: String(currentPage + 1) })}>
                <Button variant="outline" size="sm" className="rounded-none border-zinc-300 uppercase text-[10px] tracking-widest font-bold">
                  Sig. →
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  )
}