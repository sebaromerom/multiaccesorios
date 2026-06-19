import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { adminUnauthorizedResponse, isAdminRequest } from '@/lib/admin-auth'

interface VariantImageInput {
  url: string
}

interface VariantInput {
  id: string
  stock: number
  images?: VariantImageInput[]
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminRequest())) {
      return adminUnauthorizedResponse()
    }

    const { id } = await params
    const body = await req.json()

    // 1. Actualizar producto principal e imágenes en una transacción corta
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name:        body.name,
          description: body.description,
          price:       body.price,
          stock:       body.stock,
          imageUrl:    body.imageUrl ?? null,
          category:    body.category ?? null,
        },
      })

      if (body.images && Array.isArray(body.images)) {
        await tx.productImage.deleteMany({ where: { productId: id } })
        if (body.images.length > 0) {
          await tx.productImage.createMany({
            data: body.images.map((img: string | { url: string }, index: number) => ({
              url:       typeof img === 'string' ? img : img.url,
              order:     index,
              productId: id,
            })),
          })
        }
      }
    })

    // 2. Actualizar variantes en paralelo fuera de la transacción
    // (evita el timeout de 5000ms con muchas variantes)
    if (body.variants && Array.isArray(body.variants)) {
      await Promise.all(
        (body.variants as VariantInput[]).map(async (variant) => {
          // Borrar imágenes anteriores de esta variante
          await prisma.productVariantImage.deleteMany({
            where: { variantId: variant.id },
          })

          // Actualizar stock + imageUrl + crear nuevas imágenes
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              stock:    variant.stock,
              imageUrl: variant.images?.[0]?.url ?? null,
              images: {
                create: (variant.images ?? []).map((img, index) => ({
                  url:   img.url,
                  order: index,
                })),
              },
            },
          })
        })
      )
    }

    const updatedProduct = await prisma.product.findUnique({ where: { id } })
    return NextResponse.json(updatedProduct)

  } catch (error) {
    console.error('Error al actualizar el producto:', error)
    return NextResponse.json(
      { error: 'Error interno al actualizar el producto y sus variantes' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminRequest())) {
      return adminUnauthorizedResponse()
    }

    const { id } = await params

    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { productId: id } }),
      prisma.discountRule.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar el producto:', error)
    return NextResponse.json(
      { error: 'Error interno al eliminar el producto' },
      { status: 500 }
    )
  }
}
