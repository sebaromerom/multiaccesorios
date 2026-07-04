import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import DeleteProductButton from './DeleteProductButton'
import { Badge } from '@/components/ui/badge'
import SyncBsaleButton from '@/components/admin/SyncBsaleButton'
import EnrichImagesButton from '@/components/admin/EnrichImagesButton'
import SafeProductImage from '@/components/SafeProductImage'
import { Category } from '@prisma/client'
import { requireAdminPage } from '@/lib/admin-auth'
import { getBranchStockByProductName, normalizeBsaleProductName } from '@/lib/bsale-branch-stock'

const CATEGORIES = ['Carcasa','Lamina','Cargador','Cable','Audifonos','Vapers','Computacion','Otros'] as const
const PER_PAGE = 50

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>
}) {
  await requireAdminPage()

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
  const branchStock = await getBranchStockByProductName(products.map((product) => product.name))

  // Preserve current filters after editing a product.
  const currentParams = new URLSearchParams()
  if (q) currentParams.set('q', q)
  if (cat) currentParams.set('cat', cat)
  if (page) currentParams.set('page', String(currentPage))
  const queryString = currentParams.toString()

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (params.q)    p.set('q', params.q)
    if (params.cat)  p.set('cat', params.cat)
    if (params.page) p.set('page', params.page)
    return `/admin/products?${p.toString()}`
  }

  return (
    <main className="w-full animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
        <div>
          <h1 className="admin-page-title">Productos</h1>
          <p className="admin-page-kicker">
            {total} productos en total
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="w-full sm:w-auto">
            <EnrichImagesButton />
          </div>
          <div className="w-full sm:w-auto">
            <SyncBsaleButton />
          </div>
          <Link href="/admin/products/new" className="w-full sm:w-auto">
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-[4px] px-5 py-5 font-bold text-xs">
              Agregar Producto
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <form method="GET" action="/admin/products" className="flex flex-col sm:flex-row flex-wrap gap-3 mb-5 bg-white border border-zinc-200 rounded-[6px] p-4">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Buscar por nombre..."
          className="h-11 px-3 rounded-[4px] border border-zinc-300 focus:border-red-600 outline-none text-sm w-full sm:w-72 transition-colors"
        />

        <select
          name="cat"
          defaultValue={cat ?? ''}
          className="h-11 px-3 rounded-[4px] border border-zinc-300 focus:border-red-600 outline-none text-sm bg-white transition-colors w-full sm:w-auto"
        >
          <option value="">Todas las categorias</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            type="submit"
            className="min-h-11 flex-1 sm:flex-none px-5 rounded-[4px] bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Buscar
          </button>

          {(q || cat) && (
            <Link
              href="/admin/products"
              className="min-h-11 flex-1 sm:flex-none px-6 border-2 border-zinc-300 text-zinc-500 text-xs uppercase tracking-widest font-bold hover:border-black hover:text-black transition-colors flex items-center justify-center"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {/* TABLA */}
      <div className="hidden md:block w-full overflow-x-auto border border-zinc-200 rounded-[6px] bg-white">
        <Table className="w-full min-w-[860px] table-fixed">
          <TableHeader>
            <TableRow className="border-b border-zinc-200 bg-zinc-50 hover:bg-zinc-50">
              <TableHead className="w-[72px] py-5 text-black font-black uppercase tracking-tight">Imagen</TableHead>
              <TableHead className="text-black font-black uppercase tracking-tight">Nombre</TableHead>
              <TableHead className="w-[115px] text-black font-black uppercase tracking-tight">Categoria</TableHead>
              <TableHead className="w-[115px] text-black font-black uppercase tracking-tight">Precio</TableHead>
              <TableHead className="w-[155px] text-black font-black uppercase tracking-tight">Stock</TableHead>
              <TableHead className="sticky right-0 z-10 w-[92px] bg-zinc-50 text-right text-black font-black uppercase tracking-tight shadow-[-10px_0_18px_rgba(255,255,255,.9)]">Acciones</TableHead>
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
                    <div className="relative h-12 w-12 overflow-hidden border border-zinc-200 bg-zinc-50">
                      <SafeProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="48px"
                        imageClassName="object-contain"
                      />
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="line-clamp-2 font-bold text-black text-sm uppercase tracking-tight">
                      {product.name}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="max-w-full truncate rounded-none bg-zinc-100 text-zinc-700 uppercase text-[10px] tracking-wider font-bold border-none px-2 py-1">
                      {product.category || 'Sin categoria'}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-black text-black whitespace-nowrap">
                    ${Number(product.price).toLocaleString('es-CL')}
                  </TableCell>

                  <TableCell>
                    <div className="max-w-[145px]">
                    {(() => {
                      const branches = branchStock.get(normalizeBsaleProductName(product.name)) ?? []
                      return (
                        <div className="space-y-1">
                          <Badge className={`rounded-none uppercase text-[10px] tracking-widest px-2 py-1 border-none ${
                            product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            App: {product.stock}
                          </Badge>
                          {branches.length > 0 ? (
                            <div className="space-y-0.5 text-[10px] font-bold text-zinc-600">
                              {branches.map((branch) => (
                                <p key={branch.officeId} className="flex justify-between gap-2">
                                  <span className="truncate">{branch.name}</span>
                                  <span>{branch.stock}</span>
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] font-semibold text-zinc-400">Sin match Bsale</p>
                          )}
                        </div>
                      )
                    })()}
                    </div>
                  </TableCell>

                  <TableCell className="sticky right-0 z-10 bg-white shadow-[-10px_0_18px_rgba(255,255,255,.9)]">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/products/${product.id}${queryString ? `?${queryString}` : ''}`} title="Editar producto">
                        <Button variant="outline" size="sm" className="h-9 w-9 rounded-[4px] border-zinc-300 p-0 hover:border-black hover:bg-black hover:text-white transition-all">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      <DeleteProductButton id={product.id} compact />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {products.length === 0 ? (
          <div className="rounded-[6px] border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500">
            No se encontraron productos
          </div>
        ) : products.map((product) => (
          <article key={product.id} className="rounded-[6px] border border-zinc-200 bg-white p-3">
            <div className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[4px] border border-zinc-200 bg-zinc-50">
                <SafeProductImage
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="64px"
                  imageClassName="object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug line-clamp-2">{product.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{product.category || 'Sin categoria'}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold text-red-600">${Number(product.price).toLocaleString('es-CL')}</span>
                  <span className={`text-[10px] font-bold ${product.stock <= 5 ? 'text-red-600' : 'text-zinc-500'}`}>{product.stock} unid.</span>
                </div>
                {(() => {
                  const branches = branchStock.get(normalizeBsaleProductName(product.name)) ?? []
                  return branches.length > 0 ? (
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-bold text-zinc-500">
                      {branches.map((branch) => (
                        <span key={branch.officeId} className="rounded bg-zinc-100 px-2 py-1">
                          {branch.name}: {branch.stock}
                        </span>
                      ))}
                    </div>
                  ) : null
                })()}
              </div>
            </div>
            <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3">
              <Link href={`/admin/products/${product.id}${queryString ? `?${queryString}` : ''}`} className="flex-1">
                <Button variant="outline" size="sm" className="min-h-11 w-full rounded-[4px] text-xs font-bold">Editar</Button>
              </Link>
              <DeleteProductButton id={product.id} />
            </div>
          </article>
        ))}
      </div>

      {/* PAGINACION */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-zinc-200 gap-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500 text-center sm:text-left">
            Pagina {currentPage} de {totalPages} - {total} productos
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {currentPage > 1 && (
              <Link href={buildUrl({ q, cat, page: String(currentPage - 1) })}>
                <Button variant="outline" size="sm" className="rounded-none border-zinc-300 uppercase text-[10px] tracking-widest font-bold">
                  Ant.
                </Button>
              </Link>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | '...')[]>((acc, p, i) => {
                if (i > 0 && p - (acc[acc.length - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-2 py-1 text-zinc-400 text-xs flex items-center">...</span>
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
                  Sig.
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
