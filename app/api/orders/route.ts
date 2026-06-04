import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { product: true },
      },
    },
  })
  return NextResponse.json(orders)
}

export async function POST(req: Request) {
  const body = await req.json()

  const order = await prisma.$transaction(async tx => {
    const createdOrder = await tx.order.create({
      data: {
        total: body.total,
        status: body.status ?? 'pending',
        // Datos del cliente
        customerName:     body.customerName     ?? null,
        customerPhone:    body.customerPhone     ?? null,
        customerEmail:    body.customerEmail     ?? null,
        // Entrega
        deliveryType:     body.deliveryType      ?? 'retiro',
        deliverySucursal: body.deliverySucursal  ?? null,
        deliveryAddress:  body.deliveryAddress   ?? null,
        deliveryCity:     body.deliveryCity      ?? null,
        deliveryNotes:    body.deliveryNotes     ?? null,
        items: {
          create: body.items.map(
            (item: {
              productId: string
              quantity: number
              unitPrice: number
              size?: string
            }) => ({
              productId: item.productId,
              quantity:  item.quantity,
              unitPrice: item.unitPrice,
              size:      item.size ?? null,
            })
          ),
        },
      },
    })

    // Solo ajustamos el espejo local en Supabase. Bsale queda read-only para esta app.
    for (const item of body.items) {
      if (item.size) {
        await tx.productVariant.updateMany({
          where: { productId: item.productId, size: item.size },
          data: { stock: { decrement: item.quantity } },
        })
      }

      await tx.product.update({
        where: { id: item.productId },
        data:  { stock: { decrement: item.quantity } },
      })
    }

    return createdOrder
  })

  return NextResponse.json(order)
}
