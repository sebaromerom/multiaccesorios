import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductDetail from './ProductDetail'
export const dynamic = 'force-dynamic'

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

  // ── 1. FILTRO DE IMÁGENES FALSAS O VACÍAS ──
  const rawCarouselImages = product.images.length > 0
      ? product.images.map(img => img.url)
      : product.imageUrl
      ? [product.imageUrl]
      : []

  const carouselImages = rawCarouselImages.filter(
    url => url && url.trim() !== "" && !url.includes("placehold")
  )

  const variantsWithImages = product.variants.map(v => ({
    id:       v.id,
    size:     v.size,
    stock:    v.stock,
    imageUrl: v.imageUrl && !v.imageUrl.includes("placehold") ? v.imageUrl : null,
    images:   v.images.map(img => img.url).filter(url => url && !url.includes("placehold")),
  }))

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAVEGACIÓN (BOTÓN VOLVER) ── */}
      {/* Reducimos el padding en móvil (px-4, pt-6) para no desperdiciar pantalla */}
      <div className="px-4 md:px-16 pt-6 md:pt-10 pb-0">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-zinc-400 hover:text-black transition-colors duration-200 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          Volver a la tienda
        </Link>
      </div>

      {/* ── DETALLE DEL PRODUCTO ── */}
      {/* Igualamos el px-4 en móvil para alinear con el botón de volver */}
      <div className="px-4 md:px-16 py-6 md:py-10 max-w-[1400px] mx-auto">
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