import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductDetail from './ProductDetail'

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
      variants: {
        include: {
          images: { orderBy: { order: 'asc' } },
        },
      },
    },
  })

  if (!product) notFound()

  const carouselImages =
    product.images.length > 0
      ? product.images.map(img => img.url)
      : product.imageUrl
      ? [product.imageUrl]
      : []

  const variantsWithImages = product.variants.map(v => ({
    id:       v.id,
    size:     v.size,
    stock:    v.stock,
    imageUrl: v.imageUrl,
    images:   v.images.map(img => img.url),
  }))

  return (
    <div className="min-h-screen bg-white">

      {/* ── BACK ─────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-16 pt-10 pb-0">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-zinc-400 hover:text-black transition-colors duration-200 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          Volver a la tienda
        </Link>
      </div>

      {/* ── PRODUCT ──────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-16 py-10 max-w-[1400px] mx-auto">
        <ProductDetail
          product={{
            id:          product.id,
            name:        product.name,
            price:       product.price,
            stock:       product.stock,
            category:    product.category,
            description: product.description,
          }}
          variants={variantsWithImages}
          carouselImages={carouselImages}
        />
      </div>

    </div>
  )
}