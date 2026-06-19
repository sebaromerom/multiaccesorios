import { prisma } from '@/lib/prisma'
import {
  buildValidatedOrderPricing,
  decrementLocalOrderStock,
  OrderStockError,
  OrderValidationError,
} from '@/lib/orders'
import { NextResponse } from 'next/server'

const PAYMENT_METHODS = ['transfer', 'pay_on_pickup', 'payment_link', 'webpay'] as const
type PaymentMethod = (typeof PAYMENT_METHODS)[number]

function normalizePaymentMethod(method: unknown): PaymentMethod {
  return PAYMENT_METHODS.includes(method as PaymentMethod)
    ? method as PaymentMethod
    : 'transfer'
}

function buildPaymentState(method: PaymentMethod) {
  const reference = `MA-${Date.now().toString(36).toUpperCase()}`

  if (method === 'pay_on_pickup') {
    return {
      paymentStatus: 'pay_on_pickup',
      paymentProvider: 'manual',
      paymentReference: reference,
      paymentUrl: null,
    }
  }

  if (method === 'payment_link') {
    return {
      paymentStatus: 'payment_link_pending',
      paymentProvider: 'manual_link',
      paymentReference: reference,
      paymentUrl: null,
    }
  }

  if (method === 'webpay') {
    return {
      paymentStatus: 'webpay_pending',
      paymentProvider: 'webpay',
      paymentReference: reference,
      paymentUrl: null,
    }
  }

  return {
    paymentStatus: 'pending_transfer',
    paymentProvider: 'manual_transfer',
    paymentReference: reference,
    paymentUrl: null,
  }
}

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
  try {
    const body = await req.json()
    const paymentMethod = normalizePaymentMethod(body.paymentMethod)

    if (paymentMethod === 'webpay') {
      return NextResponse.json(
        { error: 'Webpay debe iniciarse desde la ruta de pagos' },
        { status: 400 }
      )
    }

    const paymentState = buildPaymentState(paymentMethod)

    const order = await prisma.$transaction(async tx => {
      const pricing = await buildValidatedOrderPricing(tx, body.items ?? [])

      const createdOrder = await tx.order.create({
        data: {
          total: pricing.total,
          status: body.status ?? 'pending',
          paymentMethod,
          ...paymentState,
          customerName:     body.customerName     ?? null,
          customerPhone:    body.customerPhone     ?? null,
          customerEmail:    body.customerEmail     ?? null,
          deliveryType:     body.deliveryType      ?? 'retiro',
          deliverySucursal: body.deliverySucursal  ?? null,
          deliveryAddress:  body.deliveryAddress   ?? null,
          deliveryCity:     body.deliveryCity      ?? null,
          deliveryNotes:    body.deliveryNotes     ?? null,
          items: {
            create: pricing.items.map((item) => ({
              productId: item.productId,
              quantity:  item.quantity,
              unitPrice: item.unitPrice,
              size:      item.size,
            })),
          },
        },
      })

      await decrementLocalOrderStock(tx, pricing.items)

      return createdOrder
    })

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof OrderValidationError || error instanceof OrderStockError
          ? error.message
          : 'Error al procesar la orden',
      },
      { status: 400 }
    )
  }
}
