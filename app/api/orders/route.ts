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

  const order = await prisma.order.create({
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

  // Descontar stock
  for (const item of body.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data:  { stock: { decrement: item.quantity } },
    })
  }

  return NextResponse.json(order)
}
