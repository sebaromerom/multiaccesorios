import { prisma } from '@/lib/prisma'
import {
  buildValidatedOrderPricing,
  decrementLocalOrderStock,
  OrderStockError,
  OrderValidationError,
} from '@/lib/orders'
import { NextResponse } from 'next/server'
import { adminUnauthorizedResponse, isAdminRequest } from '@/lib/admin-auth'
import { getCheckoutConfig, getEnabledPaymentMethods } from '@/lib/checkout-config'
import { CheckoutValidationError, validateCheckoutDetails } from '@/lib/checkout-validation'
import { enforceRateLimit } from '@/lib/rate-limit'

const PAYMENT_METHODS = ['transfer', 'pay_on_pickup', 'payment_link', 'webpay', 'mercadopago'] as const
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

  if (method === 'mercadopago') {
    return {
      paymentStatus: 'mercadopago_pending',
      paymentProvider: 'mercadopago',
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
  if (!(await isAdminRequest())) {
    return adminUnauthorizedResponse()
  }

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
  const limited = enforceRateLimit(req, 'orders', 10, 10 * 60_000)
  if (limited) return limited

  try {
    const body = await req.json()
    const paymentMethod = normalizePaymentMethod(body.paymentMethod)
    const checkoutConfig = getCheckoutConfig()
    const enabledPaymentMethods = getEnabledPaymentMethods(checkoutConfig)

    if (!enabledPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'El método de pago seleccionado no está disponible.' },
        { status: 400 }
      )
    }

    if (body.deliveryType === 'despacho' && !checkoutConfig.shippingEnabled) {
      return NextResponse.json(
        { error: 'El despacho aún no está habilitado. Selecciona retiro en tienda.' },
        { status: 400 }
      )
    }
    const checkoutDetails = validateCheckoutDetails(body)

    if (paymentMethod === 'webpay' || paymentMethod === 'mercadopago') {
      return NextResponse.json(
        { error: 'Este pago online debe iniciarse desde la ruta de pagos' },
        { status: 400 }
      )
    }

    const paymentState = buildPaymentState(paymentMethod)

    const order = await prisma.$transaction(async tx => {
      const pricing = await buildValidatedOrderPricing(tx, body.items ?? [])

      const createdOrder = await tx.order.create({
        data: {
          total: pricing.total,
          status: 'pending',
          paymentMethod,
          ...paymentState,
          ...checkoutDetails,
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
        error: error instanceof OrderValidationError ||
          error instanceof OrderStockError ||
          error instanceof CheckoutValidationError
          ? error.message
          : 'Error al procesar la orden',
      },
      { status: 400 }
    )
  }
}
