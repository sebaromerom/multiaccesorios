import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      price: body.price,
      stock: body.stock,
      imageUrl: body.imageUrl ?? null,
      category: body.category ?? null,
    },
  })

  if (body.images && Array.isArray(body.images)) {
    await prisma.productImage.deleteMany({ where: { productId: id } })
    if (body.images.length > 0) {
      await prisma.productImage.createMany({
        data: body.images.map((url: string, index: number) => ({
          url,
          order: index,
          productId: id,
        })),
      })
    }
  }

  return NextResponse.json(product)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.orderItem.deleteMany({ where: { productId: id } })
  await prisma.discountRule.deleteMany({ where: { productId: id } })
  await prisma.productImage.deleteMany({ where: { productId: id } })
  await prisma.product.delete({ where: { id } })

  return NextResponse.json({ success: true })
}