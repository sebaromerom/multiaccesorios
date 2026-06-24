import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildValidatedOrderPricing, OrderValidationError } from '@/lib/orders'
import { buildWebpayIds, getWebpayBaseUrl, getWebpayTransaction } from '@/lib/webpay'
import { getCheckoutConfig } from '@/lib/checkout-config'
import { CheckoutValidationError, validateCheckoutDetails } from '@/lib/checkout-validation'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'webpay-create', 10, 10 * 60_000)
  if (limited) return limited

  try {
    const body = await req.json()
    const checkoutConfig = getCheckoutConfig()

    if (!checkoutConfig.webpayEnabled) {
      return NextResponse.json(
        { error: 'Webpay aún no está habilitado para este ambiente.' },
        { status: 503 }
      )
    }

    if (body.deliveryType === 'despacho' && !checkoutConfig.shippingEnabled) {
      return NextResponse.json(
        { error: 'El despacho aún no está habilitado. Selecciona retiro en tienda.' },
        { status: 400 }
      )
    }
    const checkoutDetails = validateCheckoutDetails(body)

    const pricing = await buildValidatedOrderPricing(prisma, body.items ?? [])

    if (pricing.total <= 0) {
      return NextResponse.json(
        { error: 'El total no es valido para Webpay' },
        { status: 400 }
      )
    }

    const order = await prisma.order.create({
      data: {
        total: pricing.total,
        status: 'pending',
        paymentMethod: 'webpay',
        paymentStatus: 'webpay_pending',
        paymentProvider: 'webpay',
        ...checkoutDetails,
        items: {
          create: pricing.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            size: item.size,
          })),
        },
      },
    })

    const { buyOrder, sessionId } = buildWebpayIds(order.id)
    const returnUrl = `${getWebpayBaseUrl(req)}/api/payments/webpay/commit`
    const transaction = getWebpayTransaction()

    try {
      const response = await transaction.create(
        buyOrder,
        sessionId,
        pricing.total,
        returnUrl
      )

      if (!response.token || !response.url) {
        throw new Error('Webpay no entrego url/token')
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentReference: buyOrder,
          paymentUrl: response.url,
          webpayToken: response.token,
          webpayBuyOrder: buyOrder,
          webpaySessionId: sessionId,
        },
      })

      return NextResponse.json({
        orderId: order.id,
        token: response.token,
        url: response.url,
      })
    } catch (error) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'payment_failed',
          paymentStatus: 'webpay_create_failed',
          paymentReference: buyOrder,
          webpayBuyOrder: buyOrder,
          webpaySessionId: sessionId,
        },
      })

      console.error('Webpay create error', error)

      return NextResponse.json(
        { error: 'No pudimos iniciar Webpay. Intenta nuevamente.' },
        { status: 502 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof OrderValidationError || error instanceof CheckoutValidationError
          ? error.message
          : 'Pedido invalido para Webpay',
      },
      { status: 400 }
    )
  }
}
