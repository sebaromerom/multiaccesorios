import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import ProductCarousel from '@/components/ProductCarousel'
import AddToCartWithSize from '../AddToCartWithSize'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' } },
      variants: true,
    },
  })

  if (!product) notFound()

  const carouselImages = product.images.length > 0
    ? product.images
    : product.imageUrl
      ? [{ id: 'main', url: product.imageUrl, order: 0 }]
      : []

  return (
    <div style={{ animation: 'fadeIn 0.4s ease forwards' }}>
      <Link
        href="/shop"
        className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block"
      >
        ← Volver a la tienda
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
        <div style={{ animation: 'fadeInUp 0.5s ease forwards' }}>
          <ProductCarousel images={carouselImages} name={product.name} />
        </div>

        <div
          className="flex flex-col gap-6 justify-center"
          style={{ animation: 'fadeInUp 0.5s ease 0.15s forwards', opacity: 0 }}
        >
          <div>
            <h1 className="text-5xl mb-2">{product.name}</h1>
            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-4xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              ${product.price.toLocaleString('es-CL')}
            </span>
            {product.variants.length === 0 && (
              <Badge variant={product.stock > 0 ? 'default' : 'secondary'}>
                {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'}
              </Badge>
            )}
          </div>

          {product.stock > 0 || product.variants.some(v => v.stock > 0) ? (
            <div style={{ animation: 'fadeInUp 0.5s ease 0.3s forwards', opacity: 0 }}>
              <AddToCartWithSize
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  stock: product.stock,
                }}
                variants={product.variants}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground tracking-widest uppercase">Producto agotado</p>
          )}
        </div>
      </div>
    </div>
  )
}