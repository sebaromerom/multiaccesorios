import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const discount = await prisma.discountRule.update({
    where: { id },
    data: {
      name: body.name,
      type: body.type,
      value: body.value,
      minQuantity: body.minQuantity,
      active: body.active,
      productId: body.productId ?? null,
    },
  })

  return NextResponse.json(discount)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.discountRule.delete({ where: { id } })

  return NextResponse.json({ success: true })
}