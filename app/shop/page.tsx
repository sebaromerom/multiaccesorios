import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AddToCartButton from './AddToCartButton'
import Link from 'next/link'
import SearchBar from './SearchBar'
import { Suspense } from 'react'

const CATEGORIES = [
  { value: 'real-madrid', label: 'Real Madrid' },
  { value: 'barcelona', label: 'Barcelona' },
  { value: 'manchester-united', label: 'Man United' },
  { value: 'liverpool', label: 'Liverpool' },
  { value: 'juventus', label: 'Juventus' },
  { value: 'bayern', label: 'Bayern' },
  { value: 'psg', label: 'PSG' },
  { value: 'seleccion-chile', label: 'Chile' },
  { value: 'seleccion-argentina', label: 'Argentina' },
  { value: 'seleccion-brasil', label: 'Brasil' },
  { value: 'retro', label: 'Retro' },
  { value: 'edicion-especial', label: 'Edicion especial' },
]

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>
}) {
  const { q, cat } = await searchParams

  const products = await prisma.product.findMany({
    where: {
      stock: { gt: 0 },
      ...(cat ? { category: cat } : {}),
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { variants: true },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-6xl mb-2">Camisetas Retro</h1>
        <p className="text-muted-foreground text-sm tracking-widest uppercase">Ediciones limitadas — Linares</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/shop">
          <button className={`px-3 py-1.5 text-xs tracking-widest border rounded transition-all duration-200 ${!cat ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground'}`}>
            Todos
          </button>
        </Link>
        {CATEGORIES.map(c => (
          <Link key={c.value} href={`/shop?cat=${c.value}`}>
            <button className={`px-3 py-1.5 text-xs tracking-widest border rounded transition-all duration-200 ${cat === c.value ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground'}`}>
              {c.label}
            </button>
          </Link>
        ))}
      </div>

      <div className="flex justify-between items-center mb-8">
        <Suspense>
          <SearchBar />
        </Suspense>
        {q && (
          <p className="text-sm text-muted-foreground">
            {products.length} resultado{products.length !== 1 ? 's' : ''} para "{q}"
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
        {products.length === 0 && (
          <p className="text-muted-foreground col-span-3 py-12 text-center">
            {q ? `No se encontraron productos para "${q}"` : 'No hay productos en esta categoria.'}
          </p>
        )}
        {products.map((product, index) => (
          <div
            key={product.id}
            className="bg-background p-6 flex flex-col gap-4 group"
            style={{
              opacity: 0,
              animation: `fadeInUp 0.5s ease forwards`,
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <Link href={`/shop/${product.id}`}>
              <div className="aspect-square bg-secondary overflow-hidden cursor-pointer">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs tracking-widest uppercase">
                    Sin imagen
                  </div>
                )}
              </div>
            </Link>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <Link href={`/shop/${product.id}`}>
                  <h3 className="text-xl hover:text-muted-foreground transition-colors duration-200">{product.name}</h3>
                </Link>
                <Badge variant="outline" className="text-xs">{product.stock} uds</Badge>
              </div>
              {product.description && (
                <p className="text-sm text-muted-foreground">{product.description}</p>
              )}
              <div className="flex justify-between items-center mt-2">
                <span className="text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  ${product.price.toLocaleString('es-CL')}
                </span>
                {product.variants.length > 0 ? (
                  <Link href={`/shop/${product.id}`}>
                    <Button size="sm" variant="outline">Ver tallas</Button>
                  </Link>
                ) : (
                  <AddToCartButton product={{ id: product.id, name: product.name, price: product.price }} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}